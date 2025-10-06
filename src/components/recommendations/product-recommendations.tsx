"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/products/product-card";
import { 
  TrendingUp, 
  Star, 
  Users, 
  Sparkles,
  RefreshCw 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: Array<{
    url: string;
    altText?: string;
  }>;
  category: {
    name: string;
  };
  reviews: Array<{
    rating: number;
  }>;
  isFeatured: boolean;
}

interface ProductRecommendationsProps {
  type?: 'personalized' | 'product' | 'popular' | 'trending' | 'new-user';
  productId?: string;
  limit?: number;
  title?: string;
  showRefresh?: boolean;
  className?: string;
}

const recommendationTypes = {
  personalized: {
    title: "Recommended for You",
    icon: Sparkles,
    description: "Based on your preferences and purchase history"
  },
  product: {
    title: "Similar Products",
    icon: TrendingUp,
    description: "Products you might also like"
  },
  popular: {
    title: "Popular Products",
    icon: Users,
    description: "Most loved by our customers"
  },
  trending: {
    title: "Trending Now",
    icon: TrendingUp,
    description: "What's hot right now"
  },
  "new-user": {
    title: "Featured Products",
    icon: Star,
    description: "Great products to get you started"
  }
};

export function ProductRecommendations({
  type = 'personalized',
  productId,
  limit = 8,
  title,
  showRefresh = true,
  className = ""
}: ProductRecommendationsProps) {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = recommendationTypes[type];

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      });

      if (productId) {
        params.append('productId', productId);
      }

      const response = await fetch(`/api/recommendations?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.data);

      // Fetch full product details for the recommendations
      if (data.data.length > 0) {
        const productIds = data.data.map((rec: RecommendationResult) => rec.productId);
        const productsResponse = await fetch(`/api/products?ids=${productIds.join(',')}`);
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.data);
        }
      }

    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [type, productId, limit]);

  const handleRefresh = () => {
    fetchRecommendations();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-48" />
            </div>
            {showRefresh && <Skeleton className="h-8 w-8" />}
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">No recommendations available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <config.icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {title || config.title}
            </CardTitle>
          </div>
          {showRefresh && (
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {config.description}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const recommendation = recommendations.find(
              rec => rec.productId === product.id
            );

            return (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                {recommendation && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="secondary" className="text-xs">
                      {recommendation.reason}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
