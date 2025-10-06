import { prisma } from "@/lib/database/prisma";
import { EnrollmentSource } from "@prisma/client";

export interface EnrollUserInCourseParams {
  userId: string;
  courseId: string;
  orderId?: string;
  source?: EnrollmentSource;
  grantedBy?: string;
  expiresAt?: Date;
}

/**
 * Enroll a user in a course
 */
export async function enrollUserInCourse({
  userId,
  courseId,
  orderId,
  source = 'PURCHASE',
  grantedBy,
  expiresAt
}: EnrollUserInCourseParams) {
  try {
    // Check if user is already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        }
      }
    });

    if (existingEnrollment) {
      // If already enrolled and active, return existing enrollment
      if (existingEnrollment.status === 'ACTIVE') {
        return existingEnrollment;
      }
      
      // If expired or suspended, reactivate
      const updatedEnrollment = await prisma.courseEnrollment.update({
        where: { id: existingEnrollment.id },
        data: {
          status: 'ACTIVE',
          enrolledAt: new Date(),
          expiresAt,
          source,
          orderId,
          grantedBy,
          progressPercent: 0,
        }
      });

      return updatedEnrollment;
    }

    // Create new enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        orderId,
        source,
        grantedBy,
        expiresAt,
        status: 'ACTIVE',
      }
    });

    // Initialize course progress
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          where: { isActive: true },
          include: {
            videos: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (course) {
      const totalModules = course.modules.length;
      const totalVideos = course.modules.reduce((sum, module) => sum + module.videos.length, 0);

      await prisma.courseProgress.create({
        data: {
          userId,
          courseId,
          enrollmentId: enrollment.id,
          totalModules,
          totalVideos,
        }
      });
    }

    return enrollment;
  } catch (error) {
    console.error('Error enrolling user in course:', error);
    throw new Error(`Failed to enroll user in course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process course enrollments for an order
 */
export async function processOrderCourseEnrollments(orderId: string) {
  try {
    // Get order with items and their associated courses
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                courses: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                        status: true,
                        isActive: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order || !order.userId) {
      throw new Error('Order not found or no user associated');
    }

    const enrollments = [];

    // Process each order item
    for (const item of order.items) {
      const productCourses = item.product.courses;
      
      // Enroll user in all courses associated with this product
      for (const productCourse of productCourses) {
        const course = productCourse.course;
        
        // Only enroll in published and active courses
        if (course.status === 'PUBLISHED' && course.isActive) {
          try {
            const enrollment = await enrollUserInCourse({
              userId: order.userId,
              courseId: course.id,
              orderId: order.id,
              source: 'PURCHASE',
            });
            
            enrollments.push({
              courseId: course.id,
              courseTitle: course.title,
              enrollmentId: enrollment.id,
            });
          } catch (error) {
            console.error(`Failed to enroll user in course ${course.id}:`, error);
            // Continue with other courses even if one fails
          }
        }
      }
    }

    return enrollments;
  } catch (error) {
    console.error('Error processing order course enrollments:', error);
    throw error;
  }
}

/**
 * Manually enroll a user in a course (admin function)
 */
export async function manuallyEnrollUser({
  userId,
  courseId,
  grantedBy,
  expiresAt
}: {
  userId: string;
  courseId: string;
  grantedBy: string;
  expiresAt?: Date;
}) {
  try {
    return await enrollUserInCourse({
      userId,
      courseId,
      source: 'MANUAL',
      grantedBy,
      expiresAt,
    });
  } catch (error) {
    console.error('Error manually enrolling user:', error);
    throw error;
  }
}

/**
 * Revoke course access for a user
 */
export async function revokeCourseAccess(userId: string, courseId: string) {
  try {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        }
      }
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'SUSPENDED',
      }
    });

    return true;
  } catch (error) {
    console.error('Error revoking course access:', error);
    throw error;
  }
}

/**
 * Get user's course enrollment status
 */
export async function getUserCourseEnrollment(userId: string, courseId: string) {
  try {
    return await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        }
      },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
          }
        },
        progress: true,
      }
    });
  } catch (error) {
    console.error('Error getting user course enrollment:', error);
    return null;
  }
}

/**
 * Check if user has access to a course
 */
export async function userHasCourseAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        }
      }
    });

    if (!enrollment) {
      return false;
    }

    // Check if enrollment is active and not expired
    return enrollment.status === 'ACTIVE' && 
           (!enrollment.expiresAt || enrollment.expiresAt > new Date());
  } catch (error) {
    console.error('Error checking user course access:', error);
    return false;
  }
}
