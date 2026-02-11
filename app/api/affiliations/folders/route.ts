import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const folders = await prisma.affiliationsFolder.findMany({ orderBy: { created_at: 'desc' } });
  return NextResponse.json(folders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.affiliationsFolder.create({
    data: { folder_name: body.folder_name, network_code: body.network_code },
  });
  return NextResponse.json(created);
}
