import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getLicenseKeysForUser } from "@/lib/services/license-key-service";

// GET - Get user's license keys
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const licenseKeys = await getLicenseKeysForUser(session.user.id);

    return NextResponse.json({
      success: true,
      licenseKeys
    });
  } catch (error) {
    console.error("Error fetching user license keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch license keys" },
      { status: 500 }
    );
  }
}

