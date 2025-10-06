"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminGuard, AdminHeaderLayout } from "@/components/admin";
import { ProductManagementTable } from "@/components/admin/product-management";
import { EnhancedProductFormDialog } from "@/components/admin/enhanced-product-form-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched products:', data);
        setProducts(data || []);
      } else {
        console.error('Failed to fetch products, status:', response.status);
        setError(`Failed to fetch products: ${response.status}`);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched categories:', data);
        setCategories(data || []);
      } else {
        console.error('Failed to fetch categories, status:', response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Apply filters
  useEffect(() => {
    if (!products || !Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        product?.sku?.toLowerCase()?.includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(product => product?.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => 
        product?.categoryId === categoryFilter || 
        product?.category?.id === categoryFilter
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter, categoryFilter]);





  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProducts(prev => prev.filter(product => product.id !== productId));
          toast.success("Product deleted successfully!");
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to delete product");
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error("Failed to delete product");
      }
    }
  };

  const handleDuplicateProduct = (product: any) => {
    const duplicatedProduct = {
      ...product,
      id: String(products.length + 1),
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-COPY`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setProducts(prev => [...prev, duplicatedProduct]);
    toast.success("Product duplicated successfully!");
  };

  const handleViewDetails = (productId: string) => {
    router.push(`/admin/products/${productId}`);
  };

  const handleBulkExport = () => {
    // Implement bulk export functionality
    toast.success("Exporting products...");
  };

  const handleBulkImport = () => {
    // Implement bulk import functionality
    toast.success("Import feature coming soon!");
  };

  const handleEditProduct = (product: any) => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  const handleCreateProduct = async (data: any, isDraft: boolean = false) => {
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

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create product");
      }

      const result = await response.json();
      
      if (isDraft) {
        toast.success("Product saved as draft successfully!");
      } else {
        toast.success("Product created successfully!");
      }
      
      // Close dialog and refresh products
      setIsCreateOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <AdminGuard>
        <AdminHeaderLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Admin Panel</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => {
                setError(null);
                setLoading(true);
                fetchProducts();
                fetchCategories();
              }}>
                Try Again
              </Button>
            </div>
          </div>
        </AdminHeaderLayout>
      </AdminGuard>
    );
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminHeaderLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </AdminHeaderLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleBulkImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={handleBulkExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => router.push("/admin/products/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active: {products.filter(p => p.status === "ACTIVE").length}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {products.filter(p => p.quantity < 10).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Needs attention
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.quantity === 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires restocking
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.isFeatured).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Promoted products
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Search and filter products to find what you're looking for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCategoryFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <ProductManagementTable
            products={filteredProducts}
            categories={categories}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onDuplicate={handleDuplicateProduct}
            onViewDetails={handleViewDetails}
            loading={loading}
          />

          {/* Create Product Dialog */}
          <EnhancedProductFormDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSubmit={handleCreateProduct}
            categories={categories}
            loading={loading}
            title="Create Product"
            description="Add a new product to your catalog with advanced features."
          />


        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}
