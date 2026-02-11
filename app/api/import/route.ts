import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import Papa from 'papaparse';
import { validateAddressByNetwork } from '../../../lib/validation';
import { normalizeUid } from '../../../lib/normalization';

function parseCsv(csv: string) {
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    throw new Error(parsed.errors[0].message);
  }
  return parsed.data as Record<string, string>[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, csv, file_id, folder_id, dry_run, unknown_actions } = body as {
    type: string;
    csv: string;
    file_id?: number;
    folder_id?: number;
    dry_run?: boolean;
    unknown_actions?: Record<string, { action: 'create' | 'unknown' | 'skip'; entity_type_code?: string }>;
  };

  const rows = parseCsv(csv);
  const errors: Array<{ row: number; error: string }> = [];
  const unknownUids = new Set<string>();
  let ok = 0;
  let skipped = 0;

  const [entityTypes, flags, addressRoles, incidentTypes, networks, categories, entities] = await Promise.all([
    prisma.entityType.findMany({ select: { code: true } }),
    prisma.flag.findMany({ select: { code: true } }),
    prisma.addressRole.findMany({ select: { code: true } }),
    prisma.incidentType.findMany({ select: { code: true } }),
    prisma.network.findMany({ select: { code: true } }),
    prisma.entityCategory.findMany({ select: { category_code: true } }),
    prisma.entity.findMany({ select: { entity_uid: true } }),
  ]);

  const entityTypeSet = new Set(entityTypes.map((e) => e.code));
  const flagSet = new Set(flags.map((e) => e.code));
  const roleSet = new Set(addressRoles.map((e) => e.code));
  const incidentTypeSet = new Set(incidentTypes.map((e) => e.code));
  const networkSet = new Set(networks.map((e) => e.code));
  const categorySet = new Set(categories.map((e) => e.category_code));
  const entityUidSet = new Set(entities.map((e) => e.entity_uid));
  const unknownActions = unknown_actions || {};

  async function ensurePlaceholder(uid: string, typeCode?: string) {
    const code = typeCode && entityTypeSet.has(typeCode) ? typeCode : 'organization';
    if (!entityTypeSet.has(code)) {
      throw new Error(`unknown entity_type: ${code}`);
    }
    await prisma.entity.upsert({
      where: { entity_uid: uid },
      create: { entity_uid: uid, entity_name: uid, entity_type_code: code },
      update: { entity_name: uid, entity_type_code: code },
    });
    entityUidSet.add(uid);
  }

  async function ensureUnknownEntity() {
    const code = entityTypeSet.has('organization') ? 'organization' : Array.from(entityTypeSet)[0];
    if (!code) throw new Error('no entity_type available');
    await prisma.entity.upsert({
      where: { entity_uid: 'UNKNOWN' },
      create: { entity_uid: 'UNKNOWN', entity_name: 'UNKNOWN', entity_type_code: code },
      update: { entity_name: 'UNKNOWN', entity_type_code: code },
    });
    entityUidSet.add('UNKNOWN');
  }

  if (type === 'entities') {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const entity_uid = normalizeUid(r.entity_uid || '');
        if (!entity_uid) throw new Error('entity_uid required');
        const entity_type_code = (r.entity_type || '').trim();
        if (!entity_type_code) throw new Error('entity_type required');
        if (!entityTypeSet.has(entity_type_code)) throw new Error(`unknown entity_type: ${entity_type_code}`);

        const parent_entity = (r.parent_entity || '').trim();
        if (parent_entity && !entityUidSet.has(parent_entity)) {
          throw new Error(`unknown parent_entity: ${parent_entity}`);
        }

        if (!dry_run) {
          await prisma.entity.upsert({
            where: { entity_uid },
            create: {
              entity_uid,
              entity_name: r.entity_name || entity_uid,
              entity_type_code,
              parent_entity_uid: parent_entity || null,
              entity_description: r.entity_description || null,
              entity_country: r.entity_country || null,
              comment: r.comment || null,
            },
            update: {
              entity_name: r.entity_name || entity_uid,
              entity_type_code,
              parent_entity_uid: parent_entity || null,
              entity_description: r.entity_description || null,
              entity_country: r.entity_country || null,
              comment: r.comment || null,
            },
          });

          if (file_id) {
            await prisma.entitiesFileMap.upsert({
              where: { file_id_entity_uid: { file_id, entity_uid } },
              create: { file_id, entity_uid },
              update: {},
            });
          }

          if (r.flags) {
            const flagList = r.flags.split('|').map((x) => x.trim()).filter(Boolean);
            for (const f of flagList) {
              if (!flagSet.has(f)) throw new Error(`unknown flag: ${f}`);
            await prisma.entityFlag.upsert({
              where: { entity_uid_flag_code_source: { entity_uid, flag_code: f, source: 'manual' } },
              create: { entity_uid, flag_code: f, source: 'manual' },
              update: {},
            });
          }
        }

          if (r.categories) {
            const categoryList = r.categories.split('|').map((x) => x.trim()).filter(Boolean);
            for (const c of categoryList) {
              if (!categorySet.has(c)) throw new Error(`unknown category: ${c}`);
              await prisma.entityCategoryMap.upsert({
                where: { entity_uid_category_code: { entity_uid, category_code: c } },
                create: { entity_uid, category_code: c },
                update: {},
              });
            }
          }
        }

        ok++;
      } catch (e: any) {
        errors.push({ row: i + 2, error: e.message || 'Invalid row' });
      }
    }
  } else if (type === 'affiliations') {
    if (!folder_id) return NextResponse.json({ error: 'folder_id required' }, { status: 400 });
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const network = (r.network || '').trim();
        const address = (r.address || '').trim();
        if (!network || !address) throw new Error('network/address required');
        if (!networkSet.has(network)) throw new Error(`unknown network: ${network}`);
        const addrErr = validateAddressByNetwork(network, address);
        if (addrErr) throw new Error(addrErr);

        let entity_uid = (r.entity_uid || '').trim();
        if (entity_uid && !entityUidSet.has(entity_uid)) {
          unknownUids.add(entity_uid);
          if (!dry_run) {
            const action = unknownActions[entity_uid];
            if (!action) throw new Error(`unknown entity_uid: ${entity_uid}`);
            if (action.action === 'skip') {
              skipped++;
              continue;
            }
            if (action.action === 'unknown') {
              await ensureUnknownEntity();
              entity_uid = 'UNKNOWN';
            }
            if (action.action === 'create') {
              await ensurePlaceholder(entity_uid, action.entity_type_code);
            }
          } else {
            throw new Error(`unknown entity_uid: ${entity_uid}`);
          }
        }

        const role = (r.address_role || '').trim();
        if (role && !roleSet.has(role)) throw new Error(`unknown address_role: ${role}`);

        if (!dry_run) {
          await prisma.affiliation.create({
            data: {
              folder_id,
              network_code: network,
              address,
              entity_uid: entity_uid || null,
              address_role_code: role || null,
              source: (r.source || '').trim() || 'manual',
              analyst: (r.analyst || '').trim() || null,
              comment: (r.comment || '').trim() || null,
              ext_name: (r.ext_name || '').trim() || null,
              ext_category: (r.ext_category || '').trim() || null,
              ext_wallet_name: (r.ext_wallet_name || '').trim() || null,
              ext_label: (r.ext_label || '').trim() || null,
              is_hidden: (r.is_hidden || '').toLowerCase() === 'true',
            },
          });
        }

        ok++;
      } catch (e: any) {
        errors.push({ row: i + 2, error: e.message || 'Invalid row' });
      }
    }
  } else if (type === 'incidents') {
    if (!file_id) return NextResponse.json({ error: 'file_id required' }, { status: 400 });
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const network = (r.network || '').trim();
        const address = (r.address || '').trim();
        if (!network || !address) throw new Error('network/address required');
        if (!networkSet.has(network)) throw new Error(`unknown network: ${network}`);
        const addrErr = validateAddressByNetwork(network, address);
        if (addrErr) throw new Error(addrErr);

        let entity_uid = (r.entity_uid || '').trim();
        if (entity_uid && !entityUidSet.has(entity_uid)) {
          unknownUids.add(entity_uid);
          if (!dry_run) {
            const action = unknownActions[entity_uid];
            if (!action) throw new Error(`unknown entity_uid: ${entity_uid}`);
            if (action.action === 'skip') {
              skipped++;
              continue;
            }
            if (action.action === 'unknown') {
              await ensureUnknownEntity();
              entity_uid = 'UNKNOWN';
            }
            if (action.action === 'create') {
              await ensurePlaceholder(entity_uid, action.entity_type_code);
            }
          } else {
            throw new Error(`unknown entity_uid: ${entity_uid}`);
          }
        }

        const incidentType = (r.incident_type || '').trim();
        if (!incidentType) throw new Error('incident_type required');
        if (!incidentTypeSet.has(incidentType)) throw new Error(`unknown incident_type: ${incidentType}`);

        const dateStr = (r.incident_date || '').trim();
        const date = new Date(dateStr);
        if (!dateStr || Number.isNaN(date.getTime())) throw new Error('incident_date invalid');

        if (!dry_run) {
          await prisma.incident.create({
            data: {
              file_id,
              network_code: network,
              address,
              entity_uid: entity_uid || null,
              incident_type_code: incidentType,
              incident_date: date,
              source: (r.source || '').trim() || 'manual',
              wallet_role: (r.wallet_role || '').trim() || null,
              analyst: (r.analyst || '').trim() || null,
              tx_hashes: (r.tx_hashes || '').trim() || null,
            },
          });
        }

        ok++;
      } catch (e: any) {
        errors.push({ row: i + 2, error: e.message || 'Invalid row' });
      }
    }
  } else {
    return NextResponse.json({ error: 'Unknown import type' }, { status: 400 });
  }

  return NextResponse.json({ ok, errors, unknownUids: Array.from(unknownUids), skipped });
}
