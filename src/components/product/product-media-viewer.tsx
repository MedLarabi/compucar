"use client";

import { useState, useEffect, useRef } from "react";
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
import { getVideoUrl } from "@/lib/utils/video-proxy";

// Helper function to decode MediaError codes
function getMediaErrorMessage(code?: number): string {
  if (!code) return 'Unknown error';
  
  switch (code) {
    case 1: return 'MEDIA_ERR_ABORTED: The user aborted the video loading';
    case 2: return 'MEDIA_ERR_NETWORK: A network error occurred while loading the video';
    case 3: return 'MEDIA_ERR_DECODE: An error occurred while decoding the video';
    case 4: return 'MEDIA_ERR_SRC_NOT_SUPPORTED: The video format is not supported';
    default: return `Unknown MediaError code: ${code}`;
  }
}

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
  // Combine images first, then videos - videos will appear at the end to allow more loading time
  const allMedia = [
    ...images.map(img => ({ ...img, type: 'image' as const, alt: img.altText })),
    ...videos.map(vid => ({ ...vid, type: 'video' as const }))
  ];

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<{type: 'image' | 'video', url: string} | null>(null);
  const [videoLoaded, setVideoLoaded] = useState<{[key: string]: boolean}>({});
  const [preloadedVideos, setPreloadedVideos] = useState<{[key: string]: HTMLVideoElement}>({});
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  const selectedMedia = allMedia[selectedMediaIndex];

  // Preload videos intelligently - start preloading early while viewing images
  useEffect(() => {
    const imageCount = images.length;
    const totalMedia = allMedia.length;
    
    // Start preloading videos much earlier - when viewing ANY image or in small galleries
    const shouldPreloadVideos = totalMedia <= 3 || // Small galleries: preload immediately
                               selectedMediaIndex >= Math.max(0, imageCount - 3) || // Last 3 images
                               selectedMedia?.type === 'video'; // Direct video selection
    
    if (shouldPreloadVideos && videos.length > 0) {
      console.log('🎬 Starting video preloading...', { 
        totalMedia, 
        imageCount, 
        selectedMediaIndex, 
        shouldPreload: shouldPreloadVideos,
        videosToPreload: videos.length
      });
      
      videos.forEach((video, index) => {
        if (video.url && !videoLoaded[video.url]) {
          const proxiedUrl = getVideoUrl(video.url);
          
          // Add a small staggered delay to avoid overwhelming the browser
          setTimeout(() => {
            console.log(`📹 Preloading video ${index + 1}/${videos.length}:`, video.url);
            
            // Test if the proxied URL is accessible first
            fetch(proxiedUrl, { 
              method: 'HEAD',
              cache: 'no-cache'
            })
            .then(testResponse => {
              console.log(`✅ Video ${index + 1} URL test response:`, testResponse.status, testResponse.statusText);
              
              if (!testResponse.ok) {
                console.error(`❌ Video ${index + 1} URL test failed:`, proxiedUrl, testResponse.status);
                return;
              }
              
              // If the URL test passes, create and load the video element
              const videoElement = document.createElement('video');
              videoElement.src = proxiedUrl;
              videoElement.muted = true;
              videoElement.preload = 'auto'; // Aggressively preload entire video
              
              videoElement.oncanplaythrough = () => {
                setVideoLoaded(prev => ({ ...prev, [video.url]: true }));
                setPreloadedVideos(prev => ({ ...prev, [video.url]: videoElement }));
                console.log(`🎯 Video ${index + 1} fully preloaded and ready to play:`, video.url);
              };
              
              videoElement.onloadeddata = () => {
                console.log(`📊 Video ${index + 1} data loaded (can start playing):`, video.url);
              };
              
              videoElement.onprogress = () => {
                if (videoElement.buffered.length > 0) {
                  const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
                  const duration = videoElement.duration;
                  if (duration > 0) {
                    const percentBuffered = (bufferedEnd / duration) * 100;
                    console.log(`⏳ Video ${index + 1} buffering progress: ${percentBuffered.toFixed(1)}%`);
                  }
                }
              };
              
              videoElement.onerror = (error) => {
                console.error(`❌ Video ${index + 1} preload failed:`, video.url, error);
                console.error('Proxied URL used:', proxiedUrl);
                console.error('Video element error details:', {
                  error: videoElement.error,
                  errorCode: videoElement.error?.code,
                  errorMessage: getMediaErrorMessage(videoElement.error?.code),
                  networkState: videoElement.networkState,
                  readyState: videoElement.readyState
                });
              };
              
              videoElement.load();
            })
            .catch(error => {
              console.error(`❌ Video ${index + 1} URL test error:`, error);
            });
          }, index * 300); // Stagger by 300ms to avoid overwhelming the connection
        }
      });
    }
  }, [selectedMediaIndex, allMedia.length, images.length, videos, videoLoaded]);

  // Effect to handle switching to preloaded videos and autoplay
  useEffect(() => {
    if (selectedMedia?.type === 'video' && selectedMedia.url && mainVideoRef.current) {
      const preloadedVideo = preloadedVideos[selectedMedia.url];
      const mainVideo = mainVideoRef.current;
      
      if (preloadedVideo && videoLoaded[selectedMedia.url]) {
        console.log('⚡ Using preloaded video for instant autoplay:', selectedMedia.url);
        
        // Store current state
        const currentTime = mainVideo.currentTime || 0;
        const currentMuted = mainVideo.muted;
        
        // Use the preloaded video's source (which is already loaded)
        if (mainVideo.src !== preloadedVideo.src) {
          mainVideo.src = preloadedVideo.src;
          
          // Restore state after source change and autoplay
          mainVideo.addEventListener('loadeddata', function onLoaded() {
            mainVideo.currentTime = currentTime;
            mainVideo.muted = currentMuted;
            
            // Always autoplay when switching to a video
            mainVideo.play().then(() => {
              console.log('🎬 Video started playing automatically');
              setIsVideoPlaying(true);
            }).catch(error => {
              console.error('Autoplay failed:', error);
            });
            
            mainVideo.removeEventListener('loadeddata', onLoaded);
            console.log('✅ Preloaded video ready and autoplaying');
          }, { once: true });
        }
      } else if (selectedMedia?.type === 'video') {
        // For non-preloaded videos, still try to autoplay once loaded
        console.log('📺 Video not preloaded, will autoplay once ready:', selectedMedia.url);
        
        const handleCanPlay = () => {
          if (mainVideo && mainVideo.readyState >= 3) {
            mainVideo.play().then(() => {
              console.log('🎬 Non-preloaded video started playing automatically');
              setIsVideoPlaying(true);
            }).catch(error => {
              console.error('Autoplay failed for non-preloaded video:', error);
            });
            mainVideo.removeEventListener('canplay', handleCanPlay);
          }
        };
        
        mainVideo.addEventListener('canplay', handleCanPlay);
        
        // Cleanup listener if component unmounts or media changes
        return () => {
          if (mainVideo) {
            mainVideo.removeEventListener('canplay', handleCanPlay);
          }
        };
      }
    }
  }, [selectedMedia, preloadedVideos, videoLoaded]);

  const handleMediaSelect = (index: number) => {
    const media = allMedia[index];
    setSelectedMediaIndex(index);
    
    // If selecting a video, prepare for autoplay
    if (media?.type === 'video') {
      console.log('🎬 Video thumbnail clicked - preparing for autoplay:', media.url);
      // Reset video playing state to ensure proper state management
      setIsVideoPlaying(false);
      
      // Small delay to ensure the video element is ready
      setTimeout(() => {
        if (mainVideoRef.current) {
          console.log('🎬 Attempting autoplay after thumbnail click');
          mainVideoRef.current.play().then(() => {
            console.log('✅ Video autoplay successful after thumbnail click');
            setIsVideoPlaying(true);
          }).catch(error => {
            console.log('⚠️ Autoplay failed after thumbnail click (may be blocked by browser):', error);
          });
        }
      }, 100);
    }
  };
  
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
                  <p className="text-sm">
                    {preloadedVideos[selectedMedia.url] ? 'Loading preloaded video...' : 'Loading video...'}
                  </p>
                  <p className="text-xs opacity-75">
                    {preloadedVideos[selectedMedia.url] ? 'Should be ready soon!' : 'Please wait while the video loads'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Video ready indicator - REMOVED */}
            
            <video
              ref={mainVideoRef}
              src={getVideoUrl(selectedMedia.url)}
              className="w-full h-full object-cover main-video"
              controls
              autoPlay
              muted={isVideoMuted}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              poster={selectedMedia.thumbnail || undefined}
              preload="auto"
              playsInline
              onLoadStart={() => {
                console.log('📺 Main video loading started');
                // Check if we have a preloaded version
                if (selectedMedia?.url && preloadedVideos[selectedMedia.url] && videoLoaded[selectedMedia.url]) {
                  console.log('⚡ Preloaded video available - should autoplay instantly');
                }
              }}
              onCanPlay={() => {
                console.log('📺 Main video can start playing');
                // Try autoplay if not already playing
                if (mainVideoRef.current && mainVideoRef.current.paused) {
                  mainVideoRef.current.play().then(() => {
                    console.log('🎬 Video autoplayed on canplay event');
                    setIsVideoPlaying(true);
                  }).catch(error => {
                    console.log('Autoplay blocked or failed on canplay:', error);
                  });
                }
              }}
              onCanPlayThrough={() => {
                console.log('📺 Main video fully loaded');
                setVideoLoaded(prev => ({ ...prev, [selectedMedia.url]: true }));
              }}
              onError={(e) => {
                console.error('Video loading error:', e);
                console.error('Failed video URL:', selectedMedia.url);
                console.error('Proxied URL:', getVideoUrl(selectedMedia.url));
                console.error('Video element error details:', {
                  error: e.currentTarget.error,
                  errorCode: e.currentTarget.error?.code,
                  errorMessage: getMediaErrorMessage(e.currentTarget.error?.code),
                  networkState: e.currentTarget.networkState,
                  readyState: e.currentTarget.readyState
                });
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
                  {videoLoaded[media.url] ? (
                    <Play className="h-4 w-4 text-white" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  )}
                </div>
              )}

            {/* Video status indicator - REMOVED */}

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
                src={getVideoUrl(fullscreenMedia.url)}
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