"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Upload, Video, GripVertical, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils/duration';

// Helper function to extract YouTube video ID from URL or iframe embed code
const extractYouTubeVideoId = (input: string): string | null => {
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
};

// Helper function to extract Vimeo video ID from URL or iframe embed code
const extractVimeoVideoId = (input: string): string | null => {
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
};

// Helper function to convert YouTube duration format (PT4M13S) to seconds
const parseYouTubeDuration = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
};


const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  thumbnail: z.string().optional(),
  isFree: z.boolean().optional().default(false),
});

const moduleSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  description: z.string().optional(),
  orderIndex: z.number(),
  isFree: z.boolean().optional().default(false),
});

const videoSchema = z.object({
  title: z.string().min(1, 'Video title is required'),
  description: z.string().optional(),
  videoType: z.enum(['S3', 'YOUTUBE', 'VIMEO']),
  s3Key: z.string().optional(),
  youtubeUrl: z.string().optional(),
  youtubeVideoId: z.string().optional(),
  vimeoUrl: z.string().optional(),
  vimeoVideoId: z.string().optional(),
  duration: z.number().optional(),
  orderIndex: z.number(),
  isPreview: z.boolean().optional().default(false),
}).refine((data) => {
  if (data.videoType === 'S3') {
    return data.s3Key && data.s3Key.length > 0;
  }
  if (data.videoType === 'YOUTUBE') {
    if (!data.youtubeUrl || data.youtubeUrl.length === 0) {
      return false;
    }
    // Validate that we can extract a video ID from the input
    const videoId = extractYouTubeVideoId(data.youtubeUrl);
    return videoId !== null;
  }
  if (data.videoType === 'VIMEO') {
    if (!data.vimeoUrl || data.vimeoUrl.length === 0) {
      return false;
    }
    // Validate that we can extract a video ID from the input
    const videoId = extractVimeoVideoId(data.vimeoUrl);
    return videoId !== null;
  }
  return false;
}, {
  message: 'For S3 videos, provide an S3 key. For YouTube videos, provide a valid YouTube URL or iframe embed code. For Vimeo videos, provide a valid Vimeo URL or iframe embed code.',
});

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  level: string;
  status: string;
  isFree?: boolean;
  modules?: CourseModule[];
}

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isFree?: boolean;
  videos?: CourseVideo[];
}

interface CourseVideo {
  id: string;
  title: string;
  description: string | null;
  videoType: 'S3' | 'YOUTUBE' | 'VIMEO';
  s3Key?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  vimeoUrl?: string;
  vimeoVideoId?: string;
  duration: number | null;
  orderIndex: number;
  isPreview?: boolean;
}

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course;
  onSuccess: () => void;
}

export function CourseFormDialog({ open, onOpenChange, course, onSuccess }: CourseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Partial<CourseModule>[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'content'>('details');

  const form = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      level: 'BEGINNER' as const,
      status: 'DRAFT' as const,
      thumbnail: '',
      isFree: false,
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        description: course.description || '',
        level: course.level as any,
        status: course.status as any,
        thumbnail: course.thumbnail || '',
        isFree: course.isFree || false,
      });
      setModules(course.modules || []);
    } else {
      form.reset({
        title: '',
        description: '',
        level: 'BEGINNER',
        status: 'DRAFT',
        thumbnail: '',
        isFree: false,
      });
      setModules([]);
    }
  }, [course, form]);

  const onSubmit = async (data: z.infer<typeof courseSchema>) => {
    try {
      setLoading(true);
      
      // Filter out empty modules and videos, and ensure proper data types
      const validModules = modules
        .filter(module => module.title && module.title.trim().length > 0)
        .map((module, index) => {
          const validVideos = (module.videos || [])
            .filter(video => video.title && video.title.trim().length > 0)
            .map((video, videoIndex) => ({
              ...video,
              orderIndex: videoIndex + 1,
              duration: video.duration ? Number(video.duration) : null,
              // Ensure YouTube video ID is extracted if needed
              youtubeVideoId: video.videoType === 'YOUTUBE' && video.youtubeUrl 
                ? extractYouTubeVideoId(video.youtubeUrl) 
                : video.youtubeVideoId,
              // Ensure Vimeo video ID is extracted if needed
              vimeoVideoId: video.videoType === 'VIMEO' && video.vimeoUrl 
                ? extractVimeoVideoId(video.vimeoUrl) 
                : video.vimeoVideoId,
            }));

          return {
            ...module,
            orderIndex: index + 1,
            videos: validVideos,
          };
        });

      const payload = {
        ...data,
        modules: validModules,
      };

      console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      const url = course ? `/api/admin/courses/${course.id}` : '/api/admin/courses';
      const method = course ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(course ? 'Course updated successfully' : 'Course created successfully');
        onSuccess();
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        toast.error(error.message || 'Failed to save course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const addModule = () => {
    setModules([...modules, {
      id: `temp-module-${Date.now()}`,
      title: '',
      description: '',
      orderIndex: modules.length + 1,
      isFree: false,
      videos: [],
    }]);
  };

  const updateModule = (index: number, updates: Partial<CourseModule>) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], ...updates };
    setModules(newModules);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const addVideoToModule = (moduleIndex: number) => {
    const newModules = [...modules];
    const module = newModules[moduleIndex];
    if (!module.videos) module.videos = [];
    
    module.videos.push({
      id: `temp-video-${Date.now()}`,
      title: '',
      description: '',
      videoType: 'S3',
      s3Key: '',
      youtubeUrl: '',
      youtubeVideoId: '',
      vimeoUrl: '',
      vimeoVideoId: '',
      duration: null,
      orderIndex: module.videos.length + 1,
    });
    
    setModules(newModules);
  };

  const updateVideo = (moduleIndex: number, videoIndex: number, updates: Partial<CourseVideo>) => {
    const newModules = [...modules];
    const module = newModules[moduleIndex];
    if (module.videos) {
      // If updating YouTube URL, extract video ID
      if (updates.youtubeUrl) {
        const videoId = extractYouTubeVideoId(updates.youtubeUrl);
        updates.youtubeVideoId = videoId || '';
      }
      
      module.videos[videoIndex] = { ...module.videos[videoIndex], ...updates };
    }
    setModules(newModules);
  };

  const removeVideo = (moduleIndex: number, videoIndex: number) => {
    const newModules = [...modules];
    const module = newModules[moduleIndex];
    if (module.videos) {
      module.videos = module.videos.filter((_, i) => i !== videoIndex);
    }
    setModules(newModules);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {course ? 'Edit Course' : 'Create New Course'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-4 border-b">
            <button
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'details' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Course Details
            </button>
            <button
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'content' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('content')}
            >
              Course Content
            </button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter course title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter course description"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BEGINNER">Beginner</SelectItem>
                              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                              <SelectItem value="ADVANCED">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                              <SelectItem value="PUBLISHED">Published</SelectItem>
                              <SelectItem value="ARCHIVED">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-blue-50 border-blue-200">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium text-blue-800">
                            Free Course
                          </FormLabel>
                          <div className="text-sm text-blue-600">
                            Make this entire course free for everyone to access without enrollment
                          </div>
                          <div className="text-xs text-blue-500 mt-1">
                            When enabled, all modules and videos become freely accessible
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter thumbnail URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Course Modules</h3>
                    <Button type="button" onClick={addModule} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Module
                    </Button>
                  </div>

                  {modules.map((module, moduleIndex) => (
                    <Card key={moduleIndex}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">Module {moduleIndex + 1}</CardTitle>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeModule(moduleIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <Input
                            placeholder="Module title"
                            value={module.title || ''}
                            onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                          />
                          <Textarea
                            placeholder="Module description"
                            value={module.description || ''}
                            onChange={(e) => updateModule(moduleIndex, { description: e.target.value })}
                            rows={2}
                          />
                          
                          {/* Free Module Toggle - only show for paid courses */}
                          {!form.watch('isFree') && (
                            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                              <Switch
                                id={`module-free-${moduleIndex}`}
                                checked={module.isFree || false}
                                onCheckedChange={(checked) => updateModule(moduleIndex, { isFree: checked })}
                              />
                              <div className="flex-1">
                                <Label htmlFor={`module-free-${moduleIndex}`} className="text-sm font-medium text-green-800">
                                  Free Preview Module
                                </Label>
                                <p className="text-xs text-green-600 mt-1">
                                  Make this entire module accessible without enrollment to attract customers
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Videos</h4>
                            <Button
                              type="button"
                              onClick={() => addVideoToModule(moduleIndex)}
                              variant="outline"
                              size="sm"
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Add Video
                            </Button>
                          </div>

                          {module.videos?.map((video, videoIndex) => (
                            <div key={videoIndex} className="p-3 border rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Video {videoIndex + 1}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeVideo(moduleIndex, videoIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <Input
                                  placeholder="Video title"
                                  value={video.title || ''}
                                  onChange={(e) => updateVideo(moduleIndex, videoIndex, { title: e.target.value })}
                                />
                                
                                {/* Video Type Selection */}
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm font-medium">Video Type:</label>
                                  <Select
                                    value={video.videoType || 'S3'}
                                    onValueChange={(value: 'S3' | 'YOUTUBE') => {
                                      updateVideo(moduleIndex, videoIndex, { 
                                        videoType: value,
                                        // Clear opposite type fields when switching
                                        ...(value === 'S3' ? { youtubeUrl: '', youtubeVideoId: '' } : { s3Key: '' })
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="S3">
                                        <div className="flex items-center space-x-2">
                                          <Upload className="h-4 w-4" />
                                          <span>S3 Upload</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="YOUTUBE">
                                        <div className="flex items-center space-x-2">
                                          <Youtube className="h-4 w-4" />
                                          <span>YouTube</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="VIMEO">
                                        <div className="flex items-center space-x-2">
                                          <Video className="h-4 w-4" />
                                          <span>Vimeo</span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Conditional Fields Based on Video Type */}
                                {video.videoType === 'S3' && (
                                  <Input
                                    placeholder="S3 Key (e.g., courses/course-1/module-1/video.mp4)"
                                    value={video.s3Key || ''}
                                    onChange={(e) => updateVideo(moduleIndex, videoIndex, { s3Key: e.target.value })}
                                  />
                                )}
                                
                                {video.videoType === 'YOUTUBE' && (
                                  <div className="space-y-2">
                                    <Textarea
                                      placeholder="YouTube URL or iframe embed code&#10;&#10;Examples:&#10;• https://www.youtube.com/watch?v=dQw4w9WgXcQ&#10;• https://youtu.be/dQw4w9WgXcQ&#10;• <iframe src='https://www.youtube.com/embed/dQw4w9WgXcQ'...></iframe>"
                                      value={video.youtubeUrl || ''}
                                      onChange={(e) => {
                                        const url = e.target.value;
                                        const videoId = extractYouTubeVideoId(url);
                                        updateVideo(moduleIndex, videoIndex, { 
                                          youtubeUrl: url,
                                          youtubeVideoId: videoId || undefined 
                                        });
                                      }}
                                      rows={4}
                                      className="font-mono text-sm"
                                    />
                                    {video.youtubeVideoId && (
                                      <div className="text-xs text-muted-foreground flex items-center space-x-2">
                                        <span className="text-green-600">✓</span>
                                        <span>Video ID extracted: <code className="bg-muted px-1 rounded">{video.youtubeVideoId}</code></span>
                                      </div>
                                    )}
                                    {video.youtubeUrl && !video.youtubeVideoId && (
                                      <div className="text-xs text-red-600 flex items-center space-x-2">
                                        <span>⚠</span>
                                        <span>Could not extract video ID. Please check your URL or iframe code.</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {video.videoType === 'VIMEO' && (
                                  <div className="space-y-2">
                                    <Textarea
                                      placeholder="Vimeo URL or iframe embed code&#10;&#10;Examples:&#10;• https://vimeo.com/123456789&#10;• https://player.vimeo.com/video/123456789&#10;• <iframe src='https://player.vimeo.com/video/123456789'...></iframe>"
                                      value={video.vimeoUrl || ''}
                                      onChange={(e) => {
                                        const url = e.target.value;
                                        const videoId = extractVimeoVideoId(url);
                                        updateVideo(moduleIndex, videoIndex, { 
                                          vimeoUrl: url,
                                          vimeoVideoId: videoId || undefined 
                                        });
                                      }}
                                      rows={4}
                                      className="font-mono text-sm"
                                    />
                                    {video.vimeoVideoId && (
                                      <div className="text-xs text-muted-foreground flex items-center space-x-2">
                                        <span className="text-green-600">✓</span>
                                        <span>Video ID extracted: <code className="bg-muted px-1 rounded">{video.vimeoVideoId}</code></span>
                                      </div>
                                    )}
                                    {video.vimeoUrl && !video.vimeoVideoId && (
                                      <div className="text-xs text-red-600 flex items-center space-x-2">
                                        <span>⚠</span>
                                        <span>Could not extract video ID. Please check your URL or iframe code.</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Duration Input for all video types */}
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    placeholder="Duration (seconds)"
                                    value={video.duration || ''}
                                    onChange={(e) => updateVideo(moduleIndex, videoIndex, { 
                                      duration: e.target.value ? parseInt(e.target.value, 10) : null 
                                    })}
                                    className="w-32"
                                  />
                                  {video.videoType === 'YOUTUBE' && video.youtubeUrl && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch('/api/youtube/duration', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ url: video.youtubeUrl }),
                                          });
                                          
                                          const data = await response.json();
                                          
                                          if (data.success && data.duration) {
                                            updateVideo(moduleIndex, videoIndex, { duration: data.duration });
                                            toast.success(`Duration fetched: ${formatDuration(data.duration)}`);
                                          } else {
                                            toast.error(data.message || 'Could not fetch duration');
                                          }
                                        } catch (error) {
                                          console.error('Error fetching duration:', error);
                                          toast.error('Failed to fetch duration');
                                        }
                                      }}
                                      className="text-xs"
                                    >
                                      Fetch Duration
                                    </Button>
                                  )}
                                  {video.videoType === 'VIMEO' && video.vimeoUrl && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch('/api/vimeo/duration', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ url: video.vimeoUrl }),
                                          });
                                          
                                          const data = await response.json();
                                          
                                          if (data.success && data.duration) {
                                            updateVideo(moduleIndex, videoIndex, { duration: data.duration });
                                            toast.success(`Duration fetched: ${formatDuration(data.duration)}`);
                                          } else {
                                            toast.error(data.message || 'Could not fetch duration');
                                          }
                                        } catch (error) {
                                          console.error('Error fetching duration:', error);
                                          toast.error('Failed to fetch duration');
                                        }
                                      }}
                                      className="text-xs"
                                    >
                                      Fetch Duration
                                    </Button>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {video.duration ? formatDuration(video.duration) : 'Enter duration in seconds'}
                                  </span>
                                </div>
                                
                                <Textarea
                                  placeholder="Video description"
                                  value={video.description || ''}
                                  onChange={(e) => updateVideo(moduleIndex, videoIndex, { description: e.target.value })}
                                  rows={2}
                                />
                                
                                {/* Video Preview Toggle - only show for paid courses */}
                                {!form.watch('isFree') && !module.isFree && (
                                  <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                      id={`video-preview-${moduleIndex}-${videoIndex}`}
                                      checked={video.isPreview || false}
                                      onCheckedChange={(checked) => updateVideo(moduleIndex, videoIndex, { isPreview: checked })}
                                    />
                                    <Label htmlFor={`video-preview-${moduleIndex}-${videoIndex}`} className="text-sm text-blue-600">
                                      Free Preview (accessible without enrollment)
                                    </Label>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
