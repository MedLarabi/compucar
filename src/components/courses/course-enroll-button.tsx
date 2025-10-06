"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ShoppingCart, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CourseEnrollButtonProps {
  courseId: string;
  courseSlug?: string;
  isFree?: boolean;
  price?: number;
}

export function CourseEnrollButton({ courseId, courseSlug, isFree = false, price }: CourseEnrollButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  // Check if user is already enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!session?.user) {
        setCheckingEnrollment(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/courses/${courseId}/enrollment`);
        if (response.ok) {
          const data = await response.json();
          setIsEnrolled(data.enrolled);
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    checkEnrollment();
  }, [session, courseId]);

  const handleEnroll = async () => {
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }

    setLoading(true);
    try {
      // For now, we'll redirect to a purchase flow or show a message
      // In a real implementation, this would integrate with your payment system
      toast.info('Course enrollment will be available soon. Please contact support for early access.');
      
      // Placeholder for enrollment logic
      // const response = await fetch(`/api/courses/${courseId}/enroll`, {
      //   method: 'POST',
      // });
      
      // if (response.ok) {
      //   setIsEnrolled(true);
      //   toast.success('Successfully enrolled in course!');
      // } else {
      //   toast.error('Failed to enroll in course');
      // }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = () => {
    router.push(`/courses/${courseSlug || courseId}`);
  };

  const handleWatchCourse = () => {
    router.push(`/courses/${courseSlug || courseId}`);
  };

  if (checkingEnrollment) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking enrollment...
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700 font-medium">You're enrolled!</span>
        </div>
        <Button onClick={handleStartCourse} className="w-full" size="lg">
          <Play className="h-4 w-4 mr-2" />
          Continue Learning
        </Button>
      </div>
    );
  }

  // For free courses, show watch button directly
  if (isFree) {
    return (
      <div className="space-y-3">
        {/* Free Badge */}
        <div className="text-center">
          <Badge className="bg-green-500 hover:bg-green-600 text-white text-lg px-4 py-2">
            FREE COURSE
          </Badge>
        </div>

        {/* Watch Button */}
        <Button 
          onClick={handleWatchCourse} 
          className="w-full" 
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          Watch Now
        </Button>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Full access • No enrollment required
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Price Display */}
      <div className="text-center">
        <div className="text-3xl font-bold">
          {price ? `$${price}` : 'Free'}
        </div>
        <div className="text-sm text-muted-foreground">One-time payment</div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button 
          onClick={handleEnroll} 
          disabled={loading}
          className="w-full" 
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enrolling...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Enroll Now
            </>
          )}
        </Button>
        
        <Button 
          onClick={handleWatchCourse} 
          variant="outline"
          className="w-full" 
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          Preview Course
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          30-day money-back guarantee
        </p>
      </div>
    </div>
  );
}
