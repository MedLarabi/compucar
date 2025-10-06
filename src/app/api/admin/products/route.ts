import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Admin products API called");
    const session = await auth();
    console.log("Session:", session?.user ? { id: session.user.id, role: session.user.role, email: session.user.email } : 'No session');
    
    if (!session?.user) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      console.log("User role not admin:", session.user.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true,
        videos: true,
        tags: true,
        variants: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    // Debug logging for status fields and images
    console.log("Product creation request body:", {
      isDraft: body.isDraft,
      isActive: body.isActive,
      status: body.status,
      name: body.name,
      imagesCount: body.images ? body.images.length : 0,
      images: body.images
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

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingProduct = await prisma.product.findUnique({
        where: { slug }
      });
      
      if (!existingProduct) {
        break;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate SKU if not provided
    let finalSku = sku;
    if (!finalSku) {
      const skuBase = name
        .toUpperCase()
        .replace(/[^\w]/g, '')
        .substring(0, 8);
      finalSku = `${skuBase}-${Date.now().toString().slice(-6)}`;
      
      // Ensure SKU is unique
      let skuCounter = 1;
      while (true) {
        const existingSku = await prisma.product.findUnique({
          where: { sku: finalSku }
        });
        
        if (!existingSku) {
          break;
        }
        
        finalSku = `${skuBase}-${Date.now().toString().slice(-6)}-${skuCounter}`;
        skuCounter++;
      }
    }

    // Determine final status
    const finalStatus = isDraft ? "DRAFT" : (isActive ? "ACTIVE" : "DRAFT");
    console.log("Creating product with status:", finalStatus, "isDraft:", isDraft, "isActive:", isActive);

    // Create the product
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        shortDescription,
        price: price !== undefined && price !== null && price !== "" ? parseFloat(price) : 0,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        cost: cost ? parseFloat(cost) : null,
        sku: finalSku,
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
        
        // Create tags if provided
        ...(tags && tags.length > 0 && {
          tags: {
            create: tags.map((tag: string) => ({
              name: tag,
            })),
          },
        }),
        
        // Create images if provided
        ...(images && images.length > 0 && {
          images: {
            create: images.map((image: any, index: number) => {
              console.log(`Creating image ${index}:`, {
                url: image.url,
                altText: image.alt || name,
                sortOrder: index,
                isMain: index === 0,
              });
              return {
                url: image.url,
                altText: image.alt || name,
                sortOrder: index,
                isMain: index === 0,
              };
            }),
          },
        }),
        
        // Create videos if provided
        ...(videos && videos.length > 0 && {
          videos: {
            create: videos.map((video: any, index: number) => {
              console.log(`Creating video ${index}:`, {
                url: video.url,
                title: video.title || `${name} Video ${index + 1}`,
                description: video.description || "",
                thumbnail: video.thumbnail || "",
                duration: video.duration || 0,
                fileSize: video.fileSize || "",
                mimeType: video.mimeType || "video/mp4",
                sortOrder: index,
                isMain: index === 0,
              });
              return {
                url: video.url,
                title: video.title || `${name} Video ${index + 1}`,
                description: video.description || "",
                thumbnail: video.thumbnail || "",
                duration: video.duration || 0,
                fileSize: video.fileSize || "",
                mimeType: video.mimeType || "video/mp4",
                sortOrder: index,
                isMain: index === 0,
              };
            }),
          },
        }),
        
        // Create variants if provided
        ...(variants && variants.length > 0 && {
          variants: {
            create: variants.map((variant: any) => ({
              name: variant.name,
              sku: variant.sku || `${sku}-${variant.name.replace(/\s+/g, '-').toUpperCase()}`,
              price: variant.price || price,
              compareAtPrice: variant.compareAtPrice || null,
              quantity: variant.quantity || 0,
              options: variant.options || {},
              isActive: variant.isActive !== undefined ? variant.isActive : true,
            })),
          },
        }),
      },
      include: {
        category: true,
        images: true,
        videos: true,
        tags: true,
        variants: true,
      },
    });

    console.log("Product created successfully:", {
      id: product.id,
      name: product.name,
      status: product.status,
      isActive: product.isActive,
      publishedAt: product.publishedAt
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
