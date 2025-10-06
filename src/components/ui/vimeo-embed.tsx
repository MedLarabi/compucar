"use client";

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VimeoEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  allowFullscreen?: boolean;
  width?: number | string;
  height?: number | string;
}

export function VimeoEmbed({
  videoId,
  title = 'Vimeo Video',
  className,
  autoplay = false,
  controls = true,
  allowFullscreen = true,
  width = '100%',
  height = 315,
}: VimeoEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  console.log('VimeoEmbed props:', { videoId, title, className }); // Debug log

  if (!videoId) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg",
        className
      )} style={{ width, height }}>
        <p className="text-muted-foreground">No video ID provided</p>
      </div>
    );
  }

  const embedUrl = new URL(`https://player.vimeo.com/video/${videoId}`);
  
  // Add parameters
  const params = new URLSearchParams();
  if (autoplay) params.set('autoplay', '1');
  if (!controls) params.set('controls', '0');
  params.set('title', '0'); // Hide title
  params.set('byline', '0'); // Hide author
  params.set('portrait', '0'); // Hide author portrait
  
  embedUrl.search = params.toString();

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-muted rounded-lg p-6",
        className
      )} style={{ width, height }}>
        <Play className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-center">
          Failed to load video
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Video ID: {videoId}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      <iframe
        src={embedUrl.toString()}
        title={title}
        width={width}
        height={height}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen={allowFullscreen}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "rounded-lg",
          isLoading && "opacity-0"
        )}
      />
    </div>
  );
}

// Utility function to extract Vimeo video ID from various URL formats and iframe embed codes
export function extractVimeoVideoId(input: string): string | null {
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

// Component for displaying Vimeo thumbnail
interface VimeoThumbnailProps {
  videoId: string;
  className?: string;
  alt?: string;
}

export function VimeoThumbnail({
  videoId,
  className,
  alt = 'Vimeo video thumbnail',
}: VimeoThumbnailProps) {
  // Note: Vimeo thumbnails require API access, so we'll use a placeholder
  // In a production app, you'd want to fetch the thumbnail via Vimeo API
  return (
    <div className={cn(
      "flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg",
      className
    )}>
      <Play className="h-12 w-12 text-white" />
    </div>
  );
}
