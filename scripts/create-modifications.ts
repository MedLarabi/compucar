#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function createModifications() {
  try {
    console.log('🔧 Creating file tuning modifications...');

    const modifications = [
      {
        code: 'ECU_REMAP',
        label: 'ECU Remapping',
        description: 'Engine Control Unit remapping for improved performance and fuel efficiency'
      },
      {
        code: 'DPF_DELETE',
        label: 'DPF Delete',
        description: 'Diesel Particulate Filter removal and ECU adjustment'
      },
      {
        code: 'EGR_DELETE',
        label: 'EGR Delete',
        description: 'Exhaust Gas Recirculation system removal and optimization'
      },
      {
        code: 'ADBLUE_DELETE',
        label: 'AdBlue Delete',
        description: 'AdBlue/SCR system removal and ECU modification'
      },
      {
        code: 'SPEED_LIMITER',
        label: 'Speed Limiter Removal',
        description: 'Remove electronic speed limiter restrictions'
      },
      {
        code: 'TORQUE_MONITORING',
        label: 'Torque Monitoring Delete',
        description: 'Remove torque monitoring and related restrictions'
      },
      {
        code: 'POP_BANG',
        label: 'Pop & Bang Tune',
        description: 'Add pop and bang effects to exhaust system'
      },
      {
        code: 'LAUNCH_CONTROL',
        label: 'Launch Control',
        description: 'Add launch control functionality for better acceleration'
      },
      {
        code: 'REV_LIMITER',
        label: 'Rev Limiter Adjustment',
        description: 'Adjust or remove rev limiter for higher RPM'
      },
      {
        code: 'IMMOBILIZER',
        label: 'Immobilizer Delete',
        description: 'Remove immobilizer system for engine swap compatibility'
      },
      {
        code: 'MAF_DELETE',
        label: 'MAF Delete',
        description: 'Mass Air Flow sensor removal and ECU adjustment'
      },
      {
        code: 'LAMBDA_DELETE',
        label: 'Lambda Delete',
        description: 'Lambda/O2 sensor removal and fuel mapping adjustment'
      }
    ];

    console.log(`📝 Creating ${modifications.length} modifications...`);

    for (const mod of modifications) {
      const modification = await prisma.modification.create({
        data: mod
      });
      console.log(`✅ Created: ${modification.label} (${modification.code})`);
    }

    console.log('\n🎉 All modifications created successfully!');
    console.log('\n📋 Available modifications:');
    
    const allMods = await prisma.modification.findMany({
      orderBy: { id: 'asc' }
    });
    
    allMods.forEach((mod, index) => {
      console.log(`  ${index + 1}. ${mod.label} (${mod.code})`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error creating modifications:', error);
  }
}

createModifications();
