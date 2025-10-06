"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowRight,
  Download,
  Key,
  Mail,
  Calendar,
  CreditCard,
  Receipt,
  Star,
  MessageSquare,
  Shield,
  Clock,
  Globe,
  Banknote
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  unitPriceCents?: number;
  product: {
    id: string;
    name: string;
    slug: string;
    isVirtual?: boolean;
  };
}

interface LicenseKey {
  id: string;
  keyValue: string;
  decryptedKey: string;
  product: {
    name: string;
    sku: string;
  };
  assignedAt: string;
}

interface Download {
  id: string;
  productId: string;
  downloadUrl: string;
  downloadCount: number;
  downloadLimit: number;
  expiresAt?: string;
  isActive: boolean;
  product: {
    name: string;
    sku: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  paidAt?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  codStatus?: string;
  
  // Pricing
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  subtotalCents?: number;
  shippingCents?: number;
  totalCents?: number;
  currency: string;
  
  // Customer info
  customerFirst?: string;
  customerLast?: string;
  customerPhone?: string;
  customerNotes?: string;
  
  // Addresses
  shippingAddress?: Address;
  billingAddress?: Address;
  
  // Shipping
  shippingMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relations
  items: OrderItem[];
  payments?: Payment[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
  
  // Yalidine specific
  yalidine?: {
    id: string;
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
    from_wilaya_name?: string;
    from_address?: string;
  };
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const welcomeMode = searchParams.get('welcome') === 'true';
  const paymentStatus = searchParams.get('status');
  const paymentConfirmed = searchParams.get('payment') === 'confirmed';
  const { t } = useLanguage();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    console.log('OrderSuccessPage: orderId from URL params:', orderId);
    console.log('OrderSuccessPage: searchParams:', Object.fromEntries(searchParams.entries()));
    
    if (!orderId) {
      console.log('OrderSuccessPage: No orderId found, redirecting to products');
      router.push('/products');
      return;
    }

    const fetchOrderData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch comprehensive order details
        const orderResponse = await fetch(`/api/orders/${orderId}/complete`);
        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.error || 'Failed to fetch order');
        }
        
        const orderData = await orderResponse.json();
        setOrder(orderData.order);
        
        // Set license keys and downloads from the comprehensive response
        if (orderData.order.licenseKeys) {
          setLicenseKeys(orderData.order.licenseKeys);
        }
        if (orderData.order.downloads) {
          setDownloads(orderData.order.downloads);
        }
        
        // Note: License keys and downloads are now included in the comprehensive response above
        // The separate API calls are removed to avoid duplication
        
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, router]);

  const copyToClipboard = async (text: string, label: string = 'Text') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cod': return <Banknote className="h-4 w-4" />;
      case 'stripe': 
      case 'card': return <CreditCard className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cod': return 'Cash on Delivery';
      case 'stripe': return 'Credit/Debit Card';
      case 'card': return 'Credit/Debit Card';
      default: return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': 
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': 
      case 'dispatched': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': 
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Order Placed';
      case 'processing': return 'Processing';
      case 'submitted': return 'Sent to Courier';
      case 'shipped': return 'Shipped';
      case 'dispatched': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'failed': return 'Delivery Failed';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getTotalAmount = () => {
    if (order?.totalCents) {
      return order.totalCents / 100;
    }
    return order?.total || 0;
  };

  const getSubtotalAmount = () => {
    if (order?.subtotalCents) {
      return order.subtotalCents / 100;
    }
    return order?.subtotal || 0;
  };

  const getShippingAmount = () => {
    if (order?.shippingCents) {
      return order.shippingCents / 100;
    }
    return order?.shipping || 0;
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

  const hasVirtualProducts = order.items.some(item => item.product.isVirtual);
  const hasPhysicalProducts = order.items.some(item => !item.product.isVirtual);

  return (
    <MainLayout>
      <div className="container py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            {welcomeMode ? (
              <>
                <h1 className="text-3xl font-bold text-green-600 mb-2">{t('orderSuccess.welcome')}</h1>
                <p className="text-lg text-muted-foreground">
                  {t('orderSuccess.accountCreated')} <strong>{order.orderNumber}</strong> {t('orderSuccess.isConfirmed')}
                </p>
              </>
            ) : paymentStatus === 'pending' ? (
              <>
                <h1 className="text-3xl font-bold text-orange-600 mb-2">{t('orderSuccess.paymentPending')}</h1>
                <p className="text-lg text-muted-foreground">
                  {t('orderSuccess.orderWaitingPayment')} <strong>{order.orderNumber}</strong> {t('orderSuccess.waitingPaymentConfirmation')}
                </p>
              </>
            ) : paymentConfirmed ? (
              <>
                <h1 className="text-3xl font-bold text-green-600 mb-2">{t('orderSuccess.paymentConfirmed')}</h1>
                <p className="text-lg text-muted-foreground">
                  {t('orderSuccess.thankYouPaymentConfirmed')}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-green-600 mb-2">{t('orderSuccess.orderSuccessfullyPlaced')}</h1>
                <p className="text-lg text-muted-foreground">
                  {t('orderSuccess.thankYouForOrder')} <strong>{order.orderNumber}</strong>.
                </p>
              </>
            )}
          </div>

          {/* Order Summary Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('orderSuccess.orderNumber')}{order.orderNumber}
                </span>
                <Badge className={getStatusColor(order.codStatus || order.status)}>
                  {getStatusText(order.codStatus || order.status)}
                </Badge>
              </CardTitle>
              <CardDescription>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>{t('orderSuccess.total')}: <strong>{formatPrice(getTotalAmount())} {order.currency}</strong></span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      {getPaymentMethodIcon(order.paymentMethod)}
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Tabs for different sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="overview">{t('orderSuccess.overview')}</TabsTrigger>
              <TabsTrigger value="items">{t('orderSuccess.items')} ({order.items.length})</TabsTrigger>
              {hasVirtualProducts && <TabsTrigger value="digital">{t('orderSuccess.digitalAccess')}</TabsTrigger>}
              <TabsTrigger value="shipping">{t('orderSuccess.delivery')}</TabsTrigger>
              <TabsTrigger value="payment">{t('orderSuccess.payment')}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Main Order Details */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('orderSuccess.orderSummary')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>{t('orderSuccess.subtotal')} ({order.items.length} {t('orderSuccess.items')})</span>
                        <span>{formatPrice(getSubtotalAmount())} {order.currency}</span>
                      </div>
                      
                      {getShippingAmount() > 0 && (
                        <div className="flex justify-between">
                          <span>{t('orderSuccess.shipping')}</span>
                          <span>{formatPrice(getShippingAmount())} {order.currency}</span>
                        </div>
                      )}
                      
                      {order.tax && order.tax > 0 && (
                        <div className="flex justify-between">
                          <span>{t('orderSuccess.tax')}</span>
                          <span>{formatPrice(order.tax)} {order.currency}</span>
                        </div>
                      )}
                      
                      {order.discount && order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>{t('orderSuccess.discount')}</span>
                          <span>-{formatPrice(order.discount)} {order.currency}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>{t('orderSuccess.total')}</span>
                        <span>{formatPrice(getTotalAmount())} {order.currency}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {t('orderSuccess.customerInformation')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(order.customerFirst || order.customerLast) && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('orderSuccess.name')}</label>
                          <p className="mt-1">{order.customerFirst} {order.customerLast}</p>
                        </div>
                      )}
                      
                      {order.user?.email && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('orderSuccess.email')}</label>
                          <p className="mt-1 flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {order.user.email}
                          </p>
                        </div>
                      )}
                      
                      {order.customerPhone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('orderSuccess.phone')}</label>
                          <p className="mt-1 flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {order.customerPhone}
                          </p>
                        </div>
                      )}
                      
                      {order.customerNotes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('orderSuccess.specialInstructions')}</label>
                          <p className="mt-1 text-sm bg-muted p-3 rounded">
                            {order.customerNotes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Important Notice */}
                  {order.paymentMethod.toLowerCase() === 'cod' && (
                    <Alert>
                      <Banknote className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('orderSuccess.cashOnDelivery')}</strong><br />
                        {t('orderSuccess.prepareExactly')} <strong>{formatPrice(getTotalAmount())} {order.currency}</strong> {t('orderSuccess.toPayDeliveryPerson')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {hasVirtualProducts && (
                    <Alert>
                      <Download className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('orderSuccess.digitalProductsReady')}</strong><br />
                        {t('orderSuccess.digitalProductsAvailable')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('orderSuccess.quickActions')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" asChild>
                        <Link href="/products">
                          <Home className="h-4 w-4 mr-2" />
                          {t('orderSuccess.continueShopping')}
                        </Link>
                      </Button>
                      
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/account/orders">
                          <Package className="h-4 w-4 mr-2" />
                          {t('orderSuccess.viewOrderHistory')}
                        </Link>
                      </Button>

                      {order.trackingNumber && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/tracking/${order.trackingNumber}`} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Track Package
                          </Link>
                        </Button>
                      )}
                      
                      {hasVirtualProducts && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/account/downloads">
                            <Download className="h-4 w-4 mr-2" />
                            Access Downloads
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Next Steps */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">What happens next?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>Order confirmed and being prepared</span>
                      </div>
                      
                      {hasPhysicalProducts && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span>Package prepared for shipping</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span>Out for delivery</span>
                          </div>
                        </>
                      )}
                      
                      {order.paymentMethod.toLowerCase() === 'cod' && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          <span>Payment on delivery</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                        <span>Order complete</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ordered Items</CardTitle>
                  <CardDescription>
                    {order.items.length} item{order.items.length > 1 ? 's' : ''} in this order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                          {item.image ? (
                            <Image 
                              src={item.image} 
                              alt={item.name}
                              width={64}
                              height={64}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.sku}
                          </p>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground">
                              Variant: {item.variant}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm">Qty: {item.quantity}</span>
                            {item.product.isVirtual && (
                              <Badge variant="secondary" className="text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                Digital
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice((item.unitPriceCents ? item.unitPriceCents * item.quantity / 100 : item.price * item.quantity))}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {formatPrice((item.unitPriceCents ? item.unitPriceCents / 100 : item.price))} each
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Digital Access Tab */}
            {hasVirtualProducts && (
              <TabsContent value="digital" className="space-y-6">
                
                {/* Downloads Section */}
                {downloads.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Downloads
                      </CardTitle>
                      <CardDescription>
                        Download your digital products instantly
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {downloads.map((download) => (
                        <div key={download.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{download.product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              SKU: {download.product.sku}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Downloads: {download.downloadCount}/{download.downloadLimit || '∞'}</span>
                              {download.expiresAt && (
                                <span>Expires: {new Date(download.expiresAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <Button asChild>
                            <Link href={download.downloadUrl} target="_blank">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* License Keys Section */}
                {licenseKeys.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        License Keys
                      </CardTitle>
                      <CardDescription>
                        Your software license keys
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {licenseKeys.map((license) => (
                        <div key={license.id} className="border rounded-lg p-4 bg-blue-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-900">{license.product.name}</h4>
                              <p className="text-sm text-blue-700 mb-2">SKU: {license.product.sku}</p>
                              <div className="bg-white border rounded p-3">
                                <div className="flex items-center justify-between">
                                  <code className="text-sm font-mono text-gray-800 break-all">
                                    {license.decryptedKey}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(license.decryptedKey, 'License key')}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 mt-2">
                            Keep this license key safe - you'll need it to activate your software
                          </p>
                        </div>
                      ))}
                      
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> Save your license keys in a safe place. You can also access them anytime from your account dashboard.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}

                {/* Digital Access Notice */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Download className="h-12 w-12 text-green-600 mx-auto" />
                      <div>
                        <h3 className="font-semibold text-green-800">Instant Access Available</h3>
                        <p className="text-green-600 text-sm mt-1">
                          Your digital products are now available for download. You can access them anytime from your account dashboard.
                        </p>
                      </div>
                      <Button asChild variant="outline" className="bg-white border-green-300">
                        <Link href="/account/downloads">
                          <Download className="h-4 w-4 mr-2" />
                          Go to Downloads
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-6">
              
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Shipping Method</label>
                      <p className="mt-1">{order.shippingMethod}</p>
                    </div>
                    
                    {order.trackingNumber && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {order.trackingNumber}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(order.trackingNumber!, 'Tracking number')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {order.estimatedDelivery && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Estimated Delivery</label>
                      <p className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      {order.shippingAddress.company && (
                        <p className="text-muted-foreground">{order.shippingAddress.company}</p>
                      )}
                      <p>{order.shippingAddress.address1}</p>
                      {order.shippingAddress.address2 && (
                        <p>{order.shippingAddress.address2}</p>
                      )}
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      <p className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {order.shippingAddress.country}
                      </p>
                      {order.shippingAddress.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {order.shippingAddress.phone}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Yalidine Shipping Details */}
              {order.yalidine && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Yalidine Delivery Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Delivery Type</label>
                        <p className="mt-1 flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {order.yalidine.is_stopdesk ? 'StopDesk Pickup' : 'Home Delivery'}
                        </p>
                      </div>
                      
                      {order.yalidine.tracking && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Yalidine Tracking</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {order.yalidine.tracking}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(order.yalidine!.tracking!, 'Yalidine tracking')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Delivery Address</label>
                      <div className="mt-1 space-y-1">
                        <p>{order.yalidine.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.yalidine.to_commune_name}, {order.yalidine.to_wilaya_name}
                        </p>
                      </div>
                    </div>

                    {order.yalidine.label_url && (
                      <div>
                        <Button asChild variant="outline">
                          <Link href={order.yalidine.label_url} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Shipping Label
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-6">
              
              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getPaymentMethodIcon(order.paymentMethod)}
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                      <p className="mt-1 flex items-center gap-2">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(order.codStatus || order.status)}>
                          {order.paymentMethod.toLowerCase() === 'cod' ? 'Pay on Delivery' : 'Paid'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                      <p className="text-lg font-bold mt-1">
                        {formatPrice(getTotalAmount())} {order.currency}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Currency</label>
                      <p className="mt-1">{order.currency}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              {order.payments && order.payments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                              <span className="font-medium">{getPaymentMethodLabel(payment.paymentMethod)}</span>
                              <Badge className={getStatusColor(payment.status)}>
                                {payment.status}
                              </Badge>
                            </div>
                            {payment.transactionId && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Transaction ID: {payment.transactionId}
                              </p>
                            )}
                            {payment.paidAt && (
                              <p className="text-sm text-muted-foreground">
                                Paid: {new Date(payment.paidAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatPrice(payment.amount)} {order.currency}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Billing Address */}
              {order.billingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {order.billingAddress.firstName} {order.billingAddress.lastName}
                      </p>
                      {order.billingAddress.company && (
                        <p className="text-muted-foreground">{order.billingAddress.company}</p>
                      )}
                      <p>{order.billingAddress.address1}</p>
                      {order.billingAddress.address2 && (
                        <p>{order.billingAddress.address2}</p>
                      )}
                      <p>
                        {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                      </p>
                      <p className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {order.billingAddress.country}
                      </p>
                      {order.billingAddress.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {order.billingAddress.phone}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoice Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice & Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/account/invoices/${order.id}`}>
                      <Receipt className="h-4 w-4 mr-2" />
                      View Invoice
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="mailto:support@compucar.com">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button asChild size="lg">
              <Link href="/account/orders">
                View Order History
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
