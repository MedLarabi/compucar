"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  Search,
  Filter,
  Eye,
  Download,
  Truck,
  CheckCircle,
  Clock,
  X,
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Package2,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  product?: {
    name: string;
    slug: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  displayStatus: string; // Added for COD orders
  total: number;
  createdAt: string;
  customerNotes?: string;
  items: OrderItem[];
  tracking?: string | null; // Added for tracking
  trackingStatus?: string | null; // Added for tracking status
  shippingInfo?: {
    wilaya: string;
    commune: string;
    isStopdesk: boolean;
    shippingCost: number;
  } | null;
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'confirmed':
    case 'submitted':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'processing':
      return <Package2 className="h-4 w-4 text-blue-500" />;
    case 'shipped':
    case 'dispatched':
      return <Truck className="h-4 w-4 text-purple-500" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelled':
    case 'failed':
      return <X className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
    case 'submitted':
    case 'processing':
      return 'default';
    case 'shipped':
    case 'dispatched':
      return 'default';
    case 'delivered':
      return 'default';
    case 'cancelled':
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-orange-500';
    case 'processing':
      return 'bg-blue-500';
    case 'shipped':
      return 'bg-purple-500';
    case 'delivered':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch real orders from API
  useEffect(() => {
    async function fetchOrders() {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        if (data.success) {
          setOrders(data.orders);
        } else {
          console.error('Failed to fetch orders:', data.error);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [session]);

  // Filter orders based on search term, status, and date
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || (order.displayStatus || order.status).toLowerCase() === statusFilter;

    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      
      if (dateFilter === 'last30') {
        return (now.getTime() - orderDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
      }
      
      if (dateFilter === 'last90') {
        return (now.getTime() - orderDate.getTime()) <= (90 * 24 * 60 * 60 * 1000);
      }
      
      return true;
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p>{t('auth.pleaseLogin')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('orders.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('orders.description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredOrders.length} {filteredOrders.length === 1 ? t('cart.item') : t('cart.items')}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" />
              {t('orders.filterOrders')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('orders.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <SelectValue placeholder={t('orders.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('orders.allStatus')}</SelectItem>
                  <SelectItem value="pending">{t('orders.pending')}</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="processing">{t('orders.processing')}</SelectItem>
                  <SelectItem value="shipped">{t('orders.shipped')}</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="delivered">{t('orders.delivered')}</SelectItem>
                  <SelectItem value="cancelled">{t('orders.cancelled')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <SelectValue placeholder={t('orders.filterByDate')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('orders.allTime')}</SelectItem>
                  <SelectItem value="last30">{t('orders.last30Days')}</SelectItem>
                  <SelectItem value="last90">{t('orders.last90Days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>{t('orders.loadingOrders')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Orders List */}
            {filteredOrders.length > 0 ? (
              <div className="space-y-6">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Left Section - Order Info */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                {getStatusIcon(order.displayStatus || order.status)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {t('orders.placedTime', { time: formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) })}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={getStatusVariant(order.displayStatus || order.status) as any} 
                              className="capitalize px-3 py-1 text-sm font-medium"
                            >
                              {order.displayStatus || order.status}
                            </Badge>
                          </div>

                          {/* Order Details Grid */}
                          <div className="grid sm:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">{t('orders.totalAmount')}</p>
                                <p className="font-semibold">${Number(order.total).toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">{t('orders.items')}</p>
                                <p className="font-semibold">
                                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} {order.items.length === 1 ? t('cart.item') : t('cart.items')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">{t('orders.orderDate')}</p>
                                <p className="font-semibold">
                                  {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Tracking Info */}
                          {order.tracking && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    {t('orders.detail.trackingNumber')}
                                  </p>
                                  <p className="text-blue-700 dark:text-blue-300 font-mono text-sm">
                                    {order.tracking}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Shipping Info */}
                          {order.shippingInfo && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                              <MapPin className="h-4 w-4" />
                              <span>{order.shippingInfo.commune}, {order.shippingInfo.wilaya}</span>
                              {order.shippingInfo.isStopdesk && (
                                <Badge variant="outline" className="text-xs">
                                  {t('orders.detail.stopDesk')}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Section - Items Preview & Actions */}
                        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l bg-muted/30 p-6">
                          {/* Items Preview */}
                          <div className="mb-4">
                            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                              {t('orders.items')}
                            </h4>
                            <div className="space-y-2">
                              {order.items.slice(0, 2).map((item, index) => (
                                <div key={item.id} className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-background rounded-md flex items-center justify-center border">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="text-xs text-muted-foreground text-center py-2">
                                  {t('orders.andMore', { count: order.items.length - 2 })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-2">
                            <Link href={`/account/orders/${order.id}`} className="block">
                              <Button variant="default" size="sm" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                {t('orders.viewDetails')}
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </Button>
                            </Link>
                            
                            {(order.displayStatus || order.status).toLowerCase() === 'delivered' && (
                              <Button variant="outline" size="sm" className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                {t('orders.download')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                        ? t('orders.noOrdersFound') 
                        : t('orders.noOrdersYet')}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                        ? t('messages.tryAdjustingFilters')
                        : t('messages.ordersWillAppear')}
                    </p>
                    {!(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                      <Button asChild className="mt-4">
                        <Link href="/products">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          {t('orders.startShopping')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}