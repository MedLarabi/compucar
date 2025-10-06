"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  DollarSign,
  Calendar,
  TrendingUp,
  Eye,
  ArrowRight,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

// Types for order data
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

function getStatusColor(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-green-500';
    case 'shipped':
      return 'bg-blue-500';
    case 'processing':
      return 'bg-yellow-500';
    case 'pending':
      return 'bg-gray-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export default function AccountDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  // Fetch user's real orders
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
          // Transform the order data to match our interface
          const transformedOrders = data.orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status.toLowerCase(),
            total: Number(order.total),
            createdAt: order.createdAt,
            items: order.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: Number(item.price),
              quantity: item.quantity,
              image: item.image,
            })),
          }));
          setOrders(transformedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [session]);

  // Calculate real stats from actual data
  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
    accountCreated: session?.user?.createdAt ? new Date(session.user.createdAt) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8" />
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.welcomeBack', { name: session?.user?.name || t('common.user') })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.totalOrders')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalSpent.toFixed(2)} DA</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.totalSpent')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('dashboard.recentOrders')}
              </CardTitle>
              <Link href="/account/orders">
                <Button variant="outline" size="sm">
                  {t('dashboard.viewAllOrders')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}
                        />
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <Badge variant="secondary" className="capitalize">
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">{order.total.toFixed(2)} DA</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} {order.items.length === 1 ? t('cart.item') : t('cart.items')}
                      </p>
                    </div>

                    <Link href={`/account/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('dashboard.noOrdersYet')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('dashboard.startShopping')}
                </p>
                <Link href="/products">
                  <Button>{t('wishlist.browseProducts')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.accountInformation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.memberSince')}</p>
                <p className="font-medium">
                  {formatDistanceToNow(stats.accountCreated, { addSuffix: true })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.accountType')}</p>
                <p className="font-medium capitalize">
                  {session?.user?.role?.toLowerCase() || t('dashboard.customer')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('contact.email')}</p>
                <p className="font-medium">{session?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.lastLogin')}</p>
                <p className="font-medium">{t('dashboard.today')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}



