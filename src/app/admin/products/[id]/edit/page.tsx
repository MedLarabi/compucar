"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminGuard, AdminHeaderLayout } from "@/components/admin";
import { EnhancedProductForm } from "@/components/admin/enhanced-product-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchCategories();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const data = await response.json();
      console.log("Fetched product data:", data); // Debug log
      // Extract product from the API response structure
      setProduct(data.product || data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to fetch product");
      router.push("/admin/products");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.data || data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  };

  const handleSubmit = async (data: any, isDraft: boolean = false) => {
    setLoading(true);
    try {
      // Transform data for API
      const transformedData = {
        ...data,
        price: data.price || 0,
        compareAtPrice: data.compareAtPrice || null,
        cost: data.cost || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        isDraft,
        images: data.images?.map((img: any, index: number) => ({
          url: img.url,
          alt: img.alt || data.name,
          sortOrder: index,
          isMain: img.isMain || index === 0,
        })) || [],
        videos: data.videos?.map((vid: any, index: number) => ({
          url: vid.url,
          title: vid.title || `${data.name} Video ${index + 1}`,
          description: vid.description || "",
          thumbnail: vid.thumbnail || "",
          duration: vid.duration || 0,
          fileSize: vid.fileSize || "",
          mimeType: vid.mimeType || "video/mp4",
          sortOrder: index,
          isMain: vid.isMain || index === 0,
        })) || [],
        tags: data.tags || [],
        variants: data.variants || [],
      };

      console.log("=== CLIENT: Submitting product update ===");
      console.log("Product ID:", params.id);
      console.log("Transformed data:", {
        name: transformedData.name,
        description: transformedData.description?.substring(0, 50) + "...",
        categoryId: transformedData.categoryId,
        price: transformedData.price,
        isDraft: transformedData.isDraft,
        hasImages: transformedData.images?.length || 0,
        hasVideos: transformedData.videos?.length || 0,
        allKeys: Object.keys(transformedData)
      });

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });

      console.log("=== CLIENT: Response received ===");
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.log("=== CLIENT: Error response ===");
        console.log("Error data:", error);
        throw new Error(error.error || error.message || `Failed to update product (${response.status})`);
      }

      const result = await response.json();
      console.log("=== CLIENT: Success response ===");
      console.log("Result:", result);
      
      if (isDraft) {
        toast.success("Product saved as draft successfully!");
      } else {
        toast.success("Product updated successfully!");
      }
      
      // Redirect to products list or product detail page
      router.push("/admin/products");
    } catch (error: any) {
      console.error("=== CLIENT: Error updating product ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast.error(error.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AdminGuard>
        <AdminHeaderLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading product...</p>
            </div>
          </div>
        </AdminHeaderLayout>
      </AdminGuard>
    );
  }

  if (!product) {
    return (
      <AdminGuard>
        <AdminHeaderLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Product not found</h2>
              <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
              <Button onClick={() => router.push("/admin/products")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </div>
          </div>
        </AdminHeaderLayout>
      </AdminGuard>
    );
  }

  // Transform product data for the form
  const defaultValues = {
    ...product,
    images: product.images?.map((img: any, index: number) => ({
      id: img.id || `image-${index}`,
      url: img.url,
      alt: img.altText || img.alt || "",
      isMain: img.isMain || index === 0,
    })) || [],
    tags: product.tags?.map((tag: any) => tag.name || tag) || [],
    variants: product.variants || [],
    variantOptions: product.variantOptions || [],
    price: product.price || 0,
    compareAtPrice: product.compareAtPrice || undefined,
    cost: product.cost || undefined,
    weight: product.weight || undefined,
    isActive: product.isActive || false,
    isFeatured: product.isFeatured || false,
    isVirtual: product.isVirtual || false,
    downloadUrl: product.downloadUrl || "",
    licenseKey: product.licenseKey || "",
    systemRequirements: product.systemRequirements || "",
    version: product.version || "",
    fileSize: product.fileSize || "",
  };

  console.log("Product data for form:", product);
  console.log("Default values for form:", defaultValues);

  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Edit Product</h1>
                  <p className="text-muted-foreground">
                    Update product information and settings
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Editing: {product.name}
              </span>
            </div>
          </div>

          {/* Product Form */}
          <EnhancedProductForm
            onSubmit={handleSubmit}
            categories={categories}
            loading={loading}
            defaultValues={defaultValues}
          />
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}
