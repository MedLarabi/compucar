"use client";

import { Suspense } from 'react';
import { CoursesListing } from './courses-listing';
import { CourseFilters } from './course-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  isFree?: boolean;
  price?: number;
  moduleCount?: number;
  videoCount?: number;
  duration?: number;
  _count?: {
    modules: number;
  };
  modules?: {
    _count: {
      videos: number;
    };
  }[];
}

interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  totalVideos: number;
  totalDuration: number;
}

interface CoursesPageClientProps {
  courses: Course[];
  stats: CourseStats | null;
}

function CoursesPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Section Skeleton */}
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-[600px] mx-auto" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Courses Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CoursesPageClient({ courses, stats }: CoursesPageClientProps) {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {t('courses.public.pageTitle')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('courses.public.pageDescription')}
        </p>
      </div>

      <Suspense fallback={<CoursesPageSkeleton />}>
        <CoursesContent courses={courses} stats={stats} />
      </Suspense>
    </div>
  );
}

function CoursesContent({ courses, stats }: CoursesPageClientProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('courses.totalCourses')}
                  </p>
                  <p className="text-2xl font-bold">{stats.totalCourses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('courses.public.hoursOfContent')}
                  </p>
                  <p className="text-2xl font-bold">{Math.round((stats.totalDuration || 0) / 3600)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      )}

      {/* Filters and Course Listing */}
      <div className="space-y-6">
        <CourseFilters />
        <CoursesListing courses={courses} />
      </div>
    </>
  );
}
