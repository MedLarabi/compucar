import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

// GET - Get user downloads
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const downloads = await prisma.download.findMany({
      where: { 
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            version: true,
            fileSize: true,
            systemRequirements: true,
            isVirtual: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data for frontend
    const transformedDownloads = downloads.map(download => ({
      id: download.id,
      productId: download.productId,
      productSlug: download.product.slug,
      productName: download.product.name,
      productVersion: download.product.version,
      downloadUrl: download.downloadUrl,
      licenseKey: download.licenseKey,
      downloadCount: download.downloadCount,
      downloadLimit: download.downloadLimit,
      expiresAt: download.expiresAt?.toISOString(),
      isActive: download.isActive && (!download.expiresAt || download.expiresAt > new Date()),
      createdAt: download.createdAt.toISOString(),
      lastDownloadAt: download.lastDownloadAt?.toISOString(),
      orderNumber: download.order.orderNumber,
      fileSize: download.product.fileSize,
      systemRequirements: download.product.systemRequirements,
    }));

    return NextResponse.json(transformedDownloads);
  } catch (error) {
    console.error("Error fetching user downloads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
