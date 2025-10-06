import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { 
  revokeLicenseKey,
  returnLicenseKeyToStock
} from "@/lib/services/license-key-service";

// POST - Perform actions on license keys (revoke, return to stock)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: keyId } = await params;
    const body = await request.json();
    const { action, reason } = body;

    let result;
    
    switch (action) {
      case "revoke":
        result = await revokeLicenseKey(keyId, reason);
        break;
      case "return_to_stock":
        result = await returnLicenseKeyToStock(keyId);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      licenseKey: result,
      message: `License key ${action.replace('_', ' ')} successfully`
    });
  } catch (error) {
    console.error(`Error performing license key action:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform action" },
      { status: 500 }
    );
  }
}

