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
        variants: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' }
            }
          }
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
      description: body.description ? body.description.substring(0, 50) + "..." : "undefined",
      categoryId: body.categoryId,
      hasImages: body.images ? body.images.length : 0,
      hasVideos: body.videos ? body.videos.length : 0,
      allKeys: Object.keys(body)
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
    console.log("Validating required fields:", {
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      nameValid: !!body.name,
      descriptionValid: !!body.description,
      categoryIdValid: !!body.categoryId
    });
    
    if (!body.name || !body.description || !body.categoryId) {
      console.log("Validation failed - missing required fields");
      return NextResponse.json(
        { 
          error: "Missing required fields",
          message: "Missing required fields",
          details: "Name, description, and category are required",
          missing: {
            name: !body.name,
            description: !body.description,
            categoryId: !body.categoryId
          }
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
      // Handle additional fields that might come from the form
      dimensions,
      lowStockThreshold,
      isDigital,
      requiresShipping,
    } = body;

    // Generate SKU if not provided
    let finalSku = sku;
    if (!sku || sku.trim() === '') {
      // Generate SKU from name
      const baseSlug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      
      finalSku = `SKU-${baseSlug}-${Date.now()}`;
      console.log("Generated SKU:", finalSku);
    }

    // Ensure SKU is unique (excluding current product)
    let uniqueSku = finalSku;
    let skuCounter = 1;
    
    while (true) {
      const existingSkuProduct = await prisma.product.findUnique({
        where: { 
          sku: uniqueSku,
          NOT: { id: productId } // Exclude current product
        }
      });
      
      if (!existingSkuProduct) {
        break;
      }
      
      uniqueSku = `${finalSku}-${skuCounter}`;
      skuCounter++;
    }
    
    console.log("Final unique SKU:", uniqueSku);

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
    console.log("Starting product update transaction...");
    
    // Validate numeric fields before database update
    const parsedPrice = price !== undefined && price !== null && price !== "" ? parseFloat(price) : 0;
    const parsedCompareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null;
    const parsedCost = cost ? parseFloat(cost) : null;
    const parsedQuantity = quantity ? parseInt(quantity) : 0;
    const parsedWeight = weight ? parseFloat(weight) : null;
    const parsedLength = length ? parseFloat(length) : null;
    const parsedWidth = width ? parseFloat(width) : null;
    const parsedHeight = height ? parseFloat(height) : null;

    console.log("Parsed numeric values:", {
      parsedPrice,
      parsedCompareAtPrice,
      parsedCost,
      parsedQuantity,
      parsedWeight,
      parsedLength,
      parsedWidth,
      parsedHeight
    });
    
    const updatedProduct = await prisma.$transaction(async (tx) => {
      console.log("Updating product with data:", {
        name,
        categoryId,
        sku: uniqueSku,
        price: parsedPrice,
        finalStatus,
        isActive: isActive || false
      });
      
      // Update the main product data
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          slug,
          description,
          shortDescription,
          price: parsedPrice,
          compareAtPrice: parsedCompareAtPrice,
          cost: parsedCost,
          sku: uniqueSku,
          barcode,
          quantity: parsedQuantity,
          trackQuantity: trackQuantity || false,
          allowBackorder: allowBackorder || false,
          categoryId,
          brand,
          vendor,
          weight: parsedWeight,
          length: parsedLength,
          width: parsedWidth,
          height: parsedHeight,
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

      console.log("Product updated successfully, handling images...");
      // Handle images update
      if (images !== undefined) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId }
        });

        // Create new images
        if (images && images.length > 0) {
          console.log("Creating", images.length, "new images");
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

      console.log("Handling videos...");
      // Handle videos update
      if (videos !== undefined) {
        // Delete existing videos
        await tx.productVideo.deleteMany({
          where: { productId }
        });

        // Create new videos
        if (videos && videos.length > 0) {
          console.log("Creating", videos.length, "new videos");
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

      console.log("Handling variants...");
      // Handle variants update
      if (variants !== undefined) {
        // Delete existing variants and their images (cascade will handle images)
        await tx.productVariant.deleteMany({
          where: { productId }
        });

        // Create new variants with their images
        if (variants && variants.length > 0) {
          console.log("Creating", variants.length, "new variants");
          for (const variant of variants) {
            const createdVariant = await tx.productVariant.create({
              data: {
                productId,
                name: variant.name,
                sku: variant.sku || `${uniqueSku}-${variant.name.replace(/\s+/g, '-').toUpperCase()}`,
                price: variant.price || parsedPrice,
                compareAtPrice: variant.compareAtPrice || null,
                quantity: variant.quantity || 0,
                options: variant.options || {},
                isActive: variant.isActive !== undefined ? variant.isActive : true,
              }
            });

            // Create variant images if provided
            if (variant.images && variant.images.length > 0) {
              console.log("Creating", variant.images.length, "images for variant", variant.name);
              await tx.productVariantImage.createMany({
                data: variant.images.map((image: any, index: number) => ({
                  variantId: createdVariant.id,
                  url: image.url,
                  altText: image.alt || variant.name,
                  sortOrder: index,
                  isMain: image.isMain || index === 0,
                }))
              });
            }
          }
        }
      }

      // Return just the product ID - we'll fetch the full product outside the transaction
      return product;
    }, {
      timeout: 15000, // Increase timeout to 15 seconds
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    console.log("Transaction completed, fetching updated product with relations...");
    // Fetch the updated product with all relations outside the transaction
    const productWithRelations = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: true,
        videos: true,
        tags: true,
        variants: {
          include: {
            images: true,
          },
        },
      },
    });

    console.log("Product updated successfully:", {
      id: productWithRelations?.id,
      name: productWithRelations?.name,
      status: productWithRelations?.status,
      isActive: productWithRelations?.isActive,
      publishedAt: productWithRelations?.publishedAt
    });

    return NextResponse.json(productWithRelations, { status: 200 });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update product",
        message: "Failed to update product",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Product delete API called ===");
    const session = await auth();
    console.log("Session:", session?.user ? { id: session.user.id, role: session.user.role } : 'No session');
    
    if (!session?.user) {
      console.log("No session found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      console.log("User role not admin:", session.user.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: productId } = await params;
    console.log("Product ID to delete:", productId);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          }
        }
      }
    });

    if (!existingProduct) {
      console.log("Product not found for ID:", productId);
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if product has any orders - prevent deletion if it does
    if (existingProduct._count.orderItems > 0) {
      console.log("Product has orders, cannot delete");
      return NextResponse.json(
        { 
          error: "Cannot delete product with existing orders",
          details: `This product has ${existingProduct._count.orderItems} order(s) associated with it.`
        },
        { status: 400 }
      );
    }

    // Delete product and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete product images
      await tx.productImage.deleteMany({
        where: { productId }
      });

      // Delete product videos
      await tx.productVideo.deleteMany({
        where: { productId }
      });

      // Delete product tags (many-to-many relationship)
      await tx.product.update({
        where: { id: productId },
        data: {
          tags: {
            set: [] // Remove all tag associations
          }
        }
      });

      // Delete product variants and their images
      await tx.productVariant.deleteMany({
        where: { productId }
      });

      // Delete license keys if it's a virtual product
      if (existingProduct.isVirtual) {
        await tx.licenseKey.deleteMany({
          where: { productId }
        });
      }

      // Delete reviews (using correct model name)
      await tx.productReview.deleteMany({
        where: { productId }
      });

      // Finally, delete the product itself
      await tx.product.delete({
        where: { id: productId }
      });
    });

    console.log("Product deleted successfully:", productId);
    return NextResponse.json({ 
      message: "Product deleted successfully",
      deletedProductId: productId 
    });

  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}