import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = decodeURIComponent(params.uid);

  const entity = await prisma.entity.findUnique({
    where: { entity_uid: uid },
    include: {
      entity_type: true,
      parent: { select: { entity_uid: true, entity_name: true } },
      flags: true,
      categories: { include: { category: true } },
      affiliations: { orderBy: { id: 'asc' } },
      incidents: { orderBy: { id: 'asc' } },
    },
  });

  if (!entity) return NextResponse.json({ error: 'entity not found' }, { status: 404 });

  return NextResponse.json({
    entity: {
      entity_uid: entity.entity_uid,
      entity_name: entity.entity_name,
      entity_type: entity.entity_type,
      parent: entity.parent,
      parent_entity_uid: entity.parent_entity_uid,
      entity_description: entity.entity_description,
      entity_country: entity.entity_country,
      comment: entity.comment,
      added_at: entity.added_at,
    },
    flags: entity.flags.map((f) => ({ code: f.flag_code, source: f.source })),
    categories: entity.categories.map((c) => ({ category_code: c.category_code, title: c.category.title })),
    affiliations: entity.affiliations,
    incidents: entity.incidents,
  });
}
