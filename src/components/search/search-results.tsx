"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Star, ShoppingCart, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  compareAtPrice?: string | number;
  shortDescription?: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  quantity: number;
  status: string;
  isActive: boolean;
  avgRating: number;
  reviewCount: number;
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const apiUrl = `${baseUrl}/api/products?search=${encodeURIComponent(query)}&page=${page}&limit=12`;
        console.log('Search results API URL:', apiUrl);
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.success && data.data) {
          if (page === 1) {
            setProducts(data.data);
          } else {
            setProducts(prev => [...prev, ...data.data]);
          }
          setTotal(data.pagination?.total || 0);
          setHasMore((data.pagination?.page || 1) < (data.pagination?.pages || 1));
        } else {
          setProducts([]);
          setTotal(0);
          setHasMore(false);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to load search results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, page]);

  // Reset page when query changes
  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [query]);

  // Handle add to cart
  const handleAddToCart = async (product: SearchProduct) => {
    try {
      // In a real app, you'd call your cart API here
      toast.success(`${product.name} added to cart!`, {
        description: `Price: ${Number(product.price).toFixed(2)} DA`,
      });
    } catch (error) {
      toast.error("Failed to add item to cart");
    }
  };

  // Load more results
  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Search for Products</h2>
        <p className="text-muted-foreground">
          Enter a search term to find products in our catalog
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">
          <Package className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Search Error</h2>
          <p>{error}</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Search Results for "{query}"
        </h1>
        {!isLoading && (
          <p className="text-muted-foreground">
            {total === 0 ? t('messages.noProductsFound') : t('messages.productsFound', { count: total, plural: total === 1 ? '' : 's' })}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && page === 1 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse"></div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-6 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* No Results */
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('messages.noProductsFound')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('messages.couldNotFind', { query })}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Try:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Checking your spelling</li>
              <li>Using more general keywords</li>
              <li>Browsing our categories instead</li>
            </ul>
          </div>
          <Link href="/products">
            <Button className="mt-6">
              Browse All Products
            </Button>
          </Link>
        </div>
      ) : (
        /* Search Results */
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="relative">
                    {product.images && product.images.length > 0 ? (
                      <div className="aspect-square bg-muted overflow-hidden">
                        <Image 
                          src={product.images[0].url} 
                          alt={product.images[0].altText || product.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.tags && product.tags.length > 0 && (
                        <Badge className="capitalize text-xs">
                          {product.tags[0].name}
                        </Badge>
                      )}
                      {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                        <Badge variant="destructive" className="text-xs">
                          Sale
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
                
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-semibold leading-none tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {product.category && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {product.category.name}
                      </p>
                    )}
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.avgRating || 0)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">
                        {Number(product.price).toFixed(2)} DA
                      </span>
                      {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                        <span className="text-lg text-muted-foreground line-through">
                          {Number(product.compareAtPrice).toFixed(2)} DA
                        </span>
                      )}
                    </div>
                    
                    {/* Stock Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                      </span>
                      <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {product.status.toLowerCase()}
                      </Badge>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.quantity === 0}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {product.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-6">
              <Button
                onClick={loadMore}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Products"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

