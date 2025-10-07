import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { uploadProductMediaToR2 } from "@/lib/storage/r2-products";

export async function POST(request: NextRequest) {
  console.log("Upload API called");
  
  try {
    const session = await auth();
    console.log("Session check:", session?.user ? "authenticated" : "not authenticated");
    
    if (!session?.user) {
      console.log("No session, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      console.log("User not admin, returning 403");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'image' or 'video'

    console.log("Upload request:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      uploadType: type,
    });

    if (!file) {
      console.log("No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !['image', 'video'].includes(type)) {
      console.log("Invalid type:", type);
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      console.log("Invalid image file type:", file.type);
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      console.log("Invalid video file type:", file.type);
      return NextResponse.json({ error: "Invalid video file" }, { status: 400 });
    }

    // Validate file size
    const maxSize = type === 'image' ? 4 * 1024 * 1024 : 32 * 1024 * 1024; // 4MB for images, 32MB for videos
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      console.log(`File too large: ${file.size} bytes, max: ${maxSize} bytes`);
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSizeMB}MB` 
      }, { status: 400 });
    }

    console.log("Uploading to R2...");

    // Upload to R2
    const uploadResult = await uploadProductMediaToR2({
      file,
      type: type as 'image' | 'video',
      userId: session.user.id,
    });

    console.log("R2 upload successful:", uploadResult);

    // Get file metadata with R2 info
    let metadata: any = {
      name: uploadResult.name,
      size: uploadResult.size,
      type: uploadResult.type,
      url: uploadResult.url,
      r2Key: uploadResult.r2Key,
    };

    // For videos, we'll add duration extraction later if needed
    if (type === 'video') {
      metadata.duration = 0; // Placeholder - would need ffmpeg or similar for actual duration
    }

    console.log("Returning response:", metadata);

    return NextResponse.json({
      success: true,
      file: metadata,
    });

  } catch (error) {
    console.error("File upload error:", error);
    
    // Ensure we always return JSON
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    console.error("Detailed error:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}