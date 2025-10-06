"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Award,
  ExternalLink,
  Filter,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CourseEnrollment {
  enrollmentId: string;
  enrolledAt: string;
  expiresAt?: string;
  status: string;
  source: string;
  lastAccessAt?: string;
  progressPercent: number;
  completedAt?: string;
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription?: string;
    thumbnail?: string;
    duration?: number;
    level: string;
    language: string;
    certificateEnabled: boolean;
    moduleCount: number;
  };
  progress?: {
    completedModules: number;
    totalModules: number;
    completedVideos: number;
    totalVideos: number;
    watchTimeMinutes: number;
    lastWatchedAt?: string;
    completedAt?: string;
  };
}

export default function MyCoursesPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }

        const response = await fetch(`/api/user/courses?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error(t('courses.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchCourses();
    }
  }, [session, statusFilter, t]);

  // Filter courses based on search term
  const filteredCourses = courses.filter(enrollment =>
    enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500';
      case 'ACTIVE':
        return 'bg-blue-500';
      case 'EXPIRED':
        return 'bg-red-500';
      case 'SUSPENDED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return t('courses.completed');
      case 'ACTIVE':
        return t('courses.active');
      case 'EXPIRED':
        return t('courses.expired');
      case 'SUSPENDED':
        return t('courses.suspended');
      default:
        return status;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED':
        return 'bg-orange-100 text-orange-800';
      case 'EXPERT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return t('courses.unknown');
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-48"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            {t('courses.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('courses.description')}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('courses.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('courses.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('courses.allCourses')}</SelectItem>
              <SelectItem value="active">{t('courses.active')}</SelectItem>
              <SelectItem value="completed">{t('courses.completed')}</SelectItem>
              <SelectItem value="expired">{t('courses.expired')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course Statistics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('courses.totalCourses')}</p>
                  <p className="text-3xl font-bold">{courses.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('courses.activeCourses')}</p>
                  <p className="text-3xl font-bold">{courses.filter(c => c.status === 'ACTIVE').length}</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('courses.completedCourses')}</p>
                  <p className="text-3xl font-bold">{courses.filter(c => c.status === 'COMPLETED').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('courses.totalWatchTime')}</p>
                  <p className="text-3xl font-bold">
                    {formatDuration(courses.reduce((sum, c) => sum + (c.progress?.watchTimeMinutes || 0), 0))}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? t('courses.noCoursesFound') : t('courses.noCoursesEnrolled')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? t('courses.tryDifferentSearch')
                  : t('courses.enrollInCoursesToStart')
                }
              </p>
              {!searchTerm && (
                <Link href="/courses">
                  <Button>{t('courses.browseCourses')}</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredCourses.map((enrollment) => (
              <Card key={enrollment.enrollmentId} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {enrollment.course.thumbnail && (
                          <img
                            src={enrollment.course.thumbnail}
                            alt={enrollment.course.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold">{enrollment.course.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getLevelColor(enrollment.course.level)}>
                              {t(`courses.level.${enrollment.course.level.toLowerCase()}`)}
                            </Badge>
                            <Badge variant="outline">
                              {enrollment.course.moduleCount} {t('courses.modules')}
                            </Badge>
                            {enrollment.course.certificateEnabled && (
                              <Badge variant="outline" className="text-yellow-600">
                                <Award className="h-3 w-3 mr-1" />
                                {t('courses.certificate')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardTitle>
                      {enrollment.course.shortDescription && (
                        <p className="text-sm text-muted-foreground">
                          {enrollment.course.shortDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(enrollment.status)}`}
                      />
                      <Badge variant="secondary">
                        {getStatusText(enrollment.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('courses.progress')}</span>
                      <span className="font-medium">{Math.round(enrollment.progressPercent)}%</span>
                    </div>
                    <Progress value={enrollment.progressPercent} className="h-2" />
                    {enrollment.progress && (
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          {t('courses.videosCompleted')}: {enrollment.progress.completedVideos}/{enrollment.progress.totalVideos}
                        </div>
                        <div>
                          {t('courses.watchTime')}: {formatDuration(enrollment.progress.watchTimeMinutes)}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Course Info */}
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('courses.enrolledOn')}:</span>
                      <span>{formatDistanceToNow(new Date(enrollment.enrolledAt), { addSuffix: true })}</span>
                    </div>
                    {enrollment.course.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('courses.duration')}:</span>
                        <span>{formatDuration(enrollment.course.duration)}</span>
                      </div>
                    )}
                    {enrollment.lastAccessAt && (
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('courses.lastAccessed')}:</span>
                        <span>{formatDistanceToNow(new Date(enrollment.lastAccessAt), { addSuffix: true })}</span>
                      </div>
                    )}
                    {enrollment.expiresAt && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('courses.expiresOn')}:</span>
                        <span>{new Date(enrollment.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex gap-2">
                      {enrollment.status === 'ACTIVE' && (
                        <Link href={`/account/courses/${enrollment.course.slug}`}>
                          <Button className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            {enrollment.progressPercent > 0 ? t('courses.continue') : t('courses.startCourse')}
                          </Button>
                        </Link>
                      )}
                      
                      <Link href={`/courses/${enrollment.course.slug}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t('courses.viewDetails')}
                        </Button>
                      </Link>
                    </div>

                    {enrollment.status === 'COMPLETED' && enrollment.course.certificateEnabled && (
                      <Button variant="outline" size="sm" className="text-yellow-600">
                        <Award className="h-4 w-4 mr-2" />
                        {t('courses.downloadCertificate')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
