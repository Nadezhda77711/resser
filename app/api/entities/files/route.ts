import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const files = await prisma.entitiesFile.findMany({ orderBy: { created_at: 'desc' } });
  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.entitiesFile.create({
    data: { file_name: body.file_name, description: body.description ?? null },
  });
  return NextResponse.json(created);
}
