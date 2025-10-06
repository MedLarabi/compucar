#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';
import bcrypt from 'bcryptjs';

async function createTestData() {
  try {
    console.log('🌱 Creating test data...');

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@compucar.com" },
      update: {},
      create: {
        email: "admin@compucar.com",
        firstName: "Admin",
        lastName: "User",
        name: "Admin User",
        password: await bcrypt.hash("admin123", 10),
        role: "ADMIN",
        isAdmin: true,
        emailVerified: new Date(),
      },
    });

    console.log("✅ Created admin user:", adminUser.email);

    // Create test customer
    const testUser = await prisma.user.upsert({
      where: { email: "test@compucar.com" },
      update: {},
      create: {
        email: "test@compucar.com",
        firstName: "Test",
        lastName: "Customer",
        name: "Test Customer",
        password: await bcrypt.hash("test123", 10),
        role: "CUSTOMER",
        isAdmin: false,
        emailVerified: new Date(),
      },
    });

    console.log("✅ Created test customer:", testUser.email);

    // Create some test files for the customer
    const testFiles = [
      {
        originalFilename: "test-file-1.bin",
        r2Key: "test-key-1",
        fileSize: BigInt(1024000),
        fileType: "application/octet-stream",
        status: "RECEIVED" as const,
        customerComment: "Test file 1 for tuning",
      },
      {
        originalFilename: "test-file-2.hex",
        r2Key: "test-key-2", 
        fileSize: BigInt(2048000),
        fileType: "application/octet-stream",
        status: "PENDING" as const,
        customerComment: "Test file 2 for tuning",
        estimatedProcessingTime: 15,
      },
      {
        originalFilename: "test-file-3.ecu",
        r2Key: "test-key-3",
        fileSize: BigInt(512000),
        fileType: "application/octet-stream", 
        status: "READY" as const,
        customerComment: "Test file 3 for tuning",
        price: 2500,
        paymentStatus: "PAID" as const,
      }
    ];

    for (const fileData of testFiles) {
      const file = await prisma.tuningFile.create({
        data: {
          ...fileData,
          userId: testUser.id,
        }
      });
      console.log(`✅ Created test file: ${file.originalFilename} (${file.status})`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Login credentials:');
    console.log('Admin: admin@compucar.com / admin123');
    console.log('Customer: test@compucar.com / test123');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();
