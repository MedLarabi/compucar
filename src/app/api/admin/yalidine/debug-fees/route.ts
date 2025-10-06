import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { yalidineGetRealTimeFees } from '@/lib/yalidine/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wilayaName, communeName } = await request.json();
    
    if (!wilayaName) {
      return NextResponse.json({ error: "wilayaName is required" }, { status: 400 });
    }

    console.log('🔍 Debug: Testing Yalidine fees API for:', { wilayaName, communeName });

    const result = await yalidineGetRealTimeFees(wilayaName, communeName);
    
    return NextResponse.json({
      success: result.ok,
      data: result.data,
      error: result.error,
      debug: {
        wilayaName,
        communeName,
        apiConfigured: {
          hasApiBase: !!process.env.YALIDINE_API_BASE,
          hasApiId: !!process.env.YALIDINE_API_ID,
          hasApiToken: !!process.env.YALIDINE_API_TOKEN,
          hasFromWilayaId: !!process.env.YALIDINE_FROM_WILAYA_ID,
        },
        envVars: {
          YALIDINE_API_BASE: process.env.YALIDINE_API_BASE || 'not set',
          YALIDINE_FROM_WILAYA_ID: process.env.YALIDINE_FROM_WILAYA_ID || 'not set',
          YALIDINE_API_ID: process.env.YALIDINE_API_ID ? process.env.YALIDINE_API_ID.substring(0, 8) + '...' : 'not set',
          YALIDINE_API_TOKEN: process.env.YALIDINE_API_TOKEN ? process.env.YALIDINE_API_TOKEN.substring(0, 8) + '...' : 'not set',
        }
      }
    });

  } catch (error) {
    console.error('Debug fees error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: String(error)
      }
    }, { status: 500 });
  }
}
