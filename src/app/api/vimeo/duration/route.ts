import { NextRequest, NextResponse } from 'next/server';

// Helper function to extract Vimeo video ID
function extractVimeoVideoId(input: string): string | null {
  // First, check if it's an iframe embed code
  const iframePattern = /<iframe[^>]*src=["']https:\/\/player\.vimeo\.com\/video\/(\d+)/i;
  const iframeMatch = input.match(iframePattern);
  if (iframeMatch) {
    return iframeMatch[1];
  }
  
  // Then check for regular Vimeo URLs
  const urlPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  
  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Helper function to parse Vimeo oEmbed response for duration
function extractDurationFromOEmbed(data: any): number | null {
  try {
    // Vimeo oEmbed API returns duration in seconds
    if (data.duration && typeof data.duration === 'number') {
      return data.duration;
    }
    return null;
  } catch (error) {
    console.error('Error parsing oEmbed data for duration:', error);
    return null;
  }
}

// Helper function to parse Vimeo page HTML for duration (fallback)
function extractDurationFromHTML(html: string): number | null {
  try {
    // Look for duration in JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
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

    // Look for duration in Vimeo's config data
    const configMatch = html.match(/window\.vimeo_oembed\s*=\s*([\s\S]*?);/i);
    if (configMatch) {
      const configData = JSON.parse(configMatch[1]);
      if (configData.duration) {
        return parseInt(configData.duration, 10);
      }
    }

    // Look for duration in other script tags
    const durationMatch = html.match(/"duration":(\d+)/);
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

    const videoId = extractVimeoVideoId(url);
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid Vimeo URL' }, { status: 400 });
    }

    let duration: number | null = null;

    // Method 1: Try Vimeo oEmbed API (no API key required, but limited)
    try {
      const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
      
      const oEmbedResponse = await fetch(oEmbedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (oEmbedResponse.ok) {
        const oEmbedData = await oEmbedResponse.json();
        duration = extractDurationFromOEmbed(oEmbedData);
        
        if (duration !== null) {
          return NextResponse.json({ 
            videoId, 
            duration,
            success: true,
            method: 'oEmbed'
          });
        }
      }
    } catch (error) {
      // oEmbed method failed, continue to HTML scraping
    }

    // Method 2: Fallback to HTML scraping
    try {
      const videoPageUrl = `https://vimeo.com/${videoId}`;
      const response = await fetch(videoPageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.ok) {
        const html = await response.text();
        duration = extractDurationFromHTML(html);
      }
    } catch (error) {
      console.log('HTML scraping method failed:', error);
    }

    if (duration === null) {
      return NextResponse.json({ 
        error: 'Could not extract duration', 
        message: 'Please enter the duration manually. Note: Some Vimeo videos may require API access for duration retrieval.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      videoId, 
      duration,
      success: true,
      method: 'HTML'
    });

  } catch (error) {
    console.error('Error fetching Vimeo duration:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video duration',
      message: 'Please enter the duration manually'
    }, { status: 500 });
  }
}
