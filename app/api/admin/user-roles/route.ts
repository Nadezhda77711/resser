import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const user_id = Number(body.user_id);
  const role_id = Number(body.role_id);
  if (!Number.isFinite(user_id) || !Number.isFinite(role_id)) {
    return NextResponse.json({ error: 'user_id and role_id required' }, { status: 400 });
  }

  const userRole = await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id, role_id } },
    create: { user_id, role_id },
    update: {},
  });
  return NextResponse.json({ userRole });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const user_id = Number(body.user_id);
  const role_id = Number(body.role_id);
  if (!Number.isFinite(user_id) || !Number.isFinite(role_id)) {
    return NextResponse.json({ error: 'user_id and role_id required' }, { status: 400 });
  }

  await prisma.userRole.delete({
    where: { user_id_role_id: { user_id, role_id } },
  });
  return NextResponse.json({ ok: true });
}
