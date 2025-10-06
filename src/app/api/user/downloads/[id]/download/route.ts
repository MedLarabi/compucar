import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

// POST - Track download and provide secure download URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: downloadId } = await params;

    // Find and validate download
    const download = await prisma.download.findFirst({
      where: {
        id: downloadId,
        userId: session.user.id,
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
        { error: "Download not found" },
        { status: 404 }
      );
    }

    // Check if download is still active
    if (!download.isActive) {
      return NextResponse.json(
        { error: "Download is no longer active" },
        { status: 403 }
      );
    }

    // No expiry or limit checks - unlimited downloads

    // Update download count and last download time
    const updatedDownload = await prisma.download.update({
      where: { id: downloadId },
      data: {
        downloadCount: download.downloadCount + 1,
        lastDownloadAt: new Date(),
      },
    });

    // In a real application, you would:
    // 1. Generate a secure, time-limited download URL
    // 2. Log the download for analytics
    // 3. Send the file or redirect to a secure storage URL

    // For now, return the download URL from the product
    const secureDownloadUrl = download.product.downloadUrl || download.downloadUrl;

    return NextResponse.json({
      downloadUrl: secureDownloadUrl,
      filename: `${download.product.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`,
      downloadCount: updatedDownload.downloadCount,
      downloadLimit: updatedDownload.downloadLimit,
    });

  } catch (error) {
    console.error("Error processing download:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
