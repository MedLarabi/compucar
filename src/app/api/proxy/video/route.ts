import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');
    
    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Validate that the URL is from allowed domains
    const allowedDomains = [
      'carworkshop.org',
      'pub-540795e0ce01450bb2eabc5acd5c3dcd.r2.dev', // Your R2 bucket
      'compucar.pro'
    ];
    
    let parsedUrl;
    try {
      parsedUrl = new URL(videoUrl);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 });
    }
    
    if (!allowedDomains.includes(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    console.log('Proxying video request for:', videoUrl);

    // Fetch the video from the original source
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'CompuCar-VideoProxy/1.0',
      },
    });

    if (!videoResponse.ok) {
      console.error('Failed to fetch video:', videoResponse.status, videoResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch video from source' }, 
        { status: videoResponse.status }
      );
    }

    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
    const contentLength = videoResponse.headers.get('content-length');
    const acceptRanges = videoResponse.headers.get('accept-ranges');
    
    // Get the video stream
    const videoStream = videoResponse.body;
    
    if (!videoStream) {
      return NextResponse.json({ error: 'No video stream available' }, { status: 500 });
    }

    // Create response with proper headers for video streaming
    const headers = new Headers({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    });

    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    
    if (acceptRanges) {
      headers.set('Accept-Ranges', acceptRanges);
    }

    // Handle range requests for video streaming
    const range = request.headers.get('range');
    if (range && contentLength) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : parseInt(contentLength) - 1;
      const chunksize = (end - start) + 1;
      
      headers.set('Content-Range', `bytes ${start}-${end}/${contentLength}`);
      headers.set('Content-Length', chunksize.toString());
      
      return new NextResponse(videoStream, {
        status: 206, // Partial Content
        headers,
      });
    }

    return new NextResponse(videoStream, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Video proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
    },
  });
}
