"use client";

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  showInfo?: boolean;
  allowFullscreen?: boolean;
  width?: number | string;
  height?: number | string;
}

export function YouTubeEmbed({
  videoId,
  title = 'YouTube Video',
  className,
  autoplay = false,
  controls = true,
  showInfo = false,
  allowFullscreen = true,
  width = '100%',
  height = 315,
}: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  const embedUrl = new URL('https://www.youtube.com/embed/' + videoId);
  
  // Add parameters
  const params = new URLSearchParams();
  if (autoplay) params.set('autoplay', '1');
  if (!controls) params.set('controls', '0');
  if (!showInfo) params.set('showinfo', '0');
  params.set('rel', '0'); // Don't show related videos
  params.set('modestbranding', '1'); // Minimal YouTube branding
  
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
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

// Utility function to extract YouTube video ID from various URL formats and iframe embed codes
export function extractYouTubeVideoId(input: string): string | null {
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

// Component for displaying YouTube thumbnail
interface YouTubeThumbnailProps {
  videoId: string;
  quality?: 'default' | 'medium' | 'high' | 'standard' | 'maxres';
  className?: string;
  alt?: string;
}

export function YouTubeThumbnail({
  videoId,
  quality = 'medium',
  className,
  alt = 'YouTube video thumbnail',
}: YouTubeThumbnailProps) {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault',
  };

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;

  return (
    <img
      src={thumbnailUrl}
      alt={alt}
      className={cn("rounded-lg object-cover", className)}
      loading="lazy"
    />
  );
}
