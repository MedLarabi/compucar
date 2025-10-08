import { prisma } from './database/prisma';

export async function seedBlogCategories() {
  console.log('Seeding blog categories...');

  const categories = [
    {
      name: 'Car Maintenance',
      slug: 'car-maintenance',
      description: 'Essential tips and guides for keeping your car in top condition',
      color: '#3B82F6',
      sortOrder: 1,
    },
    {
      name: 'Performance Upgrades',
      slug: 'performance-upgrades',
      description: 'Boost your car\'s performance with these modification guides',
      color: '#EF4444',
      sortOrder: 2,
    },
    {
      name: 'Product Reviews',
      slug: 'product-reviews',
      description: 'In-depth reviews of auto diagnostic tools and equipment',
      color: '#10B981',
      sortOrder: 3,
    },
    {
      name: 'Installation Guides',
      slug: 'installation-guides',
      description: 'Step-by-step installation tutorials for car parts',
      color: '#F59E0B',
      sortOrder: 4,
    },
    {
      name: 'Industry News',
      slug: 'industry-news',
      description: 'Latest news and trends in the automotive industry',
      color: '#8B5CF6',
      sortOrder: 5,
    },
    {
      name: 'DIY Tips',
      slug: 'diy-tips',
      description: 'Do-it-yourself automotive projects and tips',
      color: '#06B6D4',
      sortOrder: 6,
    },
  ];

  for (const category of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log('Blog categories seeded successfully!');
}

// Run this function if called directly
if (require.main === module) {
  seedBlogCategories()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
