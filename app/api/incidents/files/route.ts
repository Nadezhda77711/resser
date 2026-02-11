import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const files = await prisma.incidentsFile.findMany({ orderBy: { created_at: 'desc' } });
  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.incidentsFile.create({
    data: { file_name: body.file_name, month: body.month },
  });
  return NextResponse.json(created);
}
