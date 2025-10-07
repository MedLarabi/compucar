import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

// GET - Get single product for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("Admin product detail API called");
    const session = await auth();
    console.log("Session:", session?.user ? { id: session.user.id, role: session.user.role } : 'No session');
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      console.log("Access denied - not admin");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: productId } = await params;
    console.log("Looking for product ID:", productId);
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { url: true, altText: true }
        },
        videos: {
          orderBy: { sortOrder: 'asc' },
        },
        tags: {
          select: { name: true }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    });

    console.log("Product found:", product ? { id: product.id, name: product.name } : 'null');

    if (!product) {
      console.log("Product not found for ID:", productId);
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get license keys count separately if it's a virtual product
    let licenseKeysCount = 0;
    if (product.isVirtual) {
      try {
        licenseKeysCount = await prisma.licenseKey.count({
          where: { productId: productId }
        });
      } catch (error) {
        console.log("Could not count license keys:", error);
        // Continue without license keys count
      }
    }

    console.log("Returning product data with license keys count:", licenseKeysCount);
    return NextResponse.json({
      success: true,
      product: {
        ...product,
        _count: {
          ...product._count,
          licenseKeys: licenseKeysCount
        }
      }
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Product update API called ===");
    const session = await auth();
    console.log("Session:", session?.user ? { id: session.user.id, role: session.user.role, email: session.user.email } : 'No session');
    
    if (!session?.user) {
      console.log("No session found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      console.log("User role not admin:", session.user.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: productId } = await params;
    console.log("Product ID from params:", productId);
    
    const body = await request.json();
    console.log("Request body received:", {
      name: body.name,
      hasImages: body.images ? body.images.length : 0,
      hasVideos: body.videos ? body.videos.length : 0,
    });
    
    // Debug logging for status fields
    console.log("Product update request body:", {
      productId,
      isDraft: body.isDraft,
      isActive: body.isActive,
      status: body.status,
      name: body.name
    });

    // Validate required fields
    if (!body.name || !body.description || !body.categoryId) {
      return NextResponse.json(
        { 
          error: "Missing required fields",
          details: "Name, description, and category are required" 
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      cost,
      sku,
      barcode,
      quantity,
      trackQuantity,
      allowBackorder,
      categoryId,
      brand,
      vendor,
      weight,
      length,
      width,
      height,
      status,
      isActive,
      isFeatured,
      isDraft,
      metaTitle,
      metaDescription,
      tags,
      variants,
      variantOptions,
      images,
      videos,
    } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Determine final status
    const finalStatus = isDraft ? "DRAFT" : (isActive ? "ACTIVE" : "DRAFT");
    console.log("Updating product with status:", finalStatus, "isDraft:", isDraft, "isActive:", isActive);

    // Generate slug from name if name changed
    let slug = existingProduct.slug;
    if (name !== existingProduct.name) {
      const baseSlug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();

      // Ensure slug is unique
      slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existingSlugProduct = await prisma.product.findUnique({
          where: { 
            slug,
            NOT: { id: productId } // Exclude current product
          }
        });
        
        if (!existingSlugProduct) {
          break;
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Update the product
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update the main product data
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          slug,
          description,
          shortDescription,
          price: price !== undefined && price !== null && price !== "" ? parseFloat(price) : 0,
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
          cost: cost ? parseFloat(cost) : null,
          sku,
          barcode,
          quantity: quantity ? parseInt(quantity) : 0,
          trackQuantity: trackQuantity || false,
          allowBackorder: allowBackorder || false,
          categoryId,
          brand,
          vendor,
          weight: weight ? parseFloat(weight) : null,
          length: length ? parseFloat(length) : null,
          width: width ? parseFloat(width) : null,
          height: height ? parseFloat(height) : null,
          status: finalStatus,
          isActive: isActive || false,
          isFeatured: isFeatured || false,
          metaTitle,
          metaDescription,
          publishedAt: (!isDraft && isActive) ? new Date() : null,
          
          // Virtual product fields
          isVirtual: body.isVirtual || false,
          downloadUrl: body.downloadUrl || null,
          downloadLimit: body.downloadLimit ? parseInt(body.downloadLimit) : 3,
          downloadExpiry: body.downloadExpiry ? parseInt(body.downloadExpiry) : 30,
          licenseKey: body.licenseKey || null,
          systemRequirements: body.systemRequirements || null,
          version: body.version || null,
          fileSize: body.fileSize || null,
          
          updatedAt: new Date(),
        },
      });

      // Handle images update
      if (images !== undefined) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId }
        });

        // Create new images
        if (images && images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((image: any, index: number) => ({
              productId,
              url: image.url,
              altText: image.alt || name,
              sortOrder: index,
              isMain: index === 0,
            }))
          });
        }
      }

      // Handle videos update
      if (videos !== undefined) {
        // Delete existing videos
        await tx.productVideo.deleteMany({
          where: { productId }
        });

        // Create new videos
        if (videos && videos.length > 0) {
          await tx.productVideo.createMany({
            data: videos.map((video: any, index: number) => ({
              productId,
              url: video.url,
              title: video.title || `${name} Video ${index + 1}`,
              description: video.description || "",
              thumbnail: video.thumbnail || "",
              duration: video.duration || 0,
              fileSize: video.fileSize || "",
              mimeType: video.mimeType || "video/mp4",
              sortOrder: index,
              isMain: index === 0,
            }))
          });
        }
      }

      // Return the updated product with all relations
      return await tx.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          images: true,
          videos: true,
          tags: true,
          variants: true,
        },
      });
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    console.log("Product updated successfully:", {
      id: updatedProduct.id,
      name: updatedProduct.name,
      status: updatedProduct.status,
      isActive: updatedProduct.isActive,
      publishedAt: updatedProduct.publishedAt
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}