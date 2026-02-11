import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { incidentSchema, validateAddressByNetwork } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'id must be a number' }, { status: 400 });
    }
    const body = await req.json();
    const parsed = incidentSchema.parse(body);
    const addrErr = validateAddressByNetwork(parsed.network_code, parsed.address);
    if (addrErr) return NextResponse.json({ error: addrErr }, { status: 400 });

    const updated = await prisma.incident.update({
      where: { id },
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

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await prisma.incident.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
