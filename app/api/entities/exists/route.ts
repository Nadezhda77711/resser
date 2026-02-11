import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) return NextResponse.json({ exists: false });
  const entity = await prisma.entity.findUnique({ where: { entity_uid: uid } });
  return NextResponse.json({ exists: !!entity });
}
