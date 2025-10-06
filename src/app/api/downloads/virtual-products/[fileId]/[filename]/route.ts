import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { validateDownloadAccess } from "@/lib/services/download-service";

// GET - Direct download endpoint for virtual products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string; filename: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { fileId, filename } = await params;

    // Find the download record by matching the downloadUrl pattern
    const downloadUrlPattern = `/api/downloads/virtual-products/${fileId}/${encodeURIComponent(filename)}`;
    
    const download = await prisma.download.findFirst({
      where: {
        userId: session.user.id,
        downloadUrl: downloadUrlPattern,
      },
      include: {
        product: {
          select: {
            name: true,
            downloadUrl: true,
          },
        },
      },
    });

    if (!download) {
      return NextResponse.json(
        { error: "Download not found or access denied" },
        { status: 404 }
      );
    }

    // Basic validation - just check if download exists and is active
    if (!download.isActive) {
      return NextResponse.json(
        { error: "Download is no longer active" },
        { status: 403 }
      );
    }

    // Update download count
    await prisma.download.update({
      where: { id: download.id },
      data: {
        downloadCount: download.downloadCount + 1,
        lastDownloadAt: new Date(),
      },
    });

    // For development/demo purposes, we'll simulate a file download
    // In production, you would:
    // 1. Serve the actual file from cloud storage (AWS S3, Google Cloud Storage, etc.)
    // 2. Generate a signed URL for secure access
    // 3. Stream the file content

    // For now, return a mock file response
    const mockFileContent = `# ${download.product.name}

Thank you for your purchase!

This is a demo file for: ${download.product.name}
Original filename: ${decodeURIComponent(filename)}

## Installation Instructions
1. Extract the downloaded archive
2. Follow the setup guide included in the package
3. Use your license key for activation

## Support
If you need help, please contact our support team.

License Key: ${download.licenseKey || 'Not required for this product'}
Download Date: ${new Date().toISOString()}
File ID: ${fileId}
`;

    // Create a response with the mock file content
    const response = new Response(mockFileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${decodeURIComponent(filename)}"`,
        'Content-Length': mockFileContent.length.toString(),
      },
    });

    return response;

  } catch (error) {
    console.error("Error processing download:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
