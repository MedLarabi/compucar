import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { prisma } from '../src/lib/database/prisma';

async function checkDatabaseData() {
  console.log('🔍 Checking Yalidine Database Data...\n');
  
  try {
    // Check wilayas
    const wilayasCount = await prisma.wilaya.count();
    const activeWilayasCount = await prisma.wilaya.count({ where: { active: true } });
    
    console.log('🌍 Wilayas:');
    console.log(`   Total: ${wilayasCount}`);
    console.log(`   Active: ${activeWilayasCount}`);
    
    if (wilayasCount > 0) {
      const sampleWilayas = await prisma.wilaya.findMany({
        take: 5,
        select: { id: true, nameFr: true, nameAr: true, code: true, active: true }
      });
      console.log('   Sample wilayas:', sampleWilayas);
    }
    
    // Check communes
    const communesCount = await prisma.commune.count();
    const activeCommunesCount = await prisma.commune.count({ where: { active: true } });
    
    console.log('\n🏘️ Communes:');
    console.log(`   Total: ${communesCount}`);
    console.log(`   Active: ${activeCommunesCount}`);
    
    if (communesCount > 0) {
      const sampleCommunes = await prisma.commune.findMany({
        take: 5,
        include: { wilaya: { select: { nameFr: true } } }
      });
      console.log('   Sample communes:', sampleCommunes.map(c => `${c.name} (${c.wilaya.nameFr})`));
    }
    
    // Check stop desks
    const stopDesksCount = await prisma.stopDesk.count();
    const activeStopDesksCount = await prisma.stopDesk.count({ where: { active: true } });
    
    console.log('\n📍 Stop Desks:');
    console.log(`   Total: ${stopDesksCount}`);
    console.log(`   Active: ${activeStopDesksCount}`);
    
    if (stopDesksCount > 0) {
      const sampleStopDesks = await prisma.stopDesk.findMany({
        take: 5,
        include: { wilaya: { select: { nameFr: true } } }
      });
      console.log('   Sample stop desks:', sampleStopDesks.map(s => `${s.name} (${s.wilaya.nameFr})`));
    }
    
    // Summary
    console.log('\n📊 Database Status:');
    if (wilayasCount === 0) {
      console.log('❌ No wilayas found - database needs to be seeded');
    }
    if (communesCount === 0) {
      console.log('❌ No communes found - database needs to be seeded');  
    }
    if (stopDesksCount === 0) {
      console.log('❌ No stop desks found - database needs to be seeded');
    }
    
    if (wilayasCount > 0 && communesCount > 0 && stopDesksCount > 0) {
      console.log('✅ Database is properly seeded with Yalidine data');
    } else {
      console.log('\n💡 To fix this, run the Yalidine sync script:');
      console.log('   npx tsx scripts/syncYalidine.ts');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

async function main() {
  await checkDatabaseData();
}

main().catch(console.error);
