import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { normalizeCode } from '../../../lib/normalization';

export async function GET(req: NextRequest) {
  const include = req.nextUrl.searchParams.get('include');
  const entityTypes = await prisma.entityType.findMany({ orderBy: { code: 'asc' } });
  const flags = await prisma.flag.findMany({ orderBy: { code: 'asc' } });
  const addressRoles = await prisma.addressRole.findMany({ orderBy: { code: 'asc' } });
  const incidentTypes = await prisma.incidentType.findMany({ orderBy: { code: 'asc' } });
  const networks = await prisma.network.findMany({ orderBy: { code: 'asc' } });
  const categories = await prisma.entityCategory.findMany({ orderBy: { category_code: 'asc' } });
  const entities = include === 'entities' ? await prisma.entity.findMany({ select: { entity_uid: true, entity_name: true } }) : [];

  return NextResponse.json({
    entityTypes,
    flags,
    addressRoles,
    incidentTypes,
    networks,
    categories,
    entities,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { list, code, title, description } = body as { list: string; code: string; title: string; description?: string | null };

  if (!code || !title) {
    return NextResponse.json({ error: 'code and title are required' }, { status: 400 });
  }

  const normalized = normalizeCode(code);
  const trimmedTitle = title.trim();

  if (list === 'entity_types') {
    await prisma.entityType.create({ data: { code: normalized, title: trimmedTitle, description: description ?? null } });
  } else if (list === 'flags') {
    await prisma.flag.create({ data: { code: normalized, title: trimmedTitle, description: description ?? null } });
  } else if (list === 'address_roles') {
    await prisma.addressRole.create({ data: { code: normalized, title: trimmedTitle, description: description ?? null } });
  } else if (list === 'incident_types') {
    await prisma.incidentType.create({ data: { code: normalized, title: trimmedTitle, description: description ?? null } });
  } else if (list === 'networks') {
    await prisma.network.create({ data: { code: normalized.toUpperCase(), title: trimmedTitle, description: description ?? null } });
  } else if (list === 'entity_categories') {
    await prisma.entityCategory.create({ data: { category_code: normalized, title: trimmedTitle, description: description ?? null } });
  } else {
    return NextResponse.json({ error: 'Unknown list' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
