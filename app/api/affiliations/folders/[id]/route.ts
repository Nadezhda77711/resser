import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const folder = await prisma.affiliationsFolder.findUnique({ where: { id } });
  if (!folder) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(folder);
}
