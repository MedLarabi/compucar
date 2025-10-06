import { NextRequest, NextResponse } from 'next/server';
import { yalidineCalculateShipping } from '@/lib/yalidine/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wilaya, commune, weight, isStopdesk, length, width, height } = body;
    
    if (!wilaya || weight === undefined) {
      return NextResponse.json(
        { error: 'Wilaya and weight parameters are required' },
        { status: 400 }
      );
    }

    console.log('📦 Shipping calculation request:', { wilaya, commune, weight, isStopdesk, dimensions: { length, width, height } });

    // Use the enhanced yalidineCalculateShipping with real-time API
    const result = await yalidineCalculateShipping(
      wilaya, 
      weight, 
      isStopdesk || false, 
      commune,
      length,
      width,
      height
    );
    
    if (!result.ok) {
      console.warn('⚠️ Real-time calculation failed, using fallback:', result.error);
      // Graceful fallback to a local estimate to avoid blocking checkout
      const w = typeof weight === 'number' && !Number.isNaN(weight) ? weight : 1;
      const baseCost = w <= 1 ? 300 : w <= 3 ? 500 : w <= 5 ? 700 : 1000;
      const discount = isStopdesk ? 0.8 : 1;
      const cost = Math.round(baseCost * discount);
      return NextResponse.json({ 
        shipping: { 
          cost, 
          currency: 'DZD', 
          estimatedDays: isStopdesk ? 2 : 3,
          details: { source: 'api_fallback', reason: result.error }
        } 
      });
    }

    console.log('✅ Real-time shipping calculation successful:', result.data);
    return NextResponse.json({ shipping: result.data });
  } catch (error) {
    console.error('💥 Error in shipping calculation API:', error);
    // Fallback on unexpected errors too
    return NextResponse.json({ 
      shipping: { 
        cost: 500, 
        currency: 'DZD', 
        estimatedDays: 3,
        details: { source: 'error_fallback', error: String(error) }
      } 
    });
  }
}
