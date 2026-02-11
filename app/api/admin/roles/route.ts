import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCode } from '@/lib/normalization';

export async function GET() {
  const roles = await prisma.role.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = normalizeCode(body.code || '');
  const title = (body.title || '').trim();
  const description = body.description ? String(body.description) : null;

  if (!code || !title) {
    return NextResponse.json({ error: 'code and title required' }, { status: 400 });
  }

  const role = await prisma.role.create({ data: { code, title, description } });
  return NextResponse.json({ role });
}
