"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Star,
  AlertTriangle,
  Package,
  Key,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  quantity: number;
  status: string;
  categoryId: string;
  category?: { name: string };
  isActive: boolean;
  isFeatured: boolean;
  isVirtual?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  images?: { url: string; altText?: string | null }[];
}

interface Category {
  id: string;
  name: string;
}

interface ProductManagementTableProps {
  products: Product[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: Product) => void;
  onViewDetails?: (productId: string) => void;
  loading?: boolean;
}

export function ProductManagementTable({
  products,
  categories,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
  loading = false,
}: ProductManagementTableProps) {
  const { t } = useLanguage();
  const [sortField, setSortField] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField as keyof Product] as unknown;
    let bValue = b[sortField as keyof Product] as unknown;

    // Normalize dates (ISO strings or Date) before comparison
    const toTime = (val: unknown): number | null => {
      if (!val) return null;
      if (val instanceof Date) return val.getTime();
      if (typeof val === "string") {
        const t = Date.parse(val);
        return Number.isNaN(t) ? null : t;
      }
      return null;
    };

    const aTime = toTime(aValue);
    const bTime = toTime(bValue);
    if (aTime !== null && bTime !== null) {
      return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    }

    return 0;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Active</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs">Out of stock</span>
        </div>
      );
    } else if (quantity < 10) {
      return (
        <div className="flex items-center space-x-1 text-orange-600">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs">Low stock</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1 text-green-600">
        <Package className="h-3 w-3" />
        <span className="text-xs">In stock</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Loading products...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>
          Manage your product catalog. {products.length} products total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        {t('messages.noProductsFoundAdmin')}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.images[0].altText || product.name}
                              width={40}
                              height={40}
                              className="object-cover rounded-md"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            {onViewDetails ? (
                              <button
                                onClick={() => onViewDetails(product.id)}
                                className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                              >
                                {product.name}
                              </button>
                            ) : (
                              <span>{product.name}</span>
                            )}
                            {product.isFeatured && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            {product.isVirtual && (
                              <Key className="h-3 w-3 text-purple-500" title="Virtual Product" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {product.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category?.name || 'No Category'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(product.price)}
                        </div>
                        {product.compareAtPrice && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.compareAtPrice)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{product.quantity}</div>
                        {getStockStatus(product.quantity)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {(() => {
                          const d = typeof product.updatedAt === 'string' ? new Date(product.updatedAt) : product.updatedAt;
                          return isNaN(d as unknown as number) ? '-' : (d as Date).toLocaleDateString();
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {onViewDetails && (
                            <DropdownMenuItem onClick={() => onViewDetails(product.id)}>
                              <Package className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(product)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View in Store
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(product.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
