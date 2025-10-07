"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Package,
  Download,
  Calendar,
  CreditCard,
  User,
  Loader2,
  CheckCircle,
  Clock,
  Truck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  product?: {
    name: string;
    slug: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  displayStatus?: string; // Added for COD orders
  paymentMethod?: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  customerNotes?: string;
  shippingMethod?: string;
  customerFirst?: string;
  customerLast?: string;
  customerPhone?: string;
  codStatus?: string;
  currency?: string;
  items: OrderItem[];
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  } | null;
  payments?: Array<{
    id: string;
    method: string;
    status: string;
    transactionId?: string;
    amount: number;
    paidAt?: string;
  }>;
  tracking?: string | null; // Added for tracking
  trackingStatus?: string | null; // Added for tracking status
  shippingInfo?: {
    wilaya: string;
    commune: string;
    isStopdesk: boolean;
    shippingCost: number;
    address: string;
  } | null;
  yalidine?: any; // Full yalidine object for detailed tracking
}

function getStatusIcon(status: string, size = "h-5 w-5") {
  switch (status.toLowerCase()) {
    case 'pending':
      return <Clock className={`${size} text-orange-500`} />;
    case 'processing':
      return <Package className={`${size} text-blue-500`} />;
    case 'shipped':
      return <Truck className={`${size} text-purple-500`} />;
    case 'delivered':
      return <CheckCircle className={`${size} text-green-500`} />;
    case 'cancelled':
      return <X className={`${size} text-red-500`} />;
    default:
      return <Clock className={`${size} text-gray-500`} />;
  }
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'shipped':
      return 'default';
    case 'delivered':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.id as string;

  useEffect(() => {
    async function fetchOrder() {
      if (!session?.user || !orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();
        
        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Order not found');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [session, orderId]);

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p>{t('auth.pleaseLogin')}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('orders.detail.backToOrders')}
          </Button>
          
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>{t('orders.detail.loadingOrderDetails')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('orders.detail.backToOrders')}
          </Button>
          
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('orders.detail.orderNotFound')}</h3>
                <p className="text-muted-foreground mb-6">
                  {error || t('orders.detail.orderNotFoundDescription')}
                </p>
                <Button asChild>
                  <Link href="/account/orders">{t('orders.detail.viewAllOrders')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Get customer information from order data
  const getCustomerInfo = () => {
    // For logged-in users, use user data
    if (order.user) {
      return {
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || t('orders.detail.guestCustomer'),
        email: order.user.email || t('orders.detail.noEmail')
      };
    }
    
    // For COD/guest orders, use customer fields
    if (order.customerFirst || order.customerLast) {
      return {
        name: `${order.customerFirst || ''} ${order.customerLast || ''}`.trim() || t('orders.detail.guestCustomer'),
        email: order.customerPhone || t('orders.detail.noEmail')
      };
    }
    
    // Fallback to parsing from notes (legacy support)
    const customerInfo = order.customerNotes ? order.customerNotes.match(/Customer: (.+?) \((.+?)\)/) : null;
    return {
      name: customerInfo ? customerInfo[1] : t('orders.detail.guestCustomer'),
      email: customerInfo ? customerInfo[2] : t('orders.detail.noEmail')
    };
  };

  const customerInfo = getCustomerInfo();

  // Get translated delivery method
  const getDeliveryMethodTranslation = (method: string) => {
    // Normalize the method string for comparison (handle spaces and capitals)
    const normalizedMethod = method?.toLowerCase().replace(/\s+/g, '_');
    
    switch (normalizedMethod) {
      case 'home':
      case 'home_delivery':
      case 'livraison_domicile':
      case 'livraison_a_domicile':
      case 'livraison_à_domicile':
      case 'domicile':
        return t('orders.detail.homeDelivery');
      case 'pickup':
      case 'store_pickup':
      case 'retrait_magasin':
      case 'magasin':
        return t('orders.detail.storePickup');
      case 'stopdesk':
      case 'stop_desk':
      case 'point_relais':
      case 'relais':
        return t('orders.detail.stopDesk');
      case 'cod':
      case 'cash_on_delivery':
      case 'paiement_livraison':
        return t('orders.detail.cod');
      default:
        return method || t('orders.detail.standardDelivery');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('orders.detail.backToOrders')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('orders.detail.title')} {order.orderNumber}</h1>
              <p className="text-muted-foreground">
                {t('orders.placedTime', { time: formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) })}
              </p>
            </div>
          </div>
          
          <Badge variant={getStatusVariant(order.displayStatus || order.status) as any} className="capitalize">
            {getStatusIcon(order.displayStatus || order.status, "h-4 w-4")}
            <span className="ml-2">{order.displayStatus || order.status}</span>
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('orders.detail.orderItems')}
                </CardTitle>
                <CardDescription>
                  {t('orders.detail.digitalProducts')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-cover rounded-md"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{t('orders.detail.sku')}: {item.sku}</p>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">{t('orders.detail.variant')}: {item.variant}</p>
                      )}
                      <p className="text-sm">{t('orders.detail.quantity')}: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <p className="font-semibold">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        ${Number(item.price).toFixed(2)} {t('orders.detail.each')}
                      </p>
                      {(order.displayStatus || order.status).toLowerCase() === 'delivered' && (
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-2" />
                          {t('orders.detail.download')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('orders.detail.orderSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('orders.detail.subtotal')}</span>
                    <span>${Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>{t('orders.detail.shipping')}</span>
                    <span>
                      {Number(order.shipping) === 0 ? t('orders.detail.free') : `$${Number(order.shipping).toFixed(2)}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>{t('orders.detail.tax')}</span>
                    <span>
                      {Number(order.tax) === 0 ? t('orders.detail.included') : `$${Number(order.tax).toFixed(2)}`}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t('orders.detail.total')}</span>
                    <span>${Number(order.total).toFixed(2)}</span>
                  </div>
                </div>

                {order.shippingMethod && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{t('orders.detail.deliveryMethod')}</p>
                    <p className="font-medium">{getDeliveryMethodTranslation(order.shippingMethod)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('orders.detail.customerInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.detail.name')}</p>
                  <p className="font-medium">{customerInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {order.customerPhone ? t('orders.detail.phone') : t('orders.detail.email')}
                  </p>
                  <p className="font-medium">{customerInfo.email}</p>
                </div>
                {order.tracking && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('orders.detail.trackingNumber')}</p>
                    <p className="font-medium text-blue-600">{order.tracking}</p>
                  </div>
                )}
                {order.shippingInfo && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('orders.detail.shippingAddress')}</p>
                    <p className="font-medium">{order.shippingInfo.commune}, {order.shippingInfo.wilaya}</p>
                    {order.shippingInfo.address && (
                      <p className="text-sm text-muted-foreground">{order.shippingInfo.address}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('orders.detail.orderTimeline')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">{t('orders.detail.orderPlaced')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')} {t('orders.detail.at')} {format(new Date(order.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
                
                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.displayStatus || order.status, "h-4 w-4")}
                    <div>
                      <p className="font-medium capitalize">{t('orders.detail.status')}: {order.displayStatus || order.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.updatedAt), 'MMM dd, yyyy')} {t('orders.detail.at')} {format(new Date(order.updatedAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
