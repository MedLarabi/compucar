import { NextRequest, NextResponse } from 'next/server';
import { yalidineGetStopDesks } from '@/lib/yalidine/client';

export async function GET(request: NextRequest) {
  try {
    console.log('📍 Stopdesks API called');
    const { searchParams } = new URL(request.url);
    const wilaya = searchParams.get('wilaya');
    
    console.log('Requested wilaya:', wilaya);

    if (!wilaya) {
      console.log('❌ No wilaya parameter provided');
      return NextResponse.json(
        { error: 'Wilaya parameter is required' },
        { status: 400 }
      );
    }

    // Always use live Yalidine API (no database cache)
    console.log('📞 Fetching stop desks from live Yalidine API...');
    const result = await yalidineGetStopDesks(wilaya);
    
    console.log('📦 yalidineGetStopDesks result:', {
      ok: result.ok,
      dataLength: result.data?.length || 0,
      error: result.error
    });

    if (result.ok && result.data) {
      console.log(`✅ Retrieved ${result.data.length} stop desks from live API for ${wilaya}`);
      return NextResponse.json({ stopdesks: result.data });
    } else {
      console.log(`❌ Failed to get stop desks from live API for ${wilaya}:`, result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to fetch stop desks' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in stopdesks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}