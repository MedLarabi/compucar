import { prisma } from "@/lib/database/prisma";

interface CreateDownloadParams {
  userId: string;
  productId: string;
  orderId: string;
  orderItemId: string;
}

/**
 * Creates a download record for a virtual product purchase
 */
export async function createVirtualProductDownload({
  userId,
  productId,
  orderId,
  orderItemId,
}: CreateDownloadParams) {
  try {
    // Get the product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        isVirtual: true,
        downloadUrl: true,
        downloadLimit: true,
        downloadExpiry: true,
        licenseKey: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.isVirtual) {
      // Not a virtual product, skip download creation
      return null;
    }

    if (!product.downloadUrl) {
      throw new Error("Virtual product missing download URL");
    }

    // No expiry date for unlimited downloads
    const expiresAt = null;

    // Generate a unique license key if template is provided
    let generatedLicenseKey: string | null = null;
    if (product.licenseKey) {
      generatedLicenseKey = generateLicenseKey(product.licenseKey, product.name);
    }

    // Create the download record
    const download = await prisma.download.create({
      data: {
        userId,
        productId,
        orderId,
        orderItemId,
        downloadUrl: product.downloadUrl,
        licenseKey: generatedLicenseKey,
        downloadLimit: 999999, // Unlimited downloads
        expiresAt,
        isActive: true,
      },
      include: {
        product: {
          select: {
            name: true,
            version: true,
            fileSize: true,
          },
        },
      },
    });

    return download;
  } catch (error) {
    console.error("Error creating virtual product download:", error);
    throw error;
  }
}

/**
 * Generates a license key based on a template
 */
function generateLicenseKey(template: string, productName: string): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  
  // Extract product initials
  const productInitials = productName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 4)
    .padEnd(4, 'X');

  // Generate random alphanumeric strings for X placeholders
  const randomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Replace template placeholders
  let licenseKey = template
    .replace(/YYYY/g, year)
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/PROD/g, productInitials)
    .replace(/XXXX/g, randomString(4))
    .replace(/XXX/g, randomString(3))
    .replace(/XX/g, randomString(2))
    .replace(/TIMESTAMP/g, timestamp);

  return licenseKey;
}

/**
 * Creates downloads for all virtual products in an order
 */
export async function createDownloadsForOrder(orderId: string) {
  try {
    // Get the order with items and products
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                isVirtual: true,
                downloadUrl: true,
                downloadLimit: true,
                downloadExpiry: true,
                licenseKey: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const downloads = [];

    // Create downloads for each virtual product in the order
    for (const item of order.items) {
      if (item.product.isVirtual) {
        try {
          const download = await createVirtualProductDownload({
            userId: order.user.id,
            productId: item.product.id,
            orderId: order.id,
            orderItemId: item.id,
          });

          if (download) {
            downloads.push(download);
          }
        } catch (error) {
          console.error(`Error creating download for product ${item.product.id}:`, error);
          // Continue with other products even if one fails
        }
      }
    }

    return downloads;
  } catch (error) {
    console.error("Error creating downloads for order:", error);
    throw error;
  }
}

/**
 * Validates download access for a user
 */
export async function validateDownloadAccess(downloadId: string, userId: string) {
  try {
    const download = await prisma.download.findFirst({
      where: {
        id: downloadId,
        userId,
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!download) {
      return { valid: false, error: "Download not found" };
    }

    if (!download.isActive) {
      return { valid: false, error: "Download is no longer active" };
    }

    // No expiry or download limit checks for unlimited downloads
    // Downloads are always available as long as they're active

    return { valid: true, download };
  } catch (error) {
    console.error("Error validating download access:", error);
    return { valid: false, error: "Internal server error" };
  }
}
