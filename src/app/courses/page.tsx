'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { CoursesPageClient } from '@/components/courses/courses-page-client';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const coursesResponse = await fetch('/api/courses').catch(() => null);

        if (coursesResponse?.ok) {
          const coursesData = await coursesResponse.json();
          const coursesList = coursesData.courses || coursesData || [];
          setCourses(coursesList);
          
          // Calculate stats dynamically from actual course data
          const dynamicStats = {
            totalCourses: coursesList.length,
            totalVideos: coursesList.reduce((total, course) => total + (course.videoCount || 0), 0),
            totalDuration: coursesList.reduce((total, course) => total + (course.duration || 0), 0),
          };
          setStats(dynamicStats);
        }
      } catch (error) {
        console.error('Error fetching courses data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading courses...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <CoursesPageClient courses={courses} stats={stats} />
    </MainLayout>
  );
}
