#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function checkModifications() {
  try {
    console.log('🔍 Checking modifications in database...');
    
    const modifications = await prisma.modification.findMany({
      select: {
        id: true,
        code: true,
        label: true,
        description: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Total modifications: ${modifications.length}`);
    
    if (modifications.length > 0) {
      console.log('\n📋 Available modifications:');
      modifications.forEach((mod, index) => {
        console.log(`  ${index + 1}. ${mod.label} (${mod.code})`);
        console.log(`     Description: ${mod.description || 'No description'}`);
        console.log(`     Created: ${mod.createdAt.toISOString()}`);
        console.log('');
      });
    } else {
      console.log('❌ No modifications found in database');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkModifications();
