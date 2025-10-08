import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modifications = [
  {
    code: 'EGR_DELETE',
    label: 'EGR Delete',
    description: 'Disable exhaust gas recirculation system'
  },
  {
    code: 'DPF_DELETE',
    label: 'DPF Delete',
    description: 'Remove diesel particulate filter restrictions'
  },
  {
    code: 'ADBLUE_DELETE',
    label: 'AdBlue Delete',
    description: 'Remove selective catalytic reduction system'
  },
  {
    code: 'LAMBDA_DELETE',
    label: 'Lambda/O2 Sensor Delete',
    description: 'Remove oxygen sensor monitoring and error codes'
  },
  {
    code: 'DTC_DELETE',
    label: 'DTC Error Code Delete',
    description: 'Remove specific diagnostic trouble codes'
  },
  {
    code: 'SECONDARY_Pump',
    label: 'Secondary Pump Delete',
    description: 'Remove secondary Pump system'
  },
  {
    code: 'COLD_START',
    label: 'Cold Start Delete',
    description: 'Remove cold start emissions restrictions and noise'
  },
  {
    code: 'IMMO_OFF',
    label: 'Immobilizer Delete',
    description: 'Remove immobilizer system'
  },
  {
    code: 'VIRGIN_ECU',
    label: 'Virgin ECU Preparation',
    description: 'Prepare ECU for first-time tuning and modifications'
  },
  {
    code: 'STAGE_1',
    label: 'Stage 1 Tune',
    description: 'Basic ECU remap for improved power and torque (+15-25% power)'
  },
  {
    code: 'STAGE_2',
    label: 'Stage 2 Tune',
    description: 'Advanced tune with hardware modifications support (+25-40% power)'
  },
  {
    code: 'STAGE_3',
    label: 'Stage 3 Tune',
    description: 'High-performance tune for extensively modified vehicles (+40-60% power)'
  },
  {
    code: 'SPEED_LIMITER',
    label: 'Speed Limiter Removal',
    description: 'Remove factory speed limitations (155mph/250kph limit)'
  },
  {
    code: 'CRACKLE_MAP',
    label: 'Crackle Map',
    description: 'Enhanced exhaust crackles and pops during overrun'
  },
  {
    code: 'GEARBOX_TUNE',
    label: 'Automatic Gearbox Tune',
    description: 'Optimize automatic transmission shift points and firmness'
  },
  {
    code: 'ETHANOL_E85',
    label: 'E85 Ethanol Support',
    description: 'Add E85 ethanol fuel support and flex fuel capability'
  }
];

async function main() {
  console.log('Seeding modifications...');
  
  // First, delete all existing modifications
  console.log('Clearing existing modifications...');
  await prisma.modification.deleteMany({});
  
  // Then create the new ones
  for (const modification of modifications) {
    await prisma.modification.create({
      data: modification
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