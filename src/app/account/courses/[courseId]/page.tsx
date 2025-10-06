"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle,
  Clock,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { YouTubeEmbed } from '@/components/ui/youtube-embed';
import { VimeoEmbed } from '@/components/ui/vimeo-embed';
import { formatDuration } from '@/lib/utils/duration';

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  videoCount: number;
  videos: CourseVideo[];
}

interface CourseVideo {
  id: string;
  title: string;
  description?: string;
  videoType: 'S3' | 'YOUTUBE' | 'VIMEO';
  s3Key?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  vimeoUrl?: string;
  vimeoVideoId?: string;
  duration?: number;
  thumbnail?: string;
  orderIndex: number;
  isPreview: boolean;
  canAccess: boolean;
}

interface CourseData {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  level: string;
  modules: CourseModule[];
  isEnrolled: boolean;
  userProgress?: {
    completedModules: number;
    totalModules: number;
    completedVideos: number;
    totalVideos: number;
    watchTimeMinutes: number;
    progressPercent: number;
    lastWatchedAt?: string;
  };
}

interface VideoProgress {
  videoId: string;
  watchedSeconds: number;
  totalSeconds: number;
  isCompleted: boolean;
  progressPercent: number;
}

export default function CoursePlayerPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const courseSlug = params.courseId as string; // This is actually the slug now

  const [course, setCourse] = useState<CourseData | null>(null);
  const [currentVideo, setCurrentVideo] = useState<CourseVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState<Record<string, VideoProgress>>({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>('aspect-video'); // Default 16:9

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressUpdateRef = useRef<NodeJS.Timeout>();

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

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/user/courses/${courseSlug}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }
        
        const data = await response.json();
        console.log('Course data loaded:', data); // Debug log
        console.log('Modules:', data.modules); // Debug log
        console.log('Is enrolled:', data.isEnrolled); // Debug log
        
        // Validate course data
        if (!data.modules || data.modules.length === 0) {
          console.warn('No modules found in course data');
          toast.error('This course has no content available');
          return;
        }
        
        setCourse(data);

        // Auto-expand first module and select first accessible video
        if (data.modules.length > 0) {
          setExpandedModules(new Set([data.modules[0].id]));
          
          // Find first accessible video
          let foundAccessibleVideo = false;
          for (const module of data.modules) {
            console.log(`Module "${module.title}" has ${module.videos?.length || 0} videos`); // Debug log
            if (module.videos && module.videos.length > 0) {
              module.videos.forEach((video: CourseVideo, index: number) => {
                console.log(`  Video ${index + 1}: "${video.title}" - canAccess: ${video.canAccess}, videoType: ${video.videoType}`);
              });
              
              const firstAccessibleVideo = module.videos.find((v: CourseVideo) => v.canAccess);
              if (firstAccessibleVideo && !foundAccessibleVideo) {
                console.log('Selected first accessible video:', firstAccessibleVideo); // Debug log
                selectVideo(firstAccessibleVideo);
                foundAccessibleVideo = true;
              }
            }
          }
          
          if (!foundAccessibleVideo) {
            console.warn('No accessible videos found in any module');
            toast.error('No videos are available for playback. Please check your enrollment status.');
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error(t('courses.failedToLoad'));
        router.push('/account/courses');
      } finally {
        setIsLoading(false);
      }
    };

    if (courseSlug) {
      fetchCourse();
    }
  }, [courseSlug, router, t]);

  // Fetch user's progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!course?.isEnrolled) return;

      try {
        const response = await fetch(`/api/user/courses/${courseSlug}/progress`);
        if (response.ok) {
          const data = await response.json();
          const progressMap: Record<string, VideoProgress> = {};
          
          data.videoProgress?.forEach((vp: any) => {
            progressMap[vp.videoId] = vp;
          });
          
          setVideoProgress(progressMap);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    fetchProgress();
  }, [course, courseSlug]);

  // Load video URL when current video changes
  useEffect(() => {
    const loadVideo = async () => {
      if (!currentVideo || !currentVideo.canAccess) return;

      try {
        setIsVideoLoading(true);
        
        // For YouTube and Vimeo videos, we don't need to fetch a stream URL
        if (currentVideo.videoType === 'YOUTUBE' || currentVideo.videoType === 'VIMEO') {
          setVideoUrl(null); // YouTube/Vimeo embed handles the URL
          setIsVideoLoading(false);
          return;
        }

        // For S3 videos, fetch the stream URL
        const response = await fetch(`/api/user/courses/${courseSlug}/videos/${currentVideo.id}/stream`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to load video' }));
          throw new Error(errorData.error || 'Failed to load video');
        }
        
        const data = await response.json();
        setVideoUrl(data.videoUrl);
      } catch (error) {
        console.error('Error loading video:', error);
        toast.error(t('courses.videoLoadFailed'));
        setVideoUrl(null);
      } finally {
        setIsVideoLoading(false);
      }
    };

    loadVideo();
  }, [currentVideo, courseSlug, t]);

  // Update progress periodically while watching
  useEffect(() => {
    const updateProgress = async () => {
      if (!currentVideo || !videoRef.current || !course?.isEnrolled) return;

      const video = videoRef.current;
      const watchedSeconds = Math.floor(video.currentTime);
      const totalSeconds = Math.floor(video.duration) || 0;

      if (totalSeconds === 0) return;

      try {
        await fetch(`/api/user/courses/${courseSlug}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: currentVideo.id,
            watchedSeconds,
            totalSeconds,
          }),
        });

        // Update local progress
        setVideoProgress(prev => ({
          ...prev,
          [currentVideo.id]: {
            videoId: currentVideo.id,
            watchedSeconds,
            totalSeconds,
            isCompleted: watchedSeconds >= totalSeconds * 0.9,
            progressPercent: Math.round((watchedSeconds / totalSeconds) * 100),
          }
        }));
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    };

    if (currentVideo && videoRef.current) {
      // Update progress every 15 seconds
      progressUpdateRef.current = setInterval(updateProgress, 15000);
      
      return () => {
        if (progressUpdateRef.current) {
          clearInterval(progressUpdateRef.current);
        }
      };
    }
  }, [currentVideo, courseSlug, course?.isEnrolled]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const selectVideo = async (video: CourseVideo) => {
    if (!video.canAccess) {
      toast.error(t('courses.videoNotAccessible'));
      return;
    }
    
    console.log('🎬 selectVideo called with video:', video);
    setIsVideoLoading(true);
    setCurrentVideo(video);

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
  };

  const getNextVideo = (): CourseVideo | null => {
    if (!course || !currentVideo) return null;

    let foundCurrent = false;
    for (const module of course.modules) {
      for (const video of module.videos) {
        if (foundCurrent && video.canAccess) {
          return video;
        }
        if (video.id === currentVideo.id) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  const getPreviousVideo = (): CourseVideo | null => {
    if (!course || !currentVideo) return null;

    let previousVideo: CourseVideo | null = null;
    for (const module of course.modules) {
      for (const video of module.videos) {
        if (video.id === currentVideo.id) {
          return previousVideo;
        }
        if (video.canAccess) {
          previousVideo = video;
        }
      }
    }
    return null;
  };


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">{t('courses.courseNotFound')}</h2>
          <Button onClick={() => router.push('/account/courses')}>
            {t('courses.backToCourses')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!course.isEnrolled) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">{t('courses.notEnrolled')}</h2>
          <p className="text-muted-foreground mb-4">{t('courses.enrollToAccess')}</p>
          <Button onClick={() => router.push(`/courses/${course.id}`)}>
            {t('courses.viewCourse')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        <div className="space-y-2 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/account/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('courses.backToCourses')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{t(`courses.level.${course.level.toLowerCase()}`)}</Badge>
                {course.userProgress && (
                  <Badge variant="secondary">
                    {Math.round(course.userProgress.progressPercent)}% {t('courses.complete')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
          {/* Video Player - Full width on mobile, 2/3 on desktop */}
          <div className="w-full lg:col-span-2 space-y-2 sm:space-y-4">
            <div className="w-full max-h-[70vh] flex items-center justify-center">
              {!currentVideo ? (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">{t('courses.selectVideoToPlay')}</p>
                  </div>
                </div>
              ) : isVideoLoading ? (
                <div className={`w-full ${videoAspectRatio} bg-gray-900 rounded-lg flex items-center justify-center`}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : currentVideo.videoType === 'YOUTUBE' && currentVideo.youtubeVideoId ? (
                (() => {
                  // For horizontal videos (16:9), use more width. For vertical videos (9:16), constrain width
                  const isVertical = videoAspectRatio.includes('9/16') || videoAspectRatio.includes('3/4');
                  const containerClass = isVertical 
                    ? 'max-w-sm sm:max-w-md lg:max-w-lg mx-auto' 
                    : 'max-w-full lg:max-w-5xl mx-auto';
                  
                  return (
                    <div className={`w-full ${containerClass}`}>
                      <div className={`${videoAspectRatio} max-h-[70vh]`}>
                        <iframe
                          src={`https://www.youtube.com/embed/${currentVideo.youtubeVideoId}`}
                          title={currentVideo.title}
                          className="w-full h-full rounded-lg"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  );
                })()
              ) : currentVideo.videoType === 'VIMEO' && currentVideo.vimeoVideoId ? (
                (() => {
                  // For horizontal videos (16:9), use more width. For vertical videos (9:16), constrain width
                  const isVertical = videoAspectRatio.includes('9/16') || videoAspectRatio.includes('3/4');
                  const containerClass = isVertical 
                    ? 'max-w-sm sm:max-w-md lg:max-w-lg mx-auto' 
                    : 'max-w-full lg:max-w-5xl mx-auto';
                  
                  return (
                    <div className={`w-full ${containerClass}`}>
                      <div className={`${videoAspectRatio} max-h-[70vh]`}>
                        <iframe
                          src={`https://player.vimeo.com/video/${currentVideo.vimeoVideoId}`}
                          title={currentVideo.title}
                          className="w-full h-full rounded-lg"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  );
                })()
              ) : videoUrl ? (
                (() => {
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
                          poster={currentVideo.thumbnail}
                          onLoadedMetadata={() => {
                            // Detect aspect ratio from loaded video
                            if (videoRef.current) {
                              const aspectRatio = detectS3VideoAspectRatio(videoRef.current);
                              setVideoAspectRatio(aspectRatio);
                            }
                            // Restore progress if available
                            const progress = videoProgress[currentVideo.id];
                            if (progress && videoRef.current) {
                              videoRef.current.currentTime = progress.watchedSeconds;
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">{t('courses.videoNotAvailable')}</p>
                  </div>
                </div>
              )}
            </div>
            
            {currentVideo && (
              <div className="px-2 sm:px-0 space-y-4">
                <h2 className="text-xl font-semibold mb-2">{currentVideo.title}</h2>
                {currentVideo.description && (
                  <p className="text-gray-600">{currentVideo.description}
                  </p>
                )}
                    
                    {/* Video Progress */}
                    {videoProgress[currentVideo.id] && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{t('courses.progress')}</span>
                          <span>{videoProgress[currentVideo.id].progressPercent}%</span>
                        </div>
                        <Progress value={videoProgress[currentVideo.id].progressPercent} className="h-2" />
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const prev = getPreviousVideo();
                          if (prev) selectVideo(prev);
                        }}
                        disabled={!getPreviousVideo()}
                      >
                        <SkipBack className="h-4 w-4 mr-2" />
                        {t('courses.previous')}
                      </Button>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDuration(currentVideo.duration)}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = getNextVideo();
                          if (next) selectVideo(next);
                        }}
                        disabled={!getNextVideo()}
                      >
                        {t('courses.next')}
                        <SkipForward className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                </div>
              )}
          </div>

          {/* Course Content Sidebar */}
          <div className="space-y-4">
            {/* Course Progress */}
            {course.userProgress && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('courses.yourProgress')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('courses.overallProgress')}</span>
                      <span>{Math.round(course.userProgress.progressPercent)}%</span>
                    </div>
                    <Progress value={course.userProgress.progressPercent} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">
                        {course.userProgress.completedVideos}/{course.userProgress.totalVideos}
                      </div>
                      <div className="text-muted-foreground">{t('courses.videosCompleted')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">
                        {Math.floor(course.userProgress.watchTimeMinutes / 60)}h {course.userProgress.watchTimeMinutes % 60}m
                      </div>
                      <div className="text-muted-foreground">{t('courses.watchTime')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t('courses.courseContent')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="space-y-2 p-4">
                    {course.modules.map((module) => (
                      <Collapsible
                        key={module.id}
                        open={expandedModules.has(module.id)}
                        onOpenChange={() => toggleModule(module.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-3 h-auto"
                          >
                            <div className="text-left">
                              <div className="font-medium">{module.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {module.videoCount} {t('courses.videos')}
                              </div>
                            </div>
                            {expandedModules.has(module.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 ml-4">
                          {module.videos && module.videos.length > 0 ? module.videos.map((video) => {
                            const progress = videoProgress[video.id];
                            const isCurrentVideo = currentVideo?.id === video.id;
                            
                            return (
                              <Button
                                key={video.id}
                                variant={isCurrentVideo ? "secondary" : "ghost"}
                                className={`w-full justify-start p-3 h-auto ${!video.canAccess ? 'opacity-50' : ''}`}
                                onClick={() => selectVideo(video)}
                                disabled={!video.canAccess}
                                title={!video.canAccess ? 'Video not accessible' : ''}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="flex-shrink-0">
                                    {progress?.isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : video.canAccess ? (
                                      <Play className="h-4 w-4" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {video.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(video.duration)}
                                      {!video.canAccess && (
                                        <Badge variant="outline" className="text-xs">
                                          {t('courses.locked')}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {progress && progress.progressPercent > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {progress.progressPercent}%
                                    </div>
                                  )}
                                </div>
                              </Button>
                            );
                          }) : (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              No videos available in this module
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
