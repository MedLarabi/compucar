"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Maximize, 
  ImageIcon, 
  VideoIcon,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Combine videos first, then images - videos will appear first in the gallery
  const allMedia = [
    ...videos.map(vid => ({ ...vid, type: 'video' as const })),
    ...images.map(img => ({ ...img, type: 'image' as const, alt: img.altText }))
  ];

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<{type: 'image' | 'video', url: string} | null>(null);
  const [videoLoaded, setVideoLoaded] = useState<{[key: string]: boolean}>({});

  const selectedMedia = allMedia[selectedMediaIndex];

  // Preload videos when component mounts or when switching to a video
  useEffect(() => {
    if (selectedMedia?.type === 'video' && selectedMedia.url && !videoLoaded[selectedMedia.url]) {
      const video = document.createElement('video');
      video.src = selectedMedia.url;
      video.muted = true;
      video.preload = 'auto';
      video.oncanplaythrough = () => {
        setVideoLoaded(prev => ({ ...prev, [selectedMedia.url]: true }));
        console.log('Video preloaded successfully:', selectedMedia.url);
      };
      video.load();
    }
  }, [selectedMedia, videoLoaded]);

  const handleVideoPlay = () => setIsVideoPlaying(true);
  const handleVideoPause = () => setIsVideoPlaying(false);

  const openFullscreen = (type: 'image' | 'video', url: string) => {
    setFullscreenMedia({ type, url });
  };

  const closeFullscreen = () => {
    setFullscreenMedia(null);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (allMedia.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No media available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Media Display */}
      <div className="relative aspect-square bg-white rounded-lg overflow-hidden border">
        {selectedMedia?.type === 'image' ? (
          <div className="relative h-full group">
            <Image
              src={selectedMedia.url}
              alt={selectedMedia.alt || productName}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={selectedMediaIndex === 0}
            />
            
            {/* Fullscreen button */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                className="bg-black/20 backdrop-blur-sm hover:bg-black/40"
                onClick={() => openFullscreen('image', selectedMedia.url)}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : selectedMedia?.type === 'video' && selectedMedia.url ? (
          <div className="relative h-full group">
            {/* Loading overlay for videos that haven't finished loading */}
            {!videoLoaded[selectedMedia.url] && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading video...</p>
                </div>
              </div>
            )}
            
            <video
              src={selectedMedia.url}
              className="w-full h-full object-cover"
              controls
              muted={isVideoMuted}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              poster={selectedMedia.thumbnail || undefined}
              preload="auto"
              playsInline
              crossOrigin="anonymous"
              onLoadStart={() => console.log('Video loading started')}
              onCanPlay={() => console.log('Video can start playing')}
              onCanPlayThrough={() => {
                console.log('Video fully loaded');
                setVideoLoaded(prev => ({ ...prev, [selectedMedia.url]: true }));
              }}
              onError={(e) => {
                console.error('Video loading error:', e);
                setVideoLoaded(prev => ({ ...prev, [selectedMedia.url]: false }));
              }}
            />

            {/* Video info overlay */}
            <div className="absolute top-4 right-4 space-y-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-black/20 backdrop-blur-sm hover:bg-black/40"
                onClick={() => openFullscreen('video', selectedMedia.url)}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <VideoIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Media not available</p>
              <p className="text-sm">The media file could not be loaded</p>
            </div>
          </div>
        )}

        {/* Media counter */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded">
            {selectedMediaIndex + 1} / {allMedia.length}
          </div>
        )}
      </div>

      {/* Media Thumbnails */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allMedia.map((media, index) => (
            <button
              key={`${media.type}-${media.id}`}
              onClick={() => setSelectedMediaIndex(index)}
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
                  alt={media.alt || `${productName} media ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : media.thumbnail ? (
                <img
                  src={media.thumbnail}
                  alt={media.title || `${productName} video ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <VideoIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              
              {/* Play button overlay for videos */}
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

      {/* Fullscreen Modal */}
      {fullscreenMedia && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {fullscreenMedia.type === 'image' ? (
              <Image
                src={fullscreenMedia.url}
                alt={productName}
                width={1200}
                height={1200}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={fullscreenMedia.url}
                className="max-w-full max-h-full"
                controls
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}