"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Maximize, 
  ImageIcon, 
  VideoIcon,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getVideoUrl } from "@/lib/utils/video-proxy";

interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isMain?: boolean;
}

interface ProductVideo {
  id: string;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  fileSize?: string;
  mimeType?: string;
  isMain?: boolean;
}

interface ProductMediaViewerProps {
  images?: ProductImage[];
  videos?: ProductVideo[];
  productName: string;
}

export function ProductMediaViewer({ 
  images = [], 
  videos = [], 
  productName 
}: ProductMediaViewerProps) {
  // Simple media combination - images first, then videos
  const allMedia = [
    ...images.map(img => ({ ...img, type: 'image' as const, alt: img.altText })),
    ...videos.map(vid => ({ ...vid, type: 'video' as const }))
  ];

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [fullscreenMedia, setFullscreenMedia] = useState<{type: 'image' | 'video', url: string, index: number} | null>(null);
  const [videoLoading, setVideoLoading] = useState<{[key: string]: boolean}>({});
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  const selectedMedia = allMedia[selectedMediaIndex];

  // Handle ESC key to close fullscreen and arrow keys for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!fullscreenMedia) return;
      
      if (event.key === 'Escape') {
        closeFullscreen();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateFullscreen('prev');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateFullscreen('next');
      }
    };

    if (fullscreenMedia) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when fullscreen is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenMedia]);

  // Simple media selection handler
  const handleMediaSelect = (index: number) => {
    setSelectedMediaIndex(index);
  };

  const handleVideoPlay = () => {
    // Simple autoplay when video is ready
    if (mainVideoRef.current) {
      mainVideoRef.current.play().catch(console.error);
    }
  };

  const openFullscreen = (type: 'image' | 'video', url: string, index?: number) => {
    const mediaIndex = index !== undefined ? index : selectedMediaIndex;
    setFullscreenMedia({ type, url, index: mediaIndex });
  };

  const closeFullscreen = () => {
    setFullscreenMedia(null);
  };

  const navigateFullscreen = (direction: 'prev' | 'next') => {
    if (!fullscreenMedia || allMedia.length <= 1) return;
    
    const currentIndex = fullscreenMedia.index;
    let newIndex: number;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allMedia.length - 1;
    } else {
      newIndex = currentIndex < allMedia.length - 1 ? currentIndex + 1 : 0;
    }
    
    const newMedia = allMedia[newIndex];
    setFullscreenMedia({
      type: newMedia.type,
      url: newMedia.type === 'video' ? getVideoUrl(newMedia.url) : newMedia.url,
      index: newIndex
    });
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video loading states
  const handleVideoLoadStart = (url: string) => {
    setVideoLoading(prev => ({ ...prev, [url]: true }));
  };

  const handleVideoCanPlay = (url: string) => {
    setVideoLoading(prev => ({ ...prev, [url]: false }));
  };

  const handleVideoError = (url: string) => {
    setVideoLoading(prev => ({ ...prev, [url]: false }));
    console.error('Video failed to load:', url);
  };

  if (allMedia.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <ImageIcon className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Media Display */}
      <div className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
        {selectedMedia?.type === 'image' ? (
          <div className="relative h-full">
            <Image
              src={selectedMedia.url}
              alt={selectedMedia.alt || productName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={selectedMediaIndex === 0}
            />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openFullscreen('image', selectedMedia.url, selectedMediaIndex)}
                className="backdrop-blur-sm"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : selectedMedia?.type === 'video' && selectedMedia.url ? (
          <div className="relative h-full group">
            {/* Simple loading overlay */}
            {videoLoading[selectedMedia.url] && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading video...</p>
                </div>
              </div>
            )}
            
            <video
              ref={mainVideoRef}
              src={getVideoUrl(selectedMedia.url)}
              className="w-full h-full object-cover"
              controls
              muted={isVideoMuted}
              poster={selectedMedia.thumbnail || undefined}
              preload="metadata"
              playsInline
              onLoadStart={() => handleVideoLoadStart(selectedMedia.url)}
              onCanPlay={() => {
                handleVideoCanPlay(selectedMedia.url);
                handleVideoPlay(); // Simple autoplay
              }}
              onError={() => handleVideoError(selectedMedia.url)}
            />

            {/* Simple video controls overlay */}
            <div className="absolute top-4 right-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openFullscreen('video', getVideoUrl(selectedMedia.url), selectedMediaIndex)}
                className="backdrop-blur-sm"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Media not available</p>
          </div>
        )}
      </div>

      {/* Simple Thumbnail Navigation */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allMedia.map((media, index) => (
            <button
              key={`${media.type}-${media.id}`}
              onClick={() => handleMediaSelect(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all group",
                selectedMediaIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {media.type === 'image' ? (
                <Image
                  src={media.url}
                  alt={media.alt || `${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  {media.thumbnail ? (
                    <Image
                      src={media.thumbnail}
                      alt={`Video thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <VideoIcon className="h-8 w-8 text-white" />
                  )}
                </div>
              )}

              {/* Simple video play overlay */}
              {media.type === 'video' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Duration badge for videos */}
              {media.type === 'video' && media.duration && (
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                  {formatDuration(media.duration)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Enhanced Fullscreen Modal with Navigation */}
      {fullscreenMedia && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          <div 
            className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 bg-black/50"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Arrows - Only show if more than 1 media item */}
            {allMedia.length > 1 && (
              <>
                {/* Previous Arrow */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => navigateFullscreen('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 bg-black/50 h-12 w-12"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>

                {/* Next Arrow */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => navigateFullscreen('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 bg-black/50 h-12 w-12"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Media Counter */}
            {allMedia.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {fullscreenMedia.index + 1} / {allMedia.length}
              </div>
            )}
            
            {fullscreenMedia.type === 'image' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={fullscreenMedia.url}
                  alt={productName}
                  width={1920}
                  height={1080}
                  className="max-w-full max-h-full object-contain"
                  sizes="95vw"
                  priority
                />
              </div>
            ) : (
              <video
                src={fullscreenMedia.url}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}