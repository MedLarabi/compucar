import { MainLayout } from "@/components/layout/main-layout-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  Headphones,
  Package,
  Zap,
  Award
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const featuredProducts = [
    {
      id: 1,
      name: "Premium Brake Pads",
      price: 89.99,
      originalPrice: 119.99,
      rating: 4.8,
      reviews: 124,
      image: "/api/placeholder/300/300",
      badge: "Best Seller",
    },
    {
      id: 2,
      name: "LED Headlight Kit",
      price: 159.99,
      rating: 4.9,
      reviews: 89,
      image: "/api/placeholder/300/300",
      badge: "New",
    },
    {
      id: 3,
      name: "Air Filter Set",
      price: 34.99,
      rating: 4.7,
      reviews: 203,
      image: "/api/placeholder/300/300",
      badge: "Popular",
    },
  ];

  const categories = [
    { name: "Engine Parts", icon: Zap, count: "250+ items" },
    { name: "Brake System", icon: Shield, count: "180+ items" },
    { name: "Lighting", icon: Package, count: "320+ items" },
    { name: "Accessories", icon: Award, count: "450+ items" },
  ];

  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
              description: "Free shipping on orders over 50 DA",
    },
    {
      icon: Shield,
      title: "Quality Guarantee",
      description: "30-day money-back guarantee",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Expert customer support",
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Premium Auto Diagnostic Tools
              <span className="block text-primary">For Every Vehicle</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
              Discover high-quality auto diagnostic tools and equipment. 
              From OBD scanners to professional diagnostic systems, we have everything to help you diagnose vehicle problems accurately.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="h-12 px-8">
                Shop Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8">
                Browse Categories
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Shop by Category
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg">
              Find the right parts for your vehicle from our extensive catalog
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-4 md:grid-cols-2">
            {categories.map((category, index) => (
              <Card key={index} className="group cursor-pointer transition-all hover:shadow-lg">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                    <category.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Featured Products
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg">
              Top-rated products chosen by our customers
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-6 py-12 lg:grid-cols-3 md:grid-cols-2">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden">
                <div className="relative">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <Badge className="absolute top-2 left-2">{product.badge}</Badge>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold leading-none tracking-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.reviews})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{product.price} DA</span>
                      {product.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          {product.originalPrice} DA
                        </span>
                      )}
                    </div>
                    <Button className="w-full" variant="outline">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="lg">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Upgrade Your Vehicle?
            </h2>
            <p className="mx-auto max-w-[600px] text-primary-foreground/80 text-lg">
              Join thousands of satisfied customers who trust CompuCar for their automotive needs.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" variant="secondary" className="h-12 px-8">
                Start Shopping
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}