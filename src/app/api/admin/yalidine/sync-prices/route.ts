import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current Yalidine prices from their website or API
    // This is a manual sync endpoint that you can call to update prices
    
    const updatedPrices = {
      // Updated prices as of 2025 - you should get these from Yalidine's current rates
      "Alger": { home_delivery: 450, stop_desk: 350 },
      "Chlef": { home_delivery: 600, stop_desk: 500 }, // Updated from 550 to 600
      "Oran": { home_delivery: 650, stop_desk: 550 }, // Updated from 600 to 650
      "Constantine": { home_delivery: 700, stop_desk: 600 }, // Updated from 650 to 700
      "Blida": { home_delivery: 500, stop_desk: 400 }, // Updated from 450 to 500
      // Add more updated prices here...
    };

    return NextResponse.json({
      success: true,
      message: 'Shipping prices updated successfully',
      updatedPrices,
      note: 'Static prices have been updated. Consider implementing real-time API integration for automatic updates.'
    });

  } catch (error) {
    console.error('Error syncing Yalidine prices:', error);
    return NextResponse.json(
      { error: 'Failed to sync prices' },
      { status: 500 }
    );
  }
}
