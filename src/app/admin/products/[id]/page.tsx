"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Package, Key, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { LicenseKeyManagement } from "@/components/admin/license-key-management";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string | null;
  sku: string;
  status: string;
  isVirtual: boolean;
  isActive: boolean;
  isFeatured: boolean;
  quantity: number;
  category: {
    name: string;
  };
  images: Array<{
    url: string;
    altText: string;
  }>;
  tags: Array<{
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
  _count: {
    orderItems: number;
    licenseKeys?: number;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log("Fetching product with ID:", params.id);
      const response = await fetch(`/api/admin/products/${params.id}`);
      const data = await response.json();
      
      console.log("API Response:", { status: response.status, data });
      
      if (response.status === 401 || response.status === 403) {
        toast.error("Please login as admin to access this page");
        router.push("/auth/signin");
        return;
      }
      
      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        console.error("Product fetch failed:", data);
        toast.error(data.error || "Failed to fetch product");
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to fetch product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => router.push("/admin/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/products")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </div>

      {/* Product Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Pricing</h3>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{formatCurrency(Number(product.price))}</div>
                {product.compareAtPrice && (
                  <div className="text-sm text-muted-foreground line-through">
                    {formatCurrency(Number(product.compareAtPrice))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="space-y-2">
                <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                  {product.status}
                </Badge>
                {product.isVirtual && (
                  <Badge className="bg-purple-100 text-purple-800">Virtual Product</Badge>
                )}
                {product.isFeatured && (
                  <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Inventory</h3>
              <div className="space-y-1">
                {product.isVirtual ? (
                  <div>
                    <div className="text-sm text-muted-foreground">License Keys</div>
                    <div className="text-xl font-semibold">
                      {product._count.licenseKeys || 0}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-muted-foreground">Stock Quantity</div>
                    <div className="text-xl font-semibold">{product.quantity}</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Sales</h3>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Orders</div>
                <div className="text-xl font-semibold">{product._count.orderItems}</div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Category & Tags</h3>
              <div className="space-y-2">
                <Badge variant="outline">{product.category.name}</Badge>
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue={product.isVirtual ? "license-keys" : "details"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          {product.isVirtual && (
            <TabsTrigger value="license-keys">License Keys</TabsTrigger>
          )}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.images.map((image, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.altText || product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No images uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {product.isVirtual && (
          <TabsContent value="license-keys" className="space-y-6">
            <LicenseKeyManagement 
              productId={product.id} 
              productName={product.name}
            />
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Product Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
