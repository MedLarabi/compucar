import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { yalidineStatusChecker } from "@/lib/services/yalidine-status-checker";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can trigger status checks
    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, orderId, tracking } = body;

    if (action === 'check-all') {
      // Check all pending orders
      console.log('🔍 Admin triggered status check for all orders');
      const results = await yalidineStatusChecker.checkAllPendingOrders();
      
      return NextResponse.json({
        success: true,
        message: `Checked ${results.checked} orders, updated ${results.updated}, delivered ${results.delivered}`,
        results
      });

    } else if (action === 'check-single' && orderId && tracking) {
      // Check specific order
      console.log(`🔍 Admin triggered status check for order ${orderId}`);
      const result = await yalidineStatusChecker.checkOrderStatus(orderId, tracking);
      
      return NextResponse.json({
        success: true,
        message: result.updated 
          ? `Order status updated${result.delivered ? ' - DELIVERED!' : ''}`
          : 'No status change detected',
        result
      });

    } else if (action === 'stats') {
      // Get status check statistics
      const stats = await yalidineStatusChecker.getStatusCheckStats();
      
      return NextResponse.json({
        success: true,
        stats
      });

    } else {
      return NextResponse.json({ 
        error: "Invalid action. Use 'check-all', 'check-single', or 'stats'" 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in Yalidine status check API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view status check stats
    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get status check statistics
    const stats = await yalidineStatusChecker.getStatusCheckStats();
    
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("Error getting Yalidine status stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
