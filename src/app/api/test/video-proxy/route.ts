import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const testVideoUrl = 'https://carworkshop.org/products/video_1759872204671_316z1v.mov';
  const proxyUrl = `/api/proxy/video?url=${encodeURIComponent(testVideoUrl)}`;
  
  try {
    // Test the proxy endpoint
    const response = await fetch(`${request.nextUrl.origin}${proxyUrl}`, {
      method: 'HEAD'
    });
    
    return NextResponse.json({
      success: true,
      testVideoUrl,
      proxyUrl,
      proxyStatus: response.status,
      proxyStatusText: response.statusText,
      proxyHeaders: Object.fromEntries(response.headers.entries()),
      message: response.ok ? 'Video proxy is working!' : 'Video proxy failed'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testVideoUrl,
      proxyUrl
    }, { status: 500 });
  }
}
