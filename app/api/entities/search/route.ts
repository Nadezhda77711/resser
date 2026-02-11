import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ items: [] });

  const items = await prisma.entity.findMany({
    where: {
      OR: [
        { entity_uid: { contains: q } },
        { entity_name: { contains: q } },
      ],
    },
    take: 50,
    orderBy: { entity_uid: 'asc' },
    select: {
      entity_uid: true,
      entity_name: true,
      entity_type_code: true,
      entity_country: true,
    },
  });

  return NextResponse.json({ items });
}
