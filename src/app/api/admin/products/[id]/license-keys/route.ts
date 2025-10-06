import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { 
  getLicenseKeysForProduct, 
  createLicenseKey, 
  createBulkLicenseKeys,
  parseLicenseKeysFromCSV
} from "@/lib/services/license-key-service";

// GET - Get all license keys for a product
export async function GET(
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

    const { id: productId } = await params;
    const licenseKeys = await getLicenseKeysForProduct(productId);

    return NextResponse.json({
      success: true,
      licenseKeys
    });
  } catch (error) {
    console.error("Error fetching license keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch license keys" },
      { status: 500 }
    );
  }
}

// POST - Create new license key(s) for a product
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

    const { id: productId } = await params;
    const body = await request.json();
    const { licenseKey, licenseKeys, csvContent, notes } = body;

    if (csvContent) {
      // Handle CSV import
      const keys = parseLicenseKeysFromCSV(csvContent);
      if (keys.length === 0) {
        return NextResponse.json(
          { error: "No valid license keys found in CSV" },
          { status: 400 }
        );
      }
      
      const result = await createBulkLicenseKeys(productId, keys, notes);
      return NextResponse.json({
        success: true,
        created: result.created.length,
        errors: result.errors,
        licenseKeys: result.created
      });
    } else if (licenseKeys && Array.isArray(licenseKeys)) {
      // Handle bulk creation
      const result = await createBulkLicenseKeys(productId, licenseKeys, notes);
      return NextResponse.json({
        success: true,
        created: result.created.length,
        errors: result.errors,
        licenseKeys: result.created
      });
    } else if (licenseKey) {
      // Handle single key creation
      console.log("Creating single license key:", { productId, licenseKey, notes });
      
      // Test direct Prisma access first
      try {
        console.log("Testing direct Prisma access...");
        const testCount = await prisma.licenseKey.count();
        console.log("Direct Prisma test successful, current count:", testCount);
      } catch (directError) {
        console.error("Direct Prisma test failed:", directError);
        return NextResponse.json(
          { error: "Database connection issue: " + (directError instanceof Error ? directError.message : 'Unknown error') },
          { status: 500 }
        );
      }
      
      const newKey = await createLicenseKey(productId, licenseKey, notes);
      console.log("License key created successfully:", newKey.id);
      return NextResponse.json({
        success: true,
        licenseKey: newKey
      });
    } else {
      return NextResponse.json(
        { error: "Missing license key data" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating license key:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create license key" },
      { status: 500 }
    );
  }
}
