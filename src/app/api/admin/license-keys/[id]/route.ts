import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { 
  updateLicenseKey, 
  deleteLicenseKey, 
  revokeLicenseKey,
  returnLicenseKeyToStock
} from "@/lib/services/license-key-service";

// PUT - Update a license key
export async function PUT(
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
    const { keyValue, notes } = body;

    const updatedKey = await updateLicenseKey(keyId, { keyValue, notes });

    return NextResponse.json({
      success: true,
      licenseKey: updatedKey
    });
  } catch (error) {
    console.error("Error updating license key:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update license key" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a license key
export async function DELETE(
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
    await deleteLicenseKey(keyId);

    return NextResponse.json({
      success: true,
      message: "License key deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting license key:", error);
    return NextResponse.json(
      { error: "Failed to delete license key" },
      { status: 500 }
    );
  }
}

