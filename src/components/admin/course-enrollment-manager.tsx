"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Users, BookOpen, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const enrollmentSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  courseId: z.string().min(1, 'Course is required'),
  source: z.enum(['MANUAL', 'ORDER']).default('MANUAL'),
});

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  image?: string;
}

interface Course {
  id: string;
  title: string;
  level: string;
  status: string;
}

interface Enrollment {
  id: string;
  enrolledAt: string;
  expiresAt: string | null;
  status: string;
  source: string;
  user: User;
  course: Course;
  progress?: {
    completedVideos: number;
    totalVideos: number;
    completedModules: number;
    totalModules: number;
  };
}

interface CourseEnrollmentManagerProps {
  courseId?: string; // If provided, shows enrollments for specific course
}

export function CourseEnrollmentManager({ courseId }: CourseEnrollmentManagerProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  const form = useForm({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      userId: '',
      courseId: courseId || '',
      source: 'MANUAL' as const,
    },
  });

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const url = courseId 
        ? `/api/admin/courses/${courseId}/enrollments`
        : '/api/admin/enrollments';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || data);
      } else {
        toast.error('Failed to fetch enrollments');
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          toast.success(`Loaded ${data.users.length} users`);
        } else {
          toast.error('No users found in response');
        }
      } else {
        toast.error(`Failed to fetch users: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchEnrollments();
    if (!courseId) {
      fetchCourses();
    }
    fetchUsers();
  }, [courseId]);


  const handleEnrollUser = async (data: z.infer<typeof enrollmentSchema>) => {
    try {
      const response = await fetch('/api/admin/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: data.userId,
          courseId: data.courseId,
          source: data.source,
        }),
      });

      if (response.ok) {
        toast.success('User enrolled successfully');
        setShowEnrollDialog(false);
        form.reset();
        fetchEnrollments();
      } else {
        const error = await response.json();
        toast.error(error.error || error.message || 'Failed to enroll user');
      }
    } catch (error) {
      console.error('Error enrolling user:', error);
      toast.error('Failed to enroll user');
    }
  };

  const handleRevokeEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to revoke this enrollment?')) {
      return;
    }

    try {
      const enrollment = enrollments.find(e => e.id === enrollmentId);
      if (!enrollment) return;

      const response = await fetch('/api/admin/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revoke',
          userId: enrollment.user.id,
          courseId: enrollment.course.id,
        }),
      });

      if (response.ok) {
        toast.success('Enrollment revoked successfully');
        fetchEnrollments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to revoke enrollment');
      }
    } catch (error) {
      console.error('Error revoking enrollment:', error);
      toast.error('Failed to revoke enrollment');
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = 
      enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || enrollment.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ORDER':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Order</Badge>;
      case 'MANUAL':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Manual</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{courseId ? 'Course Enrollments' : 'All Enrollments'}</span>
            </CardTitle>
            <Button onClick={() => setShowEnrollDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Enroll User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="ORDER">Order</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enrollments List */}
          <div className="space-y-4">
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No enrollments found matching your criteria.
              </div>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={enrollment.user.image || undefined} />
                      <AvatarFallback>
                        {enrollment.user.firstName[0]}{enrollment.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">
                          {enrollment.user.firstName} {enrollment.user.lastName}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          ({enrollment.user.email})
                        </span>
                      </div>
                      {!courseId && (
                        <p className="text-sm text-muted-foreground flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{enrollment.course.title}</span>
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        {getStatusBadge(enrollment.status)}
                        {getSourceBadge(enrollment.source)}
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </Badge>
                        {enrollment.progress && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round((enrollment.progress.completedVideos / enrollment.progress.totalVideos) * 100)}% complete
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeEnrollment(enrollment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enroll User Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll User in Course</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEnrollUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>User ({users.length} available)</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={fetchUsers}
                        className="text-xs"
                      >
                        Refresh Users
                      </Button>
                    </div>
                                        <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No users found. Click "Refresh Users" to reload.
                          </div>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!courseId && (
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEnrollDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Enroll User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
