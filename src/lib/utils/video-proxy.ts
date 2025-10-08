/**
 * Utility functions for handling video URLs and CORS issues
 */

/**
 * Check if a URL needs to be proxied due to CORS restrictions
 */
export function needsVideoProxy(videoUrl: string, currentDomain: string): boolean {
  try {
    const url = new URL(videoUrl);
    const videoDomain = url.hostname;
    
    // If video is on the same domain, no proxy needed
    if (videoDomain === currentDomain) {
      return false;
    }
    
    // Known domains that might have CORS issues
    const corsProblematicDomains = [
      'carworkshop.org',
    ];
    
    return corsProblematicDomains.includes(videoDomain);
  } catch (error) {
    console.error('Error parsing video URL:', error);
    return false;
  }
}

/**
 * Generate a proxied video URL through our API
 */
export function getProxiedVideoUrl(originalUrl: string, baseUrl?: string): string {
  if (!baseUrl && typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  } else if (!baseUrl) {
    // Fallback for server-side rendering
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
  
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${baseUrl}/api/proxy/video?url=${encodedUrl}`;
}

/**
 * Get the appropriate video URL (proxied if needed)
 */
export function getVideoUrl(originalUrl: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return original URL
    return originalUrl;
  }
  
  const currentDomain = window.location.hostname;
  console.log('Video URL processing:', {
    originalUrl,
    currentDomain,
    needsProxy: needsVideoProxy(originalUrl, currentDomain)
  });
  
  if (needsVideoProxy(originalUrl, currentDomain)) {
    const proxiedUrl = getProxiedVideoUrl(originalUrl);
    console.log('Using proxied URL:', proxiedUrl);
    return proxiedUrl;
  }
  
  console.log('Using original URL:', originalUrl);
  return originalUrl;
}
