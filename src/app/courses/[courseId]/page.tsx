'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Clock, 
  BookOpen, 
  Star,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Lock,
  CheckCircle2,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { toast } from 'sonner';
import { YouTubeEmbed } from '@/components/ui/youtube-embed';
import { VimeoEmbed } from '@/components/ui/vimeo-embed';
import { useLanguage } from '@/contexts/LanguageContext';

interface Video {
  id: string;
  title: string;
  description?: string;
  videoType: string;
  duration?: number;
  thumbnail?: string;
  orderIndex: number;
  isPreview: boolean;
  isActive: boolean;
  canAccess: boolean;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  vimeoUrl?: string;
  vimeoVideoId?: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  isFree?: boolean;
  canAccess?: boolean;
  videos: Video[];
  videoCount: number;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  price?: number;
  compareAtPrice?: number;
  duration?: number;
  level: string;
  language: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  isFree: boolean;
  allowPreview: boolean;
  certificateEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  modules: Module[];
  _count?: {
    enrollments: number;
  };
}

export default function CoursePlayerPage() {
  const params = useParams();
  
  // Calculate total course duration from all video durations
  const calculateCourseDuration = (course: Course): number => {
    return course.modules.reduce((totalDuration, module) => {
      const moduleDuration = module.videos.reduce((moduleTotal, video) => {
        return moduleTotal + (video.duration || 0);
      }, 0);
      return totalDuration + moduleDuration;
    }, 0);
  };

  // Format duration in hours and minutes
  const formatCourseDuration = (totalSeconds: number): string => {
    if (totalSeconds === 0) return '0 min';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  };
  const courseSlug = params.courseId as string; // This is actually the slug now
  const { t } = useLanguage();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>('aspect-video'); // Default 16:9
  const videoRef = useRef<HTMLVideoElement>(null);

  // Function to determine aspect ratio class based on dimensions
  const getAspectRatioClass = (width: number, height: number): string => {
    const ratio = width / height;
    console.log(`Calculating aspect ratio: ${width}x${height} = ${ratio}`);
    
    // Common aspect ratios with tolerance
    if (Math.abs(ratio - 16/9) < 0.1) {
      console.log('Matched 16:9 aspect ratio');
      return 'aspect-video'; // 16:9
    }
    if (Math.abs(ratio - 4/3) < 0.1) {
      console.log('Matched 4:3 aspect ratio');
      return 'aspect-[4/3]'; // 4:3
    }
    if (Math.abs(ratio - 1) < 0.1) {
      console.log('Matched 1:1 aspect ratio');
      return 'aspect-square'; // 1:1
    }
    if (Math.abs(ratio - 9/16) < 0.1) {
      console.log('Matched 9:16 aspect ratio (vertical)');
      return 'aspect-[9/16]'; // 9:16 (vertical)
    }
    if (Math.abs(ratio - 21/9) < 0.1) {
      console.log('Matched 21:9 aspect ratio');
      return 'aspect-[21/9]'; // 21:9 (ultrawide)
    }
    if (Math.abs(ratio - 3/2) < 0.1) {
      console.log('Matched 3:2 aspect ratio');
      return 'aspect-[3/2]'; // 3:2
    }
    if (Math.abs(ratio - 2/1) < 0.1) {
      console.log('Matched 2:1 aspect ratio');
      return 'aspect-[2/1]'; // 2:1
    }
    
    // For custom ratios, create a custom aspect ratio
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    const w = Math.round(width / divisor);
    const h = Math.round(height / divisor);
    
    const customClass = `aspect-[${w}/${h}]`;
    console.log(`Created custom aspect ratio: ${customClass}`);
    return customClass;
  };

  // Function to detect YouTube video dimensions
  const detectYouTubeAspectRatio = async (videoId: string): Promise<string> => {
    try {
      // Try to get video info from YouTube oEmbed API
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (response.ok) {
        const data = await response.json();
        if (data.width && data.height) {
          return getAspectRatioClass(data.width, data.height);
        }
      }
    } catch (error) {
      console.log('Could not detect YouTube aspect ratio:', error);
    }
    return 'aspect-video'; // Default fallback
  };

  // Function to detect Vimeo video dimensions
  const detectVimeoAspectRatio = async (videoId: string): Promise<string> => {
    try {
      console.log('Detecting Vimeo aspect ratio for video ID:', videoId);
      // Try to get video info from Vimeo oEmbed API
      const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
      console.log('Vimeo API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Vimeo API data:', data);
        
        if (data.width && data.height) {
          console.log(`Video dimensions: ${data.width}x${data.height}`);
          const aspectRatio = getAspectRatioClass(data.width, data.height);
          console.log('Calculated aspect ratio class:', aspectRatio);
          return aspectRatio;
        }
      }
    } catch (error) {
      console.log('Could not detect Vimeo aspect ratio:', error);
    }
    console.log('Falling back to default aspect-video');
    return 'aspect-video'; // Default fallback
  };

  // Function to detect S3 video dimensions
  const detectS3VideoAspectRatio = (videoElement: HTMLVideoElement): string => {
    if (videoElement.videoWidth && videoElement.videoHeight) {
      return getAspectRatioClass(videoElement.videoWidth, videoElement.videoHeight);
    }
    return 'aspect-video'; // Default fallback
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/courses/${courseSlug}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }
        
        const data = await response.json();
        setCourse(data);
        
        // Auto-select first accessible video
        if (data.modules && data.modules.length > 0) {
          for (const module of data.modules) {
            const firstAccessibleVideo = module.videos.find((video: Video) => video.canAccess);
            if (firstAccessibleVideo) {
              handleVideoSelect(firstAccessibleVideo);
              setExpandedModules(new Set([module.id]));
              break;
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching course:', error);
        setError(error instanceof Error ? error.message : 'Failed to load course');
        toast.error('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (courseSlug) {
      fetchCourse();
    }
  }, [courseSlug]);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Get all accessible videos in order
  const getAllAccessibleVideos = (): Video[] => {
    if (!course) return [];
    
    const allVideos: Video[] = [];
    course.modules
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .forEach(module => {
        module.videos
          .filter(video => video.canAccess)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .forEach(video => allVideos.push(video));
      });
    
    return allVideos;
  };

  // Get next video
  const getNextVideo = (): Video | null => {
    if (!selectedVideo) return null;
    
    const allVideos = getAllAccessibleVideos();
    const currentIndex = allVideos.findIndex(video => video.id === selectedVideo.id);
    
    if (currentIndex >= 0 && currentIndex < allVideos.length - 1) {
      return allVideos[currentIndex + 1];
    }
    
    return null;
  };

  // Get previous video
  const getPreviousVideo = (): Video | null => {
    if (!selectedVideo) return null;
    
    const allVideos = getAllAccessibleVideos();
    const currentIndex = allVideos.findIndex(video => video.id === selectedVideo.id);
    
    if (currentIndex > 0) {
      return allVideos[currentIndex - 1];
    }
    
    return null;
  };

  const handleVideoSelect = async (video: Video) => {
    console.log('🎬 handleVideoSelect called with video:', video);
    
    if (video.canAccess) {
      setIsVideoLoading(true);
      setSelectedVideo(video);

      console.log('Selected video:', video);
      console.log('Video type:', video.videoType);
      console.log('Video ID:', video.vimeoVideoId || video.youtubeVideoId);
      
      // Detect aspect ratio based on video type
      let aspectRatio = 'aspect-video'; // Default
      
      try {
        if (video.videoType === 'YOUTUBE' && video.youtubeVideoId) {
          aspectRatio = await detectYouTubeAspectRatio(video.youtubeVideoId);
        } else if (video.videoType === 'VIMEO' && video.vimeoVideoId) {
          aspectRatio = await detectVimeoAspectRatio(video.vimeoVideoId);
        }
        // For S3 videos, we'll detect on load
      } catch (error) {
        console.log('Error detecting aspect ratio:', error);
      }
      
      console.log('Final aspect ratio set to:', aspectRatio);
      setVideoAspectRatio(aspectRatio);
      setIsVideoLoading(false);
    } else {
      toast.error(t('courses.videoRequiresEnrollment'));
    }
  };

  const handleNextVideo = () => {
    const nextVideo = getNextVideo();
    if (nextVideo) {
      handleVideoSelect(nextVideo);
      // Expand the module containing the next video
      const moduleWithVideo = course?.modules.find(module => 
        module.videos.some(video => video.id === nextVideo.id)
      );
      if (moduleWithVideo) {
        setExpandedModules(prev => new Set([...prev, moduleWithVideo.id]));
      }
    }
  };

  const handlePreviousVideo = () => {
    const previousVideo = getPreviousVideo();
    if (previousVideo) {
      handleVideoSelect(previousVideo);
      // Expand the module containing the previous video
      const moduleWithVideo = course?.modules.find(module => 
        module.videos.some(video => video.id === previousVideo.id)
      );
      if (moduleWithVideo) {
        setExpandedModules(prev => new Set([...prev, moduleWithVideo.id]));
      }
    }
  };

  const renderVideoPlayer = () => {
    if (!selectedVideo) {
      return (
        <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('courses.selectVideoToPlay')}</p>
          </div>
        </div>
      );
    }

    if (isVideoLoading) {
      return (
        <div className={`w-full ${videoAspectRatio} bg-gray-900 rounded-lg flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      );
    }

       if (selectedVideo.videoType === 'YOUTUBE' && selectedVideo.youtubeVideoId) {
         // For horizontal videos (16:9), use more width. For vertical videos (9:16), constrain width
         const isVertical = videoAspectRatio.includes('9/16') || videoAspectRatio.includes('3/4');
         const containerClass = isVertical 
           ? 'max-w-sm sm:max-w-md lg:max-w-lg mx-auto' 
           : 'max-w-full lg:max-w-5xl mx-auto';
         
         return (
           <div className={`w-full ${containerClass}`}>
             <div className={`${videoAspectRatio} max-h-[70vh]`}>
               <iframe
                 src={`https://www.youtube.com/embed/${selectedVideo.youtubeVideoId}`}
                 title={selectedVideo.title}
                 className="w-full h-full rounded-lg"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
             </div>
           </div>
         );
       }

       if (selectedVideo.videoType === 'VIMEO' && selectedVideo.vimeoVideoId) {
         // For horizontal videos (16:9), use more width. For vertical videos (9:16), constrain width
         const isVertical = videoAspectRatio.includes('9/16') || videoAspectRatio.includes('3/4');
         const containerClass = isVertical 
           ? 'max-w-sm sm:max-w-md lg:max-w-lg mx-auto' 
           : 'max-w-full lg:max-w-5xl mx-auto';
         
         return (
           <div className={`w-full ${containerClass}`}>
             <div className={`${videoAspectRatio} max-h-[70vh]`}>
               <iframe
                 src={`https://player.vimeo.com/video/${selectedVideo.vimeoVideoId}`}
                 title={selectedVideo.title}
                 className="w-full h-full rounded-lg"
                 allow="autoplay; fullscreen; picture-in-picture"
                 allowFullScreen
               />
             </div>
           </div>
         );
       }

    const videoUrl = selectedVideo?.s3Key 
      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${selectedVideo.s3Key}`
      : null;

       if (videoUrl) {
         // For horizontal videos (16:9), use more width. For vertical videos (9:16), constrain width
         const isVertical = videoAspectRatio.includes('9/16') || videoAspectRatio.includes('3/4');
         const containerClass = isVertical 
           ? 'max-w-sm sm:max-w-md lg:max-w-lg mx-auto' 
           : 'max-w-full lg:max-w-5xl mx-auto';
         
         return (
           <div className={`w-full ${containerClass}`}>
             <div className={`${videoAspectRatio} max-h-[70vh]`}>
               <video
                 ref={videoRef}
                 src={videoUrl}
                 controls
                 className="w-full h-full rounded-lg object-contain"
                 poster={selectedVideo.thumbnail}
                 onLoadedMetadata={() => {
                   // Detect aspect ratio from loaded video
                   if (videoRef.current) {
                     const aspectRatio = detectS3VideoAspectRatio(videoRef.current);
                     setVideoAspectRatio(aspectRatio);
                   }
                 }}
               />
             </div>
           </div>
         );
       }

    return (
        <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('courses.videoFormatNotSupported')}</p>
          </div>
        </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="aspect-video bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !course) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('courses.courseNotFound')}</h1>
            <p className="text-gray-600 mb-8">{error || t('courses.courseNotFound')}</p>
            <Button onClick={() => window.location.href = '/courses'}>
              {t('courses.backToCourses')}
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-0 sm:px-4 py-1 sm:py-4">
        {/* Course Header */}
        <div className="mb-3 sm:mb-6 px-2 sm:px-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{course.title}</h1>
            {course.isFree && (
                <div className="bg-green-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                  {t('courses.freeCourse')}
                </div>
            )}
            {!course.isFree && (course.modules.some(m => m.isFree) || course.modules.some(m => m.videos.some(v => v.isPreview))) && (
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                {t('courses.hasFreePreviews')}
              </div>
            )}
          </div>
          {course.shortDescription && (
            <p className="text-gray-600 text-lg">{course.shortDescription}</p>
          )}
          
          {/* Course Stats */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{t('courses.moduleCount', { count: course.modules.length })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              <span>{t('courses.videoCount', { count: course.modules.reduce((total, module) => total + module.videos.length, 0) })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatCourseDuration(calculateCourseDuration(course))}</span>
            </div>
          </div>
        </div>

          {/* Main Content */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            {/* Video Player - Full width on mobile, 2/3 on desktop */}
             <div className="w-full lg:col-span-2 space-y-2 sm:space-y-4">
               <div className="w-full max-h-[70vh] flex items-center justify-center">
                 {renderVideoPlayer()}
               </div>
            
             {selectedVideo && (
               <div className="px-2 sm:px-0 space-y-4">
                 <h2 className="text-xl font-semibold mb-2">{selectedVideo.title}</h2>
                 {selectedVideo.description && (
                   <p className="text-gray-600">{selectedVideo.description}</p>
                 )}
                 
                 {/* Video Navigation Buttons */}
                 <div className="flex items-center justify-between gap-4">
                   <Button
                     variant="outline"
                     onClick={handlePreviousVideo}
                     disabled={!getPreviousVideo()}
                     className="flex items-center gap-2"
                   >
                     <SkipBack className="h-4 w-4" />
                     {t('courses.previousVideo')}
                   </Button>
                   
                   <div className="text-sm text-gray-500 text-center">
                     {(() => {
                       const allVideos = getAllAccessibleVideos();
                       const currentIndex = allVideos.findIndex(video => video.id === selectedVideo.id);
                       return t('courses.videoOf', { current: currentIndex + 1, total: allVideos.length });
                     })()}
                   </div>
                   
                   <Button
                     variant="outline"
                     onClick={handleNextVideo}
                     disabled={!getNextVideo()}
                     className="flex items-center gap-2"
                   >
                     {t('courses.nextVideo')}
                     <SkipForward className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             )}
          </div>

          {/* Course Content Sidebar - Below video on mobile, sidebar on desktop */}
          <div className="w-full space-y-2 sm:space-y-4 px-2 sm:px-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                    {t('courses.courseContent')}
                  <Badge variant="secondary" className="ml-auto">
                    {t('courses.moduleCount', { count: course.modules.length })}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] sm:h-[500px] lg:h-[600px]">
                  <div className="space-y-2 p-4">
                    {course.modules.map((module) => (
                      <div key={module.id} className="border rounded-lg">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{module.title}</h3>
                              {module.isFree && !course?.isFree && (
                                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                  FREE
                                </div>
                              )}
                            </div>
                              <p className="text-sm text-gray-600">
                                {t('courses.videoCount', { count: module.videos.length })}
                              {module.isFree && !course?.isFree && (
                                <span className="ml-2 text-green-600 font-medium">• {t('courses.freeModule')}</span>
                              )}
                            </p>
                          </div>
                          {expandedModules.has(module.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        
                        {expandedModules.has(module.id) && (
                          <div className="border-t">
                            {module.videos.map((video) => (
                              <button
                                key={video.id}
                                onClick={() => handleVideoSelect(video)}
                                disabled={!video.canAccess}
                                className={`w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0 ${
                                  selectedVideo?.id === video.id ? 'bg-blue-50 border-blue-200' : ''
                                } ${!video.canAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  {video.canAccess ? (
                                    <Play className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{video.title}</p>
                                      {video.isPreview && !course?.isFree && !module.isFree && (
                                        <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                          FREE
                                        </div>
                                      )}
                                    </div>
                                    {video.duration && (
                                      <p className="text-xs text-gray-600">
                                        {Math.round(video.duration / 60)} {t('courses.min')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {selectedVideo?.id === video.id && (
                                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}