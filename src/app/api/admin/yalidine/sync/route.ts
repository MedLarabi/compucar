import { NextRequest, NextResponse } from 'next/server';
import { syncYalidineLocations, writeSnapshotJson } from '@/lib/yalidine/sync';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await syncYalidineLocations();
    await writeSnapshotJson();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'sync failed' }, { status: 500 });
  }
}


