import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modifications = [
  {
    code: 'STAGE_1',
    label: 'Stage 1 Tune',
    description: 'Basic ECU remap for improved power and torque'
  },
  {
    code: 'STAGE_2',
    label: 'Stage 2 Tune',
    description: 'Advanced tune with hardware modifications support'
  },
  {
    code: 'STAGE_3',
    label: 'Stage 3 Tune',
    description: 'High-performance tune for extensively modified vehicles'
  },
  {
    code: 'ECONOMY',
    label: 'Economy Tune',
    description: 'Optimized for fuel efficiency and reduced emissions'
  },
  {
    code: 'DPF_DELETE',
    label: 'DPF Delete',
    description: 'Remove diesel particulate filter restrictions'
  },
  {
    code: 'EGR_DELETE',
    label: 'EGR Delete',
    description: 'Disable exhaust gas recirculation system'
  },
  {
    code: 'ADBLUE_DELETE',
    label: 'AdBlue Delete',
    description: 'Remove selective catalytic reduction system'
  },
  {
    code: 'SWIRL_DELETE',
    label: 'Swirl Flap Delete',
    description: 'Disable intake manifold swirl flaps'
  },
  {
    code: 'LAMBDA_DELETE',
    label: 'Lambda Delete',
    description: 'Remove oxygen sensor monitoring'
  },
  {
    code: 'SPEED_LIMITER',
    label: 'Speed Limiter Removal',
    description: 'Remove factory speed limitations'
  },
  {
    code: 'REV_LIMITER',
    label: 'Rev Limiter Adjustment',
    description: 'Modify engine rev limiter settings'
  },
  {
    code: 'LAUNCH_CONTROL',
    label: 'Launch Control',
    description: 'Add launch control functionality'
  },
  {
    code: 'POP_BANG',
    label: 'Pop & Bang',
    description: 'Add exhaust pops and bangs on deceleration'
  },
  {
    code: 'COLD_START',
    label: 'Cold Start Delete',
    description: 'Remove cold start emissions restrictions'
  },
  {
    code: 'IMMOBILIZER',
    label: 'Immobilizer Delete',
    description: 'Remove engine immobilizer system'
  },
  {
    code: 'GEARBOX_TUNE',
    label: 'Gearbox Tune',
    description: 'Optimize automatic transmission parameters'
  },
  {
    code: 'DSG_TUNE',
    label: 'DSG Tune',
    description: 'Enhance dual-clutch transmission performance'
  },
  {
    code: 'TORQUE_LIMIT',
    label: 'Torque Limiter Removal',
    description: 'Remove factory torque limitations'
  }
];

async function main() {
  console.log('Seeding modifications...');
  
  for (const modification of modifications) {
    await prisma.modification.upsert({
      where: { code: modification.code },
      update: modification,
      create: modification
    });
  }
  
  console.log(`Seeded ${modifications.length} modifications`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });