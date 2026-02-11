import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { affiliationSchema, validateAddressByNetwork } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const parsed = affiliationSchema.parse(body);
  const addrErr = validateAddressByNetwork(parsed.network_code, parsed.address);
  if (addrErr) return NextResponse.json({ error: addrErr }, { status: 400 });

  const updated = await prisma.affiliation.update({
    where: { id },
    data: {
      network_code: parsed.network_code,
      address: parsed.address,
      entity_uid: parsed.entity_uid ?? null,
      address_role_code: parsed.address_role_code ?? null,
      source: parsed.source,
      analyst: parsed.analyst ?? null,
      comment: parsed.comment ?? null,
      ext_name: parsed.ext_name ?? null,
      ext_category: parsed.ext_category ?? null,
      ext_wallet_name: parsed.ext_wallet_name ?? null,
      ext_label: parsed.ext_label ?? null,
      is_hidden: parsed.is_hidden ?? false,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await prisma.affiliation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
