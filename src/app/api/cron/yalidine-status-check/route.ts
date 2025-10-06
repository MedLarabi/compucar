import { NextRequest, NextResponse } from "next/server";
import { yalidineStatusChecker } from "@/lib/services/yalidine-status-checker";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.warn('⚠️ CRON_SECRET not configured, skipping authentication');
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid cron secret provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('⏰ Cron job triggered: Yalidine status check');
    
    // Check all pending orders
    const results = await yalidineStatusChecker.checkAllPendingOrders();
    
    // Log results for monitoring
    console.log('📊 Cron job completed:', {
      timestamp: new Date().toISOString(),
      checked: results.checked,
      updated: results.updated,
      delivered: results.delivered,
      errors: results.errors.length
    });

    // Return success response for cron monitoring
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Checked ${results.checked} orders, updated ${results.updated}, delivered ${results.delivered}`,
      results: {
        checked: results.checked,
        updated: results.updated,
        delivered: results.delivered,
        errorCount: results.errors.length,
        errors: results.errors.slice(0, 5) // Only return first 5 errors to avoid large responses
      }
    });

  } catch (error) {
    console.error("💥 Cron job error:", error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests as well for flexibility
  return GET(request);
}
