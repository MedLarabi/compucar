import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log web vitals data (you can extend this to save to database or send to analytics service)
    console.log('Web Vitals:', {
      name: data.name,
      value: data.value,
      path: data.path,
      timestamp: data.timestamp,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error tracking web vitals:', error);
    return NextResponse.json({ success: false }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
