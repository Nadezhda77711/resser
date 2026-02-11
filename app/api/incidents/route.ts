import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { incidentSchema, validateAddressByNetwork } from '../../../lib/validation';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId');
  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 });

  const id = Number(fileId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'fileId must be a number' }, { status: 400 });
  }

  const file = await prisma.incidentsFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: 'file not found' }, { status: 404 });

  const rows = await prisma.incident.findMany({
    where: { file_id: file.id },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({ file, rows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = incidentSchema.parse(body);
    const addrErr = validateAddressByNetwork(parsed.network_code, parsed.address);
    if (addrErr) return NextResponse.json({ error: addrErr }, { status: 400 });

    const created = await prisma.incident.create({
      data: {
        file_id: parsed.file_id,
        network_code: parsed.network_code,
        address: parsed.address,
        entity_uid: parsed.entity_uid ?? null,
        incident_type_code: parsed.incident_type_code,
        incident_date: new Date(parsed.incident_date),
        source: parsed.source.trim() || 'manual',
        wallet_role: parsed.wallet_role ?? null,
        analyst: parsed.analyst ?? null,
        tx_hashes: parsed.tx_hashes ?? null,
      },
    });

    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid payload' }, { status: 400 });
  }
}
