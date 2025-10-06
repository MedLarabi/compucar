import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { yalidineGetRealTimeFees } from '@/lib/yalidine/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { testWilaya = "Chlef" } = body;

    console.log(`🧪 Testing Yalidine API connection to ${testWilaya}...`);

    // Test the real-time API connection
    const result = await yalidineGetRealTimeFees(testWilaya);

    if (result.ok && result.data) {
      return NextResponse.json({
        success: true,
        message: 'Yalidine API connection successful! ✅',
        data: {
          from_wilaya: result.data.from_wilaya_name,
          to_wilaya: result.data.to_wilaya_name,
          zone: result.data.zone,
          communes_available: Object.keys(result.data.per_commune).length,
          sample_commune: Object.values(result.data.per_commune)[0],
          oversize_fee: result.data.oversize_fee,
          cod_percentage: result.data.cod_percentage
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Yalidine API connection failed ❌',
        error: result.error,
        recommendation: result.error?.includes('credentials') 
          ? 'Please check your YALIDINE_API_ID and YALIDINE_API_TOKEN in environment variables'
          : 'Please verify your API credentials and network connection'
      });
    }

  } catch (error) {
    console.error('Error testing Yalidine connection:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed with exception ❌',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
