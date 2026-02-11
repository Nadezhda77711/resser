import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { entitySchema } from '../../../lib/validation';
import { normalizeUid } from '../../../lib/normalization';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId');
  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 });

  const file = await prisma.entitiesFile.findUnique({ where: { id: Number(fileId) } });
  if (!file) return NextResponse.json({ error: 'file not found' }, { status: 404 });

  const map = await prisma.entitiesFileMap.findMany({
    where: { file_id: file.id },
    include: { entity: { include: { flags: true, categories: true } } },
    orderBy: { id: 'asc' },
  });

  const rows = map.map((m) => ({
    entity_uid: m.entity.entity_uid,
    entity_name: m.entity.entity_name,
    entity_type_code: m.entity.entity_type_code,
    parent_entity_uid: m.entity.parent_entity_uid,
    entity_description: m.entity.entity_description,
    entity_country: m.entity.entity_country,
    added_at: m.entity.added_at,
    comment: m.entity.comment,
    flags: m.entity.flags.map((f) => f.flag_code),
    categories: m.entity.categories.map((c) => c.category_code),
  }));

  return NextResponse.json({ file, rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = entitySchema.parse(body);
  const uid = normalizeUid(parsed.entity_uid);

  const type = await prisma.entityType.findUnique({ where: { code: parsed.entity_type_code } });
  if (!type) return NextResponse.json({ error: 'unknown entity_type' }, { status: 400 });

  if (parsed.flags?.length) {
    const known = await prisma.flag.findMany({ where: { code: { in: parsed.flags } }, select: { code: true } });
    const knownSet = new Set(known.map((f) => f.code));
    const unknown = parsed.flags.find((f) => !knownSet.has(f));
    if (unknown) return NextResponse.json({ error: `unknown flag: ${unknown}` }, { status: 400 });
  }

  if (parsed.categories?.length) {
    const known = await prisma.entityCategory.findMany({ where: { category_code: { in: parsed.categories } }, select: { category_code: true } });
    const knownSet = new Set(known.map((c) => c.category_code));
    const unknown = parsed.categories.find((c) => !knownSet.has(c));
    if (unknown) return NextResponse.json({ error: `unknown category: ${unknown}` }, { status: 400 });
  }

  const entity = await prisma.entity.upsert({
    where: { entity_uid: uid },
    create: {
      entity_uid: uid,
      entity_name: parsed.entity_name,
      entity_type_code: parsed.entity_type_code,
      parent_entity_uid: parsed.parent_entity_uid ?? null,
      entity_description: parsed.entity_description ?? null,
      entity_country: parsed.entity_country ?? null,
      comment: parsed.comment ?? null,
    },
    update: {
      entity_name: parsed.entity_name,
      entity_type_code: parsed.entity_type_code,
      parent_entity_uid: parsed.parent_entity_uid ?? null,
      entity_description: parsed.entity_description ?? null,
      entity_country: parsed.entity_country ?? null,
      comment: parsed.comment ?? null,
    },
  });

  if (body.file_id) {
    await prisma.entitiesFileMap.upsert({
      where: { file_id_entity_uid: { file_id: Number(body.file_id), entity_uid: uid } },
      create: { file_id: Number(body.file_id), entity_uid: uid },
      update: {},
    });
  }

  if (parsed.flags?.length) {
    for (const f of parsed.flags) {
      await prisma.entityFlag.upsert({
        where: { entity_uid_flag_code_source: { entity_uid: uid, flag_code: f, source: 'manual' } },
        create: { entity_uid: uid, flag_code: f, source: 'manual' },
        update: {},
      });
    }
  }

  if (parsed.categories?.length) {
    for (const c of parsed.categories) {
      await prisma.entityCategoryMap.upsert({
        where: { entity_uid_category_code: { entity_uid: uid, category_code: c } },
        create: { entity_uid: uid, category_code: c },
        update: {},
      });
    }
  }

  return NextResponse.json({ ok: true, entity });
}
