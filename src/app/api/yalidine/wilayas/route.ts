import { NextRequest, NextResponse } from 'next/server';
import { yalidineGetWilayas } from '@/lib/yalidine/client';

// Ensure environment variables are loaded
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

export async function GET(request: NextRequest) {
  try {
    console.log('🌍 Fetching wilayas from live Yalidine API...');
    
    // Debug environment variables
    console.log('🔍 Environment check:', {
      hasBase: !!process.env.YALIDINE_API_BASE,
      hasId: !!process.env.YALIDINE_API_ID,
      hasToken: !!process.env.YALIDINE_API_TOKEN,
      base: process.env.YALIDINE_API_BASE,
      idLength: process.env.YALIDINE_API_ID?.length || 0,
      tokenLength: process.env.YALIDINE_API_TOKEN?.length || 0
    });
    
    // Always use live Yalidine API (no database cache)
    const result = await yalidineGetWilayas();
    
    if (result.ok && result.data) {
      console.log(`✅ Retrieved ${result.data.length} wilayas from live API`);
      return NextResponse.json({ wilayas: result.data });
    } else {
      console.log('❌ Failed to get wilayas from live API:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to fetch wilayas' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in wilayas API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
