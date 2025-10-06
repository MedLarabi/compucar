import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
    console.log("Upload directory:", uploadDir);
    
    if (!existsSync(uploadDir)) {
      console.log("Creating upload directory");
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || '';
    const filename = `${type}_${timestamp}_${randomString}.${extension}`;
    const filepath = join(uploadDir, filename);

    console.log("Saving file to:", filepath);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log("File saved successfully");

    // Return public URL
    const publicUrl = `/uploads/products/${filename}`;

    // Get file metadata
    let metadata: any = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl,
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
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
