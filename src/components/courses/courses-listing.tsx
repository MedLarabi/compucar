"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Clock, BookOpen, Play, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  isFree?: boolean;
  price?: number;
  moduleCount?: number;
  videoCount?: number;
  duration?: number;
  hasPreviewVideos?: boolean;
  _count?: {
    modules: number;
  };
  modules?: {
    _count: {
      videos: number;
    };
    videos?: {
      duration?: number;
    }[];
  }[];
}

interface CoursesListingProps {
  courses: Course[];
}

export function CoursesListing({ courses: initialCourses }: CoursesListingProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(Array.isArray(initialCourses) ? initialCourses : []);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  // Fetch user enrollments
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!session?.user) {
        setEnrolledCourseIds(new Set());
        return;
      }

      try {
        const response = await fetch('/api/user/courses');
        if (response.ok) {
          const data = await response.json();
          const courseIds = new Set(data.enrollments?.map((enrollment: any) => enrollment.course.id) || []);
          setEnrolledCourseIds(courseIds);
        }
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      }
    };

    fetchEnrollments();
  }, [session]);

  // Filter and sort courses based on URL parameters
  useEffect(() => {
    if (!Array.isArray(initialCourses)) {
      setFilteredCourses([]);
      return;
    }
    
    let filtered = [...initialCourses];

    // Filter by search term
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }


    // Handle watchable courses filter
    const showWatchable = searchParams.get('watchable') === 'true';
    
    // Sort courses
    const sortBy = searchParams.get('sort') || 'title';
    
    if (showWatchable) {
      // Sort watchable courses (enrolled + free) first, then others
      filtered.sort((a, b) => {
        const aIsWatchable = enrolledCourseIds.has(a.id) || a.isFree;
        const bIsWatchable = enrolledCourseIds.has(b.id) || b.isFree;
        
        // If one is watchable and the other isn't, prioritize watchable
        if (aIsWatchable && !bIsWatchable) return -1;
        if (!aIsWatchable && bIsWatchable) return 1;
        
        // If both are watchable or both are not, sort by selected criteria
        switch (sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'title_desc':
            return b.title.localeCompare(a.title);
          default:
            return a.title.localeCompare(b.title);
        }
      });
    } else {
      // Regular sorting without watchable priority
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'title_desc':
            return b.title.localeCompare(a.title);
          default:
            return a.title.localeCompare(b.title);
        }
      });
    }

    setFilteredCourses(filtered);
  }, [searchParams, initialCourses, enrolledCourseIds]);


  const getTotalVideos = (course: Course) => {
    return course.modules?.reduce((total, module) => total + (module._count?.videos || 0), 0) || 0;
  };

  const getTotalDuration = (course: Course) => {
    if (!course.modules) return 0;
    return course.modules.reduce((total, module) => {
      if (!module.videos) return total;
      return total + module.videos.reduce((moduleTotal, video) => moduleTotal + (video.duration || 0), 0);
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


  if (filteredCourses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">{t('courses.noCoursesFound')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('courses.public.adjustCriteria')}
        </p>
        <Button asChild>
          <Link href="/courses">{t('courses.public.viewAllCourses')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {t('courses.public.showingResults', { 
            count: filteredCourses.length,
            plural: filteredCourses.length !== 1 ? 's' : ''
          })}
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Course Thumbnail */}
            <Link href={`/courses/${course.slug}`} className="block">
              <div className="relative aspect-video bg-muted cursor-pointer">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <BookOpen className="h-16 w-16 text-white" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3">
                    <Play className="h-6 w-6 text-gray-900" />
                  </div>
                </div>

                {/* Watchable Status Tags - Top Left */}
                {enrolledCourseIds.has(course.id) && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {t('courses.public.enrolled')}
                    </div>
                  </div>
                )}
                
                {!enrolledCourseIds.has(course.id) && course.isFree && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {t('courses.public.free')}
                    </div>
                  </div>
                )}
                
                {!enrolledCourseIds.has(course.id) && !course.isFree && course.hasPreviewVideos && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      {t('courses.public.freePreview')}
                    </div>
                  </div>
                )}

              </div>
            </Link>

            <CardContent className="p-6">
              {/* Course Title */}
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {course.title}
              </h3>

              {/* Course Description */}
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {course.description || 'Comprehensive course designed to enhance your skills and knowledge.'}
              </p>

              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.moduleCount || course._count?.modules || 0} {t('courses.modules')}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Play className="h-4 w-4" />
                  <span>{course.videoCount || getTotalVideos(course)} {t('courses.videos')}</span>
                </div>
              </div>
              
              {/* Course Duration */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                <span>{formatCourseDuration(getTotalDuration(course))}</span>
              </div>

              {/* Course Meta */}
              <div className="flex items-center justify-end text-xs text-muted-foreground mb-4">
                <Badge variant="secondary" className="text-xs">
                  {course.status === 'PUBLISHED' ? t('courses.public.available') : course.status}
                </Badge>
              </div>
            </CardContent>

            <CardFooter className="p-6 pt-0">
              <Button asChild className="w-full group">
                <Link href={`/courses/${course.slug}`}>
                  <Play className="h-4 w-4 mr-2" />
                  {course.isFree ? t('courses.watchFree') : t('courses.viewCourse')}
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Load More Button (if needed for pagination) */}
      {filteredCourses.length >= 12 && (
        <div className="text-center pt-8">
          <Button variant="outline" size="lg">
            {t('courses.public.loadMoreCourses')}
          </Button>
        </div>
      )}
    </div>
  );
}
