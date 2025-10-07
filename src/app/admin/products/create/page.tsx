"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminGuard, AdminHeaderLayout } from "@/components/admin";
import { EnhancedProductForm } from "@/components/admin/enhanced-product-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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
        price: data.price || 0, // Default to 0 if price is empty/undefined
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

      console.log("Submitting product data:", {
        name: transformedData.name,
        imagesCount: transformedData.images.length,
        videosCount: transformedData.videos.length,
        videos: transformedData.videos,
      });

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to create product");
      }

      const result = await response.json();
      
      if (isDraft) {
        toast.success("Product saved as draft successfully!");
      } else {
        toast.success("Product created successfully!");
      }
      
      // Redirect to products list or edit page
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

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
                  <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
                  <p className="text-muted-foreground">
                    Add a new product to your catalog with detailed information and media.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Form */}
          <div className="bg-card rounded-lg border">
            <EnhancedProductForm
              onSubmit={handleSubmit}
              categories={categories}
              loading={loading}
              defaultValues={undefined}
            />
          </div>
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}
