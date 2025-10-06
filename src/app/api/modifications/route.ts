import { NextRequest, NextResponse } from 'next/server';

// Static fallback data
const staticModifications = [
  {
    id: 1,
    code: 'STAGE_1',
    label: 'Stage 1 Tune',
    description: 'Basic ECU remap for improved power and torque'
  },
  {
    id: 2,
    code: 'STAGE_2',
    label: 'Stage 2 Tune',
    description: 'Advanced tune with hardware modifications support'
  },
  {
    id: 3,
    code: 'STAGE_3',
    label: 'Stage 3 Tune',
    description: 'High-performance tune for extensively modified vehicles'
  },
  {
    id: 4,
    code: 'ECONOMY',
    label: 'Economy Tune',
    description: 'Optimized for fuel efficiency and reduced emissions'
  },
  {
    id: 5,
    code: 'DPF_DELETE',
    label: 'DPF Delete',
    description: 'Remove diesel particulate filter restrictions'
  },
  {
    id: 6,
    code: 'EGR_DELETE',
    label: 'EGR Delete',
    description: 'Disable exhaust gas recirculation system'
  },
  {
    id: 7,
    code: 'ADBLUE_DELETE',
    label: 'AdBlue Delete',
    description: 'Remove selective catalytic reduction system'
  },
  {
    id: 8,
    code: 'SWIRL_DELETE',
    label: 'Swirl Flap Delete',
    description: 'Disable intake manifold swirl flaps'
  },
  {
    id: 9,
    code: 'LAMBDA_DELETE',
    label: 'Lambda Delete',
    description: 'Remove oxygen sensor monitoring'
  },
  {
    id: 10,
    code: 'SPEED_LIMITER',
    label: 'Speed Limiter Removal',
    description: 'Remove factory speed limitations'
  },
  {
    id: 11,
    code: 'REV_LIMITER',
    label: 'Rev Limiter Adjustment',
    description: 'Modify engine rev limiter settings'
  },
  {
    id: 12,
    code: 'LAUNCH_CONTROL',
    label: 'Launch Control',
    description: 'Add launch control functionality'
  },
  {
    id: 13,
    code: 'POP_BANG',
    label: 'Pop & Bang',
    description: 'Add exhaust pops and bangs on deceleration'
  },
  {
    id: 14,
    code: 'COLD_START',
    label: 'Cold Start Delete',
    description: 'Remove cold start emissions restrictions'
  },
  {
    id: 15,
    code: 'IMMOBILIZER',
    label: 'Immobilizer Delete',
    description: 'Remove engine immobilizer system'
  },
  {
    id: 16,
    code: 'GEARBOX_TUNE',
    label: 'Gearbox Tune',
    description: 'Optimize automatic transmission parameters'
  },
  {
    id: 17,
    code: 'DSG_TUNE',
    label: 'DSG Tune',
    description: 'Enhance dual-clutch transmission performance'
  },
  {
    id: 18,
    code: 'TORQUE_LIMIT',
    label: 'Torque Limiter Removal',
    description: 'Remove factory torque limitations'
  }
];

export async function GET() {
  try {
    // Try to use database first
    try {
      const { prisma } = await import('@/lib/database/prisma');
      
      const modifications = await prisma.modification.findMany({
        orderBy: {
          label: 'asc'
        },
        select: {
          id: true,
          code: true,
          label: true,
          description: true
        }
      });

      // If database has modifications, return them
      if (modifications.length > 0) {
        return NextResponse.json({
          success: true,
          data: modifications,
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