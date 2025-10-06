import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCourses() {
  console.log('🌱 Seeding courses...');

  // Create sample courses
  const courses = [
    {
      title: 'Introduction to Web Development',
      slug: 'introduction-to-web-development',
      description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners who want to start their journey in web development.',
      shortDescription: 'Learn web development fundamentals',
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=300&fit=crop',
      duration: 480, // 8 hours
      modules: {
        create: [
          {
            title: 'Getting Started',
            description: 'Introduction to web development and setting up your environment',
            orderIndex: 1,
            videos: {
              create: [
                {
                  title: 'What is Web Development?',
                  description: 'Overview of web development and career opportunities',
                  s3Key: 'courses/web-dev-intro/module-1/what-is-web-dev.mp4',
                  duration: 600, // 10 minutes
                  orderIndex: 1,
                },
                {
                  title: 'Setting Up Your Development Environment',
                  description: 'Install and configure essential tools',
                  s3Key: 'courses/web-dev-intro/module-1/setup-environment.mp4',
                  duration: 900, // 15 minutes
                  orderIndex: 2,
                },
              ],
            },
          },
          {
            title: 'HTML Fundamentals',
            description: 'Learn HTML structure and semantic markup',
            orderIndex: 2,
            videos: {
              create: [
                {
                  title: 'HTML Basics',
                  description: 'Understanding HTML structure and syntax',
                  s3Key: 'courses/web-dev-intro/module-2/html-basics.mp4',
                  duration: 1200, // 20 minutes
                  orderIndex: 1,
                },
                {
                  title: 'Semantic HTML',
                  description: 'Using semantic elements for better accessibility',
                  s3Key: 'courses/web-dev-intro/module-2/semantic-html.mp4',
                  duration: 900, // 15 minutes
                  orderIndex: 2,
                },
              ],
            },
          },
        ],
      },
    },
    {
      title: 'Advanced React Development',
      slug: 'advanced-react-development',
      description: 'Master advanced React concepts including hooks, context, performance optimization, and testing. Ideal for developers with React experience.',
      shortDescription: 'Master advanced React concepts',
      level: 'ADVANCED' as const,
      status: 'PUBLISHED' as const,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&h=300&fit=crop',
      duration: 720, // 12 hours
      modules: {
        create: [
          {
            title: 'Advanced Hooks',
            description: 'Deep dive into React hooks and custom hook patterns',
            orderIndex: 1,
            videos: {
              create: [
                {
                  title: 'useCallback and useMemo',
                  description: 'Performance optimization with memoization hooks',
                  s3Key: 'courses/advanced-react/module-1/callback-memo.mp4',
                  duration: 1800, // 30 minutes
                  orderIndex: 1,
                },
                {
                  title: 'Custom Hooks Patterns',
                  description: 'Building reusable custom hooks',
                  s3Key: 'courses/advanced-react/module-1/custom-hooks.mp4',
                  duration: 2100, // 35 minutes
                  orderIndex: 2,
                },
              ],
            },
          },
        ],
      },
    },
    {
      title: 'Python for Data Science',
      slug: 'python-for-data-science',
      description: 'Learn Python programming with a focus on data science applications. Covers NumPy, Pandas, Matplotlib, and machine learning basics.',
      shortDescription: 'Python programming for data science',
      level: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      thumbnail: 'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=500&h=300&fit=crop',
      duration: 600, // 10 hours
      modules: {
        create: [
          {
            title: 'Python Fundamentals',
            description: 'Core Python concepts for data science',
            orderIndex: 1,
            videos: {
              create: [
                {
                  title: 'Python Syntax and Data Types',
                  description: 'Basic Python programming concepts',
                  s3Key: 'courses/python-data-science/module-1/python-basics.mp4',
                  duration: 1500, // 25 minutes
                  orderIndex: 1,
                },
              ],
            },
          },
        ],
      },
    },
  ];

  for (const courseData of courses) {
    try {
      const course = await prisma.course.create({
        data: courseData,
        include: {
          modules: {
            include: {
              videos: true,
            },
          },
        },
      });
      console.log(`✅ Created course: ${course.title}`);
    } catch (error) {
      console.error(`❌ Failed to create course: ${courseData.title}`, error);
    }
  }

  console.log('🎉 Course seeding completed!');
}

async function main() {
  try {
    await seedCourses();
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedCourses };
