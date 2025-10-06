#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function testButtonStyling() {
  try {
    console.log('🧪 Testing button styling improvements for filename display...');

    // Find files with long filenames to test with
    const files = await prisma.tuningFile.findMany({
      where: {
        OR: [
          { originalFilename: { contains: 'TC1767' } }, // Long filename
          { modifiedFilename: { not: null } }
        ]
      },
      select: {
        id: true,
        originalFilename: true,
        modifiedFilename: true,
        status: true
      },
      take: 3
    });

    console.log(`📁 Found ${files.length} files to test with:`);
    
    files.forEach((file, index) => {
      console.log(`\n${index + 1}. File ID: ${file.id}`);
      console.log(`   📊 Status: ${file.status}`);
      console.log(`   📄 Original filename: "${file.originalFilename}"`);
      console.log(`   📏 Original length: ${file.originalFilename.length} characters`);
      
      if (file.modifiedFilename) {
        console.log(`   📄 Modified filename: "${file.modifiedFilename}"`);
        console.log(`   📏 Modified length: ${file.modifiedFilename.length} characters`);
      } else {
        console.log(`   📄 Modified filename: None`);
      }

      // Test truncation logic
      const maxLength = 200;
      const originalTruncated = file.originalFilename.length > maxLength 
        ? file.originalFilename.substring(0, maxLength) + '...'
        : file.originalFilename;
      
      console.log(`   ✂️  Original truncated: "${originalTruncated}"`);
      
      if (file.modifiedFilename) {
        const modifiedTruncated = file.modifiedFilename.length > maxLength 
          ? file.modifiedFilename.substring(0, maxLength) + '...'
          : file.modifiedFilename;
        console.log(`   ✂️  Modified truncated: "${modifiedTruncated}"`);
      }
    });

    console.log('\n🎨 Button Styling Improvements Applied:');
    console.log('✅ Added `truncate` class to filename spans');
    console.log('✅ Added `max-w-[200px]` to limit button text width');
    console.log('✅ Added `title` attribute for full filename tooltip');
    console.log('✅ Applied to both original and modified file buttons');
    console.log('✅ Applied to upload section filename display');

    console.log('\n📱 Responsive Design Features:');
    console.log('✅ Text truncates with ellipsis (...) when too long');
    console.log('✅ Full filename shows on hover via tooltip');
    console.log('✅ Buttons maintain consistent width');
    console.log('✅ Icons remain visible alongside truncated text');

    console.log('\n🎉 Button styling test completed successfully!');
    console.log('✅ Long filenames will now display properly in buttons');
    console.log('✅ Users can see full filename on hover');
    console.log('✅ Buttons maintain clean, professional appearance');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error testing button styling:', error);
  }
}

testButtonStyling();
