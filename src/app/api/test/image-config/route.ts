import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the current Next.js config
    const config = {
      message: "Next.js Image Configuration Test",
      configuredDomains: [
        'carworkshop.org',
        'pub-540795e0ce01450bb2eabc5acd5c3dcd.r2.dev',
        'cdn.compucar.pro',
        'cdn.compucar.com',
      ],
      testImageUrl: 'https://pub-540795e0ce01450bb2eabc5acd5c3dcd.r2.dev/products/image_1759844685919_t2d04.jpg',
      status: 'Images from these domains should now work with Next.js Image component',
      instructions: [
        '1. Refresh your browser',
        '2. Images should display without hostname errors',
        '3. If still not working, check browser console for any cached errors'
      ]
    };

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({
      error: 'Configuration check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

