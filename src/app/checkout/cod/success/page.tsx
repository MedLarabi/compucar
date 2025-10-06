"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  Phone,
  User,
  Copy,
  ExternalLink,
  Home,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  codStatus: string;
  totalCents: number;
  currency: string;
  customerFirst: string;
  customerLast: string;
  customerPhone: string;
  customerNotes?: string;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  yalidine?: {
    tracking?: string;
    label_url?: string;
    status?: string;
    to_wilaya_name: string;
    to_commune_name: string;
    address: string;
    is_stopdesk: boolean;
    stopdesk_id?: number;
    price: number;
    product_list: string;
  };
}

export default function CODSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { t } = useLanguage();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yalidinePayload, setYalidinePayload] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      router.push('/products');
      return;
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order');
        }
        
        setOrder(data.order);
        setYalidinePayload(data.yalidinePayload);
        
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/products')}>
              <Home className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Button onClick={() => router.push('/products')}>
            <Home className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'dispatched': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Order Placed';
      case 'submitted': return 'Sent to Courier';
      case 'dispatched': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'failed': return 'Delivery Failed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <MainLayout>
      <div className="container py-2 sm:py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Order Placed Successfully! 🎉</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your order. Your items will be delivered with Cash on Delivery.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Order Number</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {order.orderNumber}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(order.orderNumber)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(order.codStatus)}>
                          {getStatusText(order.codStatus)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                      <p className="text-lg font-bold mt-1">
                        {formatPrice(order.totalCents / 100)} {order.currency}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                      <p className="mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {order.yalidine?.tracking && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {order.yalidine.tracking}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(order.yalidine!.tracking!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer & Delivery Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Customer & Delivery Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                      <p className="mt-1">{order.customerFirst} {order.customerLast}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <p className="mt-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.customerPhone}
                      </p>
                    </div>
                  </div>

                  {order.yalidine && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Delivery Address</label>
                        <div className="mt-1 flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p>{order.yalidine.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.yalidine.to_commune_name}, {order.yalidine.to_wilaya_name}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Delivery Method</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {order.yalidine.is_stopdesk ? 'StopDesk Pickup' : 'Home Delivery'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {order.customerNotes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Special Instructions</label>
                      <p className="mt-1 text-sm bg-muted p-3 rounded">
                        {order.customerNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items Ordered */}
              <Card>
                <CardHeader>
                  <CardTitle>Items Ordered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice((item.unitPriceCents * item.quantity) / 100)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.unitPriceCents / 100)} each
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Important Notice */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cash on Delivery</strong><br />
                  Prepare exactly <strong>{formatPrice(order.totalCents / 100)} {order.currency}</strong> to pay the delivery person when your order arrives.
                </AlertDescription>
              </Alert>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link href="/products">
                      <Home className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/orders">
                      <Package className="h-4 w-4 mr-2" />
                      View All Orders
                    </Link>
                  </Button>

                  {order.yalidine?.tracking && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/tracking/${order.yalidine.tracking}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Track Package
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Yalidine Payload (for development) */}
              {yalidinePayload && process.env.NODE_ENV === 'development' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Yalidine Payload (Dev)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                      {JSON.stringify(yalidinePayload, null, 2)}
                    </pre>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => copyToClipboard(JSON.stringify(yalidinePayload, null, 2))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy JSON
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* What's Next */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">What happens next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Order confirmed and being prepared</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Package handed to Yalidine courier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>Out for delivery to your address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Payment on delivery</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
