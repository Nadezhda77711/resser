import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { affiliationSchema, validateAddressByNetwork } from '../../../lib/validation';

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get('folderId');
  if (!folderId) return NextResponse.json({ error: 'folderId required' }, { status: 400 });

  const folder = await prisma.affiliationsFolder.findUnique({ where: { id: Number(folderId) } });
  if (!folder) return NextResponse.json({ error: 'folder not found' }, { status: 404 });

  const rows = await prisma.affiliation.findMany({
    where: { folder_id: folder.id },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({ folder, rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = affiliationSchema.parse(body);
  const addrErr = validateAddressByNetwork(parsed.network_code, parsed.address);
  if (addrErr) return NextResponse.json({ error: addrErr }, { status: 400 });

  const created = await prisma.affiliation.create({
    data: {
      folder_id: parsed.folder_id,
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

  return NextResponse.json(created);
}
