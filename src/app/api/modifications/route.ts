import { NextRequest, NextResponse } from 'next/server';

// Static fallback data
const staticModifications = [
  {
    id: 1,
    code: 'EGR_DELETE',
    label: 'EGR Delete',
    description: 'Disable exhaust gas recirculation system'
  },
  {
    id: 2,
    code: 'DPF_DELETE',
    label: 'DPF Delete',
    description: 'Remove diesel particulate filter restrictions'
  },
  {
    id: 3,
    code: 'ADBLUE_DELETE',
    label: 'AdBlue Delete',
    description: 'Remove selective catalytic reduction system'
  },
  {
    id: 4,
    code: 'LAMBDA_DELETE',
    label: 'Lambda/O2 Sensor Delete',
    description: 'Remove oxygen sensor monitoring and error codes'
  },
  {
    id: 5,
    code: 'DTC_DELETE',
    label: 'DTC Error Code Delete',
    description: 'Remove specific diagnostic trouble codes'
  },
  {
    id: 6,
    code: 'SECONDARY_Pump',
    label: 'Secondary Pump Delete',
    description: 'Remove secondary Pump system'
  },
  {
    id: 7,
    code: 'COLD_START',
    label: 'Cold Start Delete',
    description: 'Remove cold start emissions restrictions and noise'
  },
  {
    id: 8,
    code: 'IMMO_OFF',
    label: 'Immobilizer Delete',
    description: 'Remove immobilizer system'
  },
  {
    id: 9,
    code: 'VIRGIN_ECU',
    label: 'Virgin ECU Preparation',
    description: 'Prepare ECU for first-time tuning and modifications'
  },
  {
    id: 10,
    code: 'STAGE_1',
    label: 'Stage 1 Tune',
    description: 'Basic ECU remap for improved power and torque (+15-25% power)'
  },
  {
    id: 11,
    code: 'STAGE_2',
    label: 'Stage 2 Tune',
    description: 'Advanced tune with hardware modifications support (+25-40% power)'
  },
  {
    id: 12,
    code: 'STAGE_3',
    label: 'Stage 3 Tune',
    description: 'High-performance tune for extensively modified vehicles (+40-60% power)'
  },
  {
    id: 13,
    code: 'SPEED_LIMITER',
    label: 'Speed Limiter Removal',
    description: 'Remove factory speed limitations (155mph/250kph limit)'
  },
  {
    id: 14,
    code: 'CRACKLE_MAP',
    label: 'Crackle Map',
    description: 'Enhanced exhaust crackles and pops during overrun'
  },
  {
    id: 15,
    code: 'GEARBOX_TUNE',
    label: 'Automatic Gearbox Tune',
    description: 'Optimize automatic transmission shift points and firmness'
  },
  {
    id: 16,
    code: 'ETHANOL_E85',
    label: 'E85 Ethanol Support',
    description: 'Add E85 ethanol fuel support and flex fuel capability'
  }
];

export async function GET() {
  try {
    // Try to use database first
    try {
      const { prisma } = await import('@/lib/database/prisma');
      
      // Define the desired order of modification codes
      const desiredOrder = [
        'EGR_DELETE',
        'DPF_DELETE',
        'ADBLUE_DELETE',
        'LAMBDA_DELETE',
        'DTC_DELETE',
        'SECONDARY_Pump',
        'COLD_START',
        'IMMO_OFF',
        'VIRGIN_ECU',
        'STAGE_1',
        'STAGE_2',
        'STAGE_3',
        'SPEED_LIMITER',
        'CRACKLE_MAP',
        'GEARBOX_TUNE',
        'ETHANOL_E85'
      ];
      
      const modifications = await prisma.modification.findMany({
        select: {
          id: true,
          code: true,
          label: true,
          description: true
        }
      });

      // Sort modifications according to the desired order
      const sortedModifications = modifications.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a.code);
        const indexB = desiredOrder.indexOf(b.code);
        
        // If both codes are in the desired order, sort by their position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // If only one is in the desired order, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // If neither is in the desired order, sort alphabetically
        return a.label.localeCompare(b.label);
      });

      // If database has modifications, return them
      if (sortedModifications.length > 0) {
        return NextResponse.json({
          success: true,
          data: sortedModifications,
          source: 'database'
        });
      } else {
        // Database is empty, fall back to static data
        console.log('Database has no modifications, using static fallback');
        return NextResponse.json({
          success: true,
          data: staticModifications,
          source: 'static_fallback'
        });
      }
    } catch (dbError) {
      console.warn('Database error, falling back to static data:', dbError);
      
      // Fall back to static data
      return NextResponse.json({
        success: true,
        data: staticModifications,
        source: 'static_error'
      });
    }

  } catch (error) {
    console.error('Error in modifications API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}