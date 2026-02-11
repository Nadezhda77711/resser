import { NextRequest, NextResponse } from 'next/server';
import { buildEntityReport } from '../../../../../lib/report';

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = decodeURIComponent(params.uid);
  const markdown = await buildEntityReport(uid);
  return NextResponse.json({ markdown });
}
