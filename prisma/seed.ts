import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

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

  // Create categories
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
    prisma.category.upsert({
      where: { slug: "accessories" },
      update: {},
      create: {
        name: "Accessories",
        slug: "accessories",
        description: "Interior and exterior accessories",
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "filters" },
      update: {},
      create: {
        name: "Filters",
        slug: "filters",
        description: "Air filters, oil filters, and cabin filters",
        sortOrder: 5,
        isActive: true,
      },
    }),
  ]);

  console.log("✅ Categories created");

  // No global Tag model in schema; tags are stored per-product in ProductTag
  console.log("ℹ️ Skipping global tags seeding (no Tag model in schema)");

  // Sample products data
  const productsData = [
    {
      name: "Premium Ceramic Brake Pads",
      slug: "premium-ceramic-brake-pads",
      description: "High-performance ceramic brake pads designed for superior stopping power and reduced brake dust. Perfect for daily driving and spirited driving conditions.",
      price: 89.99,
      compareAtPrice: 119.99,
      sku: "BRK-001-CERAMIC",
      stockQuantity: 150,
      categorySlug: "brake-system",
      status: "ACTIVE" as const,
      tags: ["premium", "bestseller", "warranty"],
      images: [
        { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&crop=center", alt: "Premium Ceramic Brake Pads", order: 1 },
      ],
      variants: [
        { name: "Front", sku: "BRK-001-CERAMIC-FRONT", price: 89.99, quantity: 75 },
        { name: "Rear", sku: "BRK-001-CERAMIC-REAR", price: 79.99, quantity: 75 },
      ],
    },
    {
      name: "LED Headlight Conversion Kit",
      slug: "led-headlight-conversion-kit",
      description: "Ultra-bright LED headlight conversion kit with 6000K color temperature. Easy plug-and-play installation with 50,000+ hour lifespan.",
      price: 159.99,
      sku: "LED-002-HEAD",
      stockQuantity: 85,
      categorySlug: "lighting",
      status: "ACTIVE" as const,
      tags: ["new-arrival", "premium"],
      images: [
        { url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=600&fit=crop&crop=center", alt: "LED Headlight Kit", order: 1 },
      ],
      variants: [
        { name: "H7", sku: "LED-002-HEAD-H7", price: 159.99, quantity: 30 },
        { name: "H11", sku: "LED-002-HEAD-H11", price: 149.99, quantity: 30 },
        { name: "9005", sku: "LED-002-HEAD-9005", price: 169.99, quantity: 25 },
      ],
    },
    {
      name: "High-Flow Air Filter",
      slug: "high-flow-air-filter",
      description: "Performance air filter that increases airflow to your engine while providing excellent filtration. Washable and reusable design saves money long-term.",
      price: 34.99,
      sku: "FLT-003-AIR",
      stockQuantity: 200,
      categorySlug: "filters",
      status: "ACTIVE" as const,
      tags: ["oem", "bestseller"],
      images: [
        { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop&crop=center", alt: "High-Flow Air Filter", order: 1 },
      ],
    },
    {
      name: "Performance Cold Air Intake",
      slug: "performance-cold-air-intake",
      description: "Complete cold air intake system designed to increase horsepower and torque while improving engine sound. Includes all necessary hardware for installation.",
      price: 249.99,
      compareAtPrice: 299.99,
      sku: "ENG-004-INTAKE",
      stockQuantity: 45,
      categorySlug: "engine-parts",
      status: "ACTIVE" as const,
      tags: ["premium", "new-arrival"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Cold Air Intake System", order: 1 },
      ],
    },
    {
      name: "Carbon Fiber License Plate Frame",
      slug: "carbon-fiber-license-plate-frame",
      description: "Stylish carbon fiber license plate frame that adds a sporty touch to your vehicle. Lightweight, durable, and weather-resistant construction.",
      price: 24.99,
      sku: "ACC-005-PLATE",
      stockQuantity: 120,
      categorySlug: "accessories",
      status: "ACTIVE" as const,
      tags: ["new-arrival"],
      images: [
        { url: "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=600&h=600&fit=crop&crop=center", alt: "Carbon Fiber License Plate Frame", order: 1 },
      ],
    },
    {
      name: "Heavy-Duty Brake Rotors",
      slug: "heavy-duty-brake-rotors",
      description: "Slotted and drilled brake rotors for improved heat dissipation and brake performance. Perfect for performance driving and heavy-duty applications.",
      price: 189.99,
      compareAtPrice: 229.99,
      sku: "BRK-006-ROTOR",
      stockQuantity: 60,
      categorySlug: "brake-system",
      status: "ACTIVE" as const,
      tags: ["premium", "warranty"],
      images: [
        { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&crop=center", alt: "Heavy-Duty Brake Rotors", order: 1 },
      ],
      variants: [
        { name: "Front", sku: "BRK-006-ROTOR-FRONT", price: 189.99, quantity: 30 },
        { name: "Rear", sku: "BRK-006-ROTOR-REAR", price: 169.99, quantity: 30 },
      ],
    },
    {
      name: "Premium Oil Filter",
      slug: "premium-oil-filter",
      description: "High-quality oil filter with superior filtration media. Removes harmful contaminants and extends engine life. Compatible with most vehicles.",
      price: 12.99,
      sku: "FLT-007-OIL",
      stockQuantity: 300,
      categorySlug: "filters",
      status: "ACTIVE" as const,
      tags: ["oem", "bestseller"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Premium Oil Filter", order: 1 },
      ],
    },
    {
      name: "LED Tail Light Assembly",
      slug: "led-tail-light-assembly",
      description: "Complete LED tail light assembly with modern styling and enhanced visibility. Direct replacement for factory lights with improved durability.",
      price: 129.99,
      sku: "LED-008-TAIL",
      stockQuantity: 75,
      categorySlug: "lighting",
      status: "ACTIVE" as const,
      tags: ["premium", "new-arrival"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "LED Tail Light Assembly", order: 1 },
      ],
      variants: [
        { name: "Left", sku: "LED-008-TAIL-LEFT", price: 129.99, quantity: 40 },
        { name: "Right", sku: "LED-008-TAIL-RIGHT", price: 129.99, quantity: 35 },
      ],
    },
    // 10 Additional Random Products
    {
      name: "Turbo Intercooler Kit",
      slug: "turbo-intercooler-kit",
      description: "High-performance aluminum intercooler kit with mandrel-bent piping. Reduces intake air temperature for maximum power gains and engine protection.",
      price: 445.99,
      compareAtPrice: 529.99,
      sku: "ENG-009-INTER",
      stockQuantity: 25,
      categorySlug: "engine-parts",
      status: "ACTIVE" as const,
      tags: ["premium", "turbo", "performance"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Turbo Intercooler Kit", order: 1 },
      ],
    },
    {
      name: "Racing Spark Plugs Set",
      slug: "racing-spark-plugs-set",
      description: "Iridium racing spark plugs engineered for high-performance engines. Extended electrode life and improved combustion efficiency.",
      price: 67.99,
      compareAtPrice: 89.99,
      sku: "ENG-010-SPARK",
      stockQuantity: 180,
      categorySlug: "engine-parts",
      status: "ACTIVE" as const,
      tags: ["racing", "performance", "bestseller"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Racing Spark Plugs Set", order: 1 },
      ],
      variants: [
        { name: "4-Cylinder Set", sku: "ENG-010-SPARK-4CYL", price: 67.99, quantity: 90 },
        { name: "6-Cylinder Set", sku: "ENG-010-SPARK-6CYL", price: 97.99, quantity: 60 },
        { name: "8-Cylinder Set", sku: "ENG-010-SPARK-8CYL", price: 129.99, quantity: 30 },
      ],
    },
    {
      name: "Carbon Fiber Spoiler",
      slug: "carbon-fiber-spoiler",
      description: "Aerodynamic carbon fiber rear spoiler with adjustable wing design. Lightweight construction improves downforce and vehicle stability at high speeds.",
      price: 389.99,
      sku: "ACC-011-SPOILER",
      stockQuantity: 35,
      categorySlug: "accessories",
      status: "ACTIVE" as const,
      tags: ["carbon-fiber", "aero", "premium"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Carbon Fiber Spoiler", order: 1 },
      ],
    },
    {
      name: "Performance Exhaust System",
      slug: "performance-exhaust-system",
      description: "Cat-back performance exhaust system with stainless steel construction. Deep aggressive sound with improved flow and horsepower gains.",
      price: 599.99,
      compareAtPrice: 749.99,
      sku: "ENG-012-EXHAUST",
      stockQuantity: 20,
      categorySlug: "engine-parts",
      status: "ACTIVE" as const,
      tags: ["performance", "premium", "sound"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Performance Exhaust System", order: 1 },
      ],
    },
    {
      name: "Cabin Air Filter Premium",
      slug: "cabin-air-filter-premium",
      description: "HEPA cabin air filter with activated carbon layer. Removes allergens, dust, and odors for cleaner interior air quality.",
      price: 18.99,
      compareAtPrice: 24.99,
      sku: "FLT-013-CABIN",
      stockQuantity: 250,
      categorySlug: "filters",
      status: "ACTIVE" as const,
      tags: ["hepa", "health", "oem"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Cabin Air Filter Premium", order: 1 },
      ],
    },
    {
      name: "HID Xenon Conversion Kit",
      slug: "hid-xenon-conversion-kit",
      description: "Professional HID xenon conversion kit with ballasts and bulbs. Produces 3x brighter light than halogen with 5000K crystal white output.",
      price: 89.99,
      compareAtPrice: 129.99,
      sku: "LED-014-HID",
      stockQuantity: 95,
      categorySlug: "lighting",
      status: "ACTIVE" as const,
      tags: ["xenon", "bright", "conversion"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "HID Xenon Conversion Kit", order: 1 },
      ],
      variants: [
        { name: "5000K (Crystal White)", sku: "LED-014-HID-5000K", price: 89.99, quantity: 40 },
        { name: "6000K (Cool White)", sku: "LED-014-HID-6000K", price: 94.99, quantity: 35 },
        { name: "8000K (Ice Blue)", sku: "LED-014-HID-8000K", price: 99.99, quantity: 20 },
      ],
    },
    {
      name: "Racing Brake Lines Kit",
      slug: "racing-brake-lines-kit",
      description: "Stainless steel braided brake lines for improved pedal feel and response. DOT approved with lifetime warranty against failure.",
      price: 124.99,
      sku: "BRK-015-LINES",
      stockQuantity: 65,
      categorySlug: "brake-system",
      status: "ACTIVE" as const,
      tags: ["racing", "performance", "warranty"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Racing Brake Lines Kit", order: 1 },
      ],
    },
    {
      name: "Universal Roof Rack System",
      slug: "universal-roof-rack-system",
      description: "Heavy-duty aluminum roof rack system with adjustable crossbars. 165 lbs capacity perfect for kayaks, bikes, cargo boxes and more.",
      price: 199.99,
      compareAtPrice: 259.99,
      sku: "ACC-016-ROOF",
      stockQuantity: 45,
      categorySlug: "accessories",
      status: "ACTIVE" as const,
      tags: ["utility", "aluminum", "universal"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Universal Roof Rack System", order: 1 },
      ],
    },
    {
      name: "Fuel Injector Cleaner Kit",
      slug: "fuel-injector-cleaner-kit",
      description: "Professional fuel injector cleaning kit with adapter set. Restores fuel economy and engine performance by removing carbon deposits.",
      price: 78.99,
      sku: "ENG-017-INJECT",
      stockQuantity: 110,
      categorySlug: "engine-parts",
      status: "ACTIVE" as const,
      tags: ["maintenance", "fuel-system", "tools"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Fuel Injector Cleaner Kit", order: 1 },
      ],
    },
    {
      name: "RGB Under-Glow Light Kit",
      slug: "rgb-under-glow-light-kit",
      description: "Wireless RGB LED underglow kit with smartphone app control. 16 million colors, music sync, and multiple flash patterns. Waterproof IP67 rated.",
      price: 149.99,
      compareAtPrice: 199.99,
      sku: "LED-018-GLOW",
      stockQuantity: 80,
      categorySlug: "lighting",
      status: "ACTIVE" as const,
      tags: ["rgb", "wireless", "app-control"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "RGB Under-Glow Light Kit", order: 1 },
      ],
      variants: [
        { name: "4-Strip Kit", sku: "LED-018-GLOW-4STRIP", price: 149.99, quantity: 50 },
        { name: "6-Strip Kit", sku: "LED-018-GLOW-6STRIP", price: 189.99, quantity: 30 },
      ],
    },
    // Virtual Products for Download Testing
    {
      name: "Car Diagnostic Software Pro",
      slug: "car-diagnostic-software-pro",
      description: "Professional OBD-II diagnostic software for comprehensive vehicle analysis. Includes advanced features for live data monitoring, fault code reading, and ECU programming.",
      price: 299.99,
      compareAtPrice: 399.99,
      sku: "SOFT-001-DIAG",
      stockQuantity: 999, // Virtual products have unlimited stock
      categorySlug: "accessories",
      status: "ACTIVE" as const,
      tags: ["software", "diagnostic", "professional", "virtual"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Car Diagnostic Software Pro", order: 1 },
      ],
      isVirtual: true,
      downloadUrl: "/api/downloads/virtual-products/diag001/car-diagnostic-software-pro.zip",
      downloadLimit: 999999, // Unlimited
      downloadExpiry: null, // No expiry
      licenseKey: "DIAG-{YEAR}-{RANDOM4}-{RANDOM4}-{PRODUCT_CODE}",
      fileSize: "245 MB",
      systemRequirements: "Windows 10/11, 4GB RAM, OBD-II adapter required",
    },
    {
      name: "ECU Tuning Suite Advanced",
      slug: "ecu-tuning-suite-advanced",
      description: "Complete ECU tuning software suite with support for 500+ vehicle models. Includes mapping tools, data logging, and safety features for professional tuners.",
      price: 1299.99,
      compareAtPrice: 1599.99,
      sku: "SOFT-002-ECU",
      stockQuantity: 999,
      categorySlug: "engine-parts",
      status: "ACTIVE" as const,
      tags: ["software", "tuning", "professional", "virtual", "premium"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "ECU Tuning Suite Advanced", order: 1 },
      ],
      isVirtual: true,
      downloadUrl: "/api/downloads/virtual-products/ecu002/ecu-tuning-suite-advanced.zip",
      downloadLimit: 999999, // Unlimited
      downloadExpiry: null, // No expiry
      licenseKey: "ECU-{YEAR}-{RANDOM8}-{RANDOM4}",
      fileSize: "1.2 GB",
      systemRequirements: "Windows 10/11, 8GB RAM, Professional OBD interface required",
    },
    {
      name: "Vehicle Maintenance Database",
      slug: "vehicle-maintenance-database",
      description: "Comprehensive vehicle maintenance schedules and service intervals database. Covers 15,000+ vehicle models with detailed service procedures and specifications.",
      price: 49.99,
      sku: "SOFT-003-MAINT",
      stockQuantity: 999,
      categorySlug: "accessories",
      status: "ACTIVE" as const,
      tags: ["database", "maintenance", "reference", "virtual"],
      images: [
        { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop&crop=center", alt: "Vehicle Maintenance Database", order: 1 },
      ],
      isVirtual: true,
      downloadUrl: "/api/downloads/virtual-products/maint003/vehicle-maintenance-database.zip",
      downloadLimit: 999999, // Unlimited
      downloadExpiry: null, // No expiry
      licenseKey: "MAINT-{YEAR}-{RANDOM6}",
      fileSize: "89 MB",
      systemRequirements: "Windows/Mac/Linux, PDF reader required",
    },
  ];

  // Create products
  for (const productData of productsData) {
    const { categorySlug, tags: tagNames, variants, images, ...productInfo } = productData;
    
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) continue;

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        name: productInfo.name,
        slug: productInfo.slug,
        description: productInfo.description,
        price: productInfo.price,
        compareAtPrice: (productInfo as any).compareAtPrice ?? null,
        sku: productInfo.sku,
        quantity: (productInfo as any).stockQuantity ?? 0,
        status: productInfo.status,
        categoryId: category.id,
        // Virtual product fields
        isVirtual: (productInfo as any).isVirtual ?? false,
        downloadUrl: (productInfo as any).downloadUrl ?? null,
        downloadLimit: (productInfo as any).downloadLimit ?? null,
        downloadExpiry: (productInfo as any).downloadExpiry ?? null,
        licenseKey: (productInfo as any).licenseKey ?? null,
        fileSize: (productInfo as any).fileSize ?? null,
        systemRequirements: (productInfo as any).systemRequirements ?? null,
      },
    });

    // Replace product images to avoid duplicates, then insert fresh
    if (images && images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.createMany({
        data: images.map((image) => ({
          productId: product.id,
          url: image.url,
          altText: (image as any).alt ?? null,
          sortOrder: (image as any).order ?? 0,
        })),
      });
    }

    // Add product variants
    if (variants) {
      for (const variant of variants) {
        await prisma.productVariant.upsert({
          where: { sku: variant.sku },
          update: {},
          create: {
            productId: product.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            quantity: variant.quantity,
            isActive: true,
          },
        });
      }
    }

    // Add product tags
    // Add product tags (per-product simple strings)
    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames as string[]) {
        await prisma.productTag.upsert({
          where: {
            productId_name: {
              productId: product.id,
              name: tagName,
            },
          },
          update: {},
          create: {
            productId: product.id,
            name: tagName,
          },
        });
      }
    }

    console.log(`✅ Created product: ${product.name}`);
  }

  // Create a test course for video playback testing
  console.log("🌱 Creating test course...");
  
  const testCourse = await prisma.course.create({
    data: {
      title: "Test Video Course",
      slug: "test-video-course",
      description: "A test course for debugging video playback functionality",
      shortDescription: "Test course with YouTube videos",
      thumbnail: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop",
      price: 0,
      level: "BEGINNER",
      language: "en",
      status: "PUBLISHED",
      isActive: true,
      isFeatured: true,
      allowPreview: true,
      certificateEnabled: false,
      publishedAt: new Date(),
    },
  });

  // Create test module
  const testModule = await prisma.courseModule.create({
    data: {
      courseId: testCourse.id,
      title: "Introduction to Car Maintenance",
      description: "Basic car maintenance concepts",
      orderIndex: 1,
      isActive: true,
    },
  });

  // Create test videos
  await prisma.courseVideo.create({
    data: {
      moduleId: testModule.id,
      title: "Welcome to Car Maintenance",
      description: "Introduction video",
      videoType: "YOUTUBE",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      duration: 212,
      orderIndex: 1,
      isPreview: true,
      isActive: true,
    },
  });

  await prisma.courseVideo.create({
    data: {
      moduleId: testModule.id,
      title: "Basic Tools Overview",
      description: "Essential tools for car maintenance",
      videoType: "YOUTUBE",
      youtubeUrl: "https://www.youtube.com/watch?v=oHg5SJYRHA0",
      youtubeVideoId: "oHg5SJYRHA0",
      duration: 300,
      orderIndex: 2,
      isPreview: false,
      isActive: true,
    },
  });

  // Create test user and enroll them
  const testUser = await prisma.user.create({
    data: {
      email: "student@compucar.com",
      firstName: "Test",
      lastName: "Student",
      password: await bcrypt.hash("password123", 10),
          role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  // Enroll test user in the course
  await prisma.courseEnrollment.create({
    data: {
      userId: testUser.id,
      courseId: testCourse.id,
      status: "ACTIVE",
      source: "MANUAL",
      enrolledAt: new Date(),
    },
  });

  console.log("✅ Created test course with videos");
  console.log("📧 Test student: student@compucar.com (password: password123)");
  console.log("🎯 Course URL: /account/courses/" + testCourse.id);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
