import { prisma } from "./database/prisma";

export async function seedCategories() {
  try {
    console.log("Seeding categories...");

    // Create main categories
    const electronics = await prisma.category.upsert({
      where: { slug: "electronics" },
      update: {},
      create: {
        name: "Electronics",
        slug: "electronics",
        description: "Consumer electronics and gadgets",
        isActive: true,
        sortOrder: 1,
      },
    });

    const computers = await prisma.category.upsert({
      where: { slug: "computers" },
      update: {},
      create: {
        name: "Computers",
        slug: "computers",
        description: "Desktop computers, laptops, and components",
        isActive: true,
        sortOrder: 2,
      },
    });

    const accessories = await prisma.category.upsert({
      where: { slug: "accessories" },
      update: {},
      create: {
        name: "Accessories",
        slug: "accessories",
        description: "Computer and electronic accessories",
        isActive: true,
        sortOrder: 3,
      },
    });

    // Create subcategories for Electronics
    await prisma.category.upsert({
      where: { slug: "smartphones" },
      update: {},
      create: {
        name: "Smartphones",
        slug: "smartphones",
        description: "Mobile phones and smartphones",
        parentId: electronics.id,
        isActive: true,
        sortOrder: 1,
      },
    });

    await prisma.category.upsert({
      where: { slug: "tablets" },
      update: {},
      create: {
        name: "Tablets",
        slug: "tablets",
        description: "Tablets and e-readers",
        parentId: electronics.id,
        isActive: true,
        sortOrder: 2,
      },
    });

    // Create subcategories for Computers
    await prisma.category.upsert({
      where: { slug: "laptops" },
      update: {},
      create: {
        name: "Laptops",
        slug: "laptops",
        description: "Portable computers and notebooks",
        parentId: computers.id,
        isActive: true,
        sortOrder: 1,
      },
    });

    await prisma.category.upsert({
      where: { slug: "desktops" },
      update: {},
      create: {
        name: "Desktops",
        slug: "desktops",
        description: "Desktop computers and workstations",
        parentId: computers.id,
        isActive: true,
        sortOrder: 2,
      },
    });

    await prisma.category.upsert({
      where: { slug: "components" },
      update: {},
      create: {
        name: "Components",
        slug: "components",
        description: "Computer parts and components",
        parentId: computers.id,
        isActive: true,
        sortOrder: 3,
      },
    });

    // Create subcategories for Accessories
    await prisma.category.upsert({
      where: { slug: "keyboards-mice" },
      update: {},
      create: {
        name: "Keyboards & Mice",
        slug: "keyboards-mice",
        description: "Input devices and peripherals",
        parentId: accessories.id,
        isActive: true,
        sortOrder: 1,
      },
    });

    await prisma.category.upsert({
      where: { slug: "monitors" },
      update: {},
      create: {
        name: "Monitors",
        slug: "monitors",
        description: "Computer monitors and displays",
        parentId: accessories.id,
        isActive: true,
        sortOrder: 2,
      },
    });

    await prisma.category.upsert({
      where: { slug: "cables-adapters" },
      update: {},
      create: {
        name: "Cables & Adapters",
        slug: "cables-adapters",
        description: "Cables, adapters, and connectors",
        parentId: accessories.id,
        isActive: true,
        sortOrder: 3,
      },
    });

    console.log("Categories seeded successfully!");
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedCategories()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
