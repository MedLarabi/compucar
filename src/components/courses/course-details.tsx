"use client";

import { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDuration } from '@/lib/utils/duration';

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
}

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  videos: CourseVideo[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  modules: CourseModule[];
}

interface CourseDetailsProps {
  course: Course;
}

export function CourseDetails({ course }: CourseDetailsProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set([course.modules[0]?.id]));

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };


  const getModuleDuration = (module: CourseModule) => {
    return module.videos.reduce((total, video) => total + (video.duration || 0), 0);
  };

  const getTotalVideos = (module: CourseModule) => {
    return module.videos.length;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="curriculum" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Course Content</span>
                <Badge variant="secondary">
                  {course.modules.length} modules • {course.modules.reduce((total, module) => total + module.videos.length, 0)} videos
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.modules.map((module, moduleIndex) => (
                <Collapsible
                  key={module.id}
                  open={expandedModules.has(module.id)}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {moduleIndex + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getTotalVideos(module)} videos • {formatDuration(getModuleDuration(module))}
                          </p>
                        </div>
                      </div>
                      {expandedModules.has(module.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-2">
                    <div className="ml-11 space-y-2">
                      {module.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {module.description}
                        </p>
                      )}
                      
                      {module.videos.map((video, videoIndex) => (
                        <div
                          key={video.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs">
                              {videoIndex + 1}
                            </div>
                            <Play className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium text-sm">{video.title}</h4>
                              {video.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {video.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(video.duration)}
                            </span>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About This Course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {course.description || 'This comprehensive course is designed to provide you with in-depth knowledge and practical skills. Through a series of carefully structured modules and hands-on exercises, you\'ll gain the expertise needed to excel in your field.'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What You'll Learn</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Master the fundamental concepts and principles</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Apply knowledge through practical exercises and projects</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Develop industry-relevant skills and best practices</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build confidence to tackle real-world challenges</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Prerequisites</h3>
                <p className="text-muted-foreground">
                  This course is designed to be accessible to learners with varying levels of experience. Basic familiarity with the subject matter may be helpful but is not required.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Additional course information and resources will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
