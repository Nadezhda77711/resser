import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  const body = await req.json();
  const uid = decodeURIComponent(params.uid);

  if (body.entity_type_code) {
    const type = await prisma.entityType.findUnique({ where: { code: body.entity_type_code } });
    if (!type) return NextResponse.json({ error: 'unknown entity_type' }, { status: 400 });
  }

  if (Array.isArray(body.flags)) {
    const known = await prisma.flag.findMany({ where: { code: { in: body.flags } }, select: { code: true } });
    const knownSet = new Set(known.map((f) => f.code));
    const unknown = body.flags.find((f: string) => !knownSet.has(f));
    if (unknown) return NextResponse.json({ error: `unknown flag: ${unknown}` }, { status: 400 });
  }

  if (Array.isArray(body.categories)) {
    const known = await prisma.entityCategory.findMany({ where: { category_code: { in: body.categories } }, select: { category_code: true } });
    const knownSet = new Set(known.map((c) => c.category_code));
    const unknown = body.categories.find((c: string) => !knownSet.has(c));
    if (unknown) return NextResponse.json({ error: `unknown category: ${unknown}` }, { status: 400 });
  }

  const updated = await prisma.entity.update({
    where: { entity_uid: uid },
    data: {
      entity_name: body.entity_name,
      entity_type_code: body.entity_type_code,
      parent_entity_uid: body.parent_entity_uid ?? null,
      entity_description: body.entity_description ?? null,
      entity_country: body.entity_country ?? null,
      comment: body.comment ?? null,
    },
  });

  if (Array.isArray(body.flags)) {
    await prisma.entityFlag.deleteMany({ where: { entity_uid: uid, source: 'manual' } });
    for (const f of body.flags) {
      await prisma.entityFlag.create({ data: { entity_uid: uid, flag_code: f, source: 'manual' } });
    }
  }

  if (Array.isArray(body.categories)) {
    await prisma.entityCategoryMap.deleteMany({ where: { entity_uid: uid } });
    for (const c of body.categories) {
      await prisma.entityCategoryMap.create({ data: { entity_uid: uid, category_code: c } });
    }
  }

  return NextResponse.json({ ok: true, entity: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = decodeURIComponent(params.uid);

  await prisma.$transaction([
    prisma.entity.updateMany({ where: { parent_entity_uid: uid }, data: { parent_entity_uid: null } }),
    prisma.affiliation.updateMany({ where: { entity_uid: uid }, data: { entity_uid: null } }),
    prisma.incident.updateMany({ where: { entity_uid: uid }, data: { entity_uid: null } }),
    prisma.entityFlag.deleteMany({ where: { entity_uid: uid } }),
    prisma.entityCategoryMap.deleteMany({ where: { entity_uid: uid } }),
    prisma.entitiesFileMap.deleteMany({ where: { entity_uid: uid } }),
    prisma.entity.delete({ where: { entity_uid: uid } }),
  ]);

  return NextResponse.json({ ok: true });
}
