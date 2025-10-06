import { NextRequest, NextResponse } from 'next/server';

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(input: string): string | null {
  // First, check if it's an iframe embed code
  const iframePattern = /<iframe[^>]*src=["']https:\/\/www\.youtube\.com\/embed\/([^"'?&]+)/i;
  const iframeMatch = input.match(iframePattern);
  if (iframeMatch) {
    return iframeMatch[1];
  }
  
  // Then check for regular YouTube URLs
  const urlPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Helper function to parse YouTube page HTML for duration
function extractDurationFromHTML(html: string): number | null {
  try {
    // Look for duration in JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/s);
    if (jsonLdMatch) {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      if (jsonData.duration) {
        // Parse ISO 8601 duration format (PT4M13S)
        const durationMatch = jsonData.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1] || '0', 10);
          const minutes = parseInt(durationMatch[2] || '0', 10);
          const seconds = parseInt(durationMatch[3] || '0', 10);
          return hours * 3600 + minutes * 60 + seconds;
        }
      }
    }

    // Fallback: look for duration in meta tags or other places
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    if (durationMatch) {
      return parseInt(durationMatch[1], 10);
    }

    return null;
  } catch (error) {
    console.error('Error parsing HTML for duration:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Try to fetch video page HTML
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch video data' }, { status: 500 });
    }

    const html = await response.text();
    const duration = extractDurationFromHTML(html);

    if (duration === null) {
      return NextResponse.json({ 
        error: 'Could not extract duration', 
        message: 'Please enter the duration manually' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      videoId, 
      duration,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching YouTube duration:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video duration',
      message: 'Please enter the duration manually'
    }, { status: 500 });
  }
}
