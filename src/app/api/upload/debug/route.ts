import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Check R2 environment variables
    const r2Config = {
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? "✅ Set" : "❌ Missing",
      R2_BUCKET: process.env.R2_BUCKET ? "✅ Set" : "❌ Missing", 
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "✅ Set" : "❌ Missing",
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing",
      R2_ENDPOINT: process.env.R2_ENDPOINT ? "✅ Set" : "❌ Missing",
      R2_REGION: process.env.R2_REGION || "auto",
      R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ? "✅ Set" : "❌ Missing",
    };

    return NextResponse.json({
      success: true,
      r2Config,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    console.log("=== DEBUG UPLOAD START ===");
    console.log("File:", file?.name, file?.size, file?.type);
    console.log("Type:", type);
    console.log("R2_PUBLIC_URL:", process.env.R2_PUBLIC_URL);
    console.log("R2_BUCKET:", process.env.R2_BUCKET);
    console.log("=== DEBUG UPLOAD END ===");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Just return a mock response for testing
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: `https://carworkshop.org/products/debug_${Date.now()}_${file.name}`,
        r2Key: `products/debug_${Date.now()}_${file.name}`,
      },
    });

  } catch (error) {
    console.error("Debug upload error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
