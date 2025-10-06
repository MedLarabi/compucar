import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting simple database seeding...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@compucar.com" },
    update: {},
    create: {
      email: "admin@compucar.com",
      firstName: "Admin",
      lastName: "User",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Created admin user:", adminUser.email);

  // Create a test customer user
  const customerUser = await prisma.user.upsert({
    where: { email: "customer@compucar.com" },
    update: {},
    create: {
      email: "customer@compucar.com",
      firstName: "Test",
      lastName: "Customer",
      password: await bcrypt.hash("customer123", 10),
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Created customer user:", customerUser.email);

  // Create basic categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "engine-parts" },
      update: {},
      create: {
        name: "Engine Parts",
        slug: "engine-parts",
        description: "Engine components and related parts",
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "brake-system" },
      update: {},
      create: {
        name: "Brake System",
        slug: "brake-system",
        description: "Brake pads, rotors, and brake components",
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "lighting" },
      update: {},
      create: {
        name: "Lighting",
        slug: "lighting",
        description: "Headlights, taillights, and LED components",
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);

  console.log("✅ Categories created");

  // Create a simple test product
  const product = await prisma.product.upsert({
    where: { slug: "test-brake-pads" },
    update: {},
    create: {
      name: "Premium Brake Pads",
      slug: "test-brake-pads",
      description: "High-quality brake pads for superior stopping power",
      price: 89.99,
      compareAtPrice: 119.99,
      sku: "BRK-001",
      quantity: 50,
      categoryId: categories[1].id, // brake-system
      status: "ACTIVE",
      isActive: true,
      isFeatured: true,
    },
  });

  console.log("✅ Test product created:", product.name);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
