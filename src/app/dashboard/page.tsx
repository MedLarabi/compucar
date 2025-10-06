"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useWishlistStore, useCartStore } from '@/stores';
import {
  Package,
  DollarSign,
  Heart,
  ShoppingCart,
  TrendingUp,
  Eye,
  ArrowRight,
  MapPin,
  Settings,
  User,
  Clock,
  CreditCard,
  Truck,
  Star,
  Gift,
  Bell,
  Shield,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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

function getStatusProgress(status: string) {
  switch (status) {
    case 'delivered':
      return 100;
    case 'shipped':
      return 75;
    case 'processing':
      return 50;
    case 'pending':
      return 25;
    default:
      return 0;
  }
}

export default function CustomerDashboard() {
  const { data: session } = useSession();
  const { items: wishlistItems } = useWishlistStore();
  const { totalItems: cartItems } = useCartStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    wishlistItems: wishlistItems.length,
    cartItems: cartItems,
    accountCreated: session?.user?.createdAt ? new Date(session.user.createdAt) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    loyaltyPoints: orders.length * 100, // 100 points per order
    savedAmount: orders.length * 5.50, // Mock savings calculation
    activeSubscriptions: 0, // Set to 0 for now
  };

  const activeOrder = orders.find(order => order.status === 'shipped' || order.status === 'processing');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {session?.user?.firstName || session?.user?.name || 'Customer'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Here's what's happening with your account and orders
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Link href="/account/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-3xl font-bold">{stats.totalOrders}</p>
                    <p className="text-xs text-green-600 mt-1">+2 this month</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="text-3xl font-bold">${stats.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-1">+${stats.savedAmount} saved</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Loyalty Points</p>
                    <p className="text-3xl font-bold">{stats.loyaltyPoints}</p>
                    <p className="text-xs text-blue-600 mt-1">${(stats.loyaltyPoints * 0.01).toFixed(2)} value</p>
                  </div>
                  <Gift className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Wishlist</p>
                    <p className="text-3xl font-bold">{stats.wishlistItems}</p>
                    <p className="text-xs text-red-600 mt-1">
                      <Heart className="h-3 w-3 inline mr-1" />
                      saved items
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Order Tracking */}
          {!isLoading && activeOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Order Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activeOrder.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Order placed: {new Date(activeOrder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {activeOrder.status}
                    </Badge>
                  </div>
                  <Progress value={getStatusProgress(activeOrder.status)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Order placed</span>
                    <span>Processing</span>
                    <span>Shipped</span>
                    <span>Delivered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                  <Link href="/account/orders">
                    <Button variant="outline" size="sm">
                      View All
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
                      <div key={order.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
                        <div className="flex-1">
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.total.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{order.items.length} items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start shopping to see your orders here
                    </p>
                    <Link href="/products">
                      <Button>Browse Products</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/account/addresses">
                    <Button variant="outline" className="w-full h-20 flex-col">
                      <MapPin className="h-6 w-6 mb-2" />
                      Addresses
                    </Button>
                  </Link>
                  <Link href="/account/wishlist">
                    <Button variant="outline" className="w-full h-20 flex-col">
                      <Heart className="h-6 w-6 mb-2" />
                      Wishlist
                    </Button>
                  </Link>
                  <Link href="/account/orders">
                    <Button variant="outline" className="w-full h-20 flex-col">
                      <Clock className="h-6 w-6 mb-2" />
                      Order History
                    </Button>
                  </Link>
                  <Link href="/account/security">
                    <Button variant="outline" className="w-full h-20 flex-col">
                      <Shield className="h-6 w-6 mb-2" />
                      Security
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Shop Links */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Shop</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/products?category=engine">
                    <Button variant="outline" className="w-full h-16 flex-col">
                      <Settings className="h-6 w-6 mb-1" />
                      <span className="text-sm">Engine Parts</span>
                    </Button>
                  </Link>
                  <Link href="/products?category=brake">
                    <Button variant="outline" className="w-full h-16 flex-col">
                      <Truck className="h-6 w-6 mb-1" />
                      <span className="text-sm">Brake System</span>
                    </Button>
                  </Link>
                  <Link href="/products?category=electrical">
                    <Button variant="outline" className="w-full h-16 flex-col">
                      <Eye className="h-6 w-6 mb-1" />
                      <span className="text-sm">Electrical</span>
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="outline" className="w-full h-16 flex-col">
                      <Package className="h-6 w-6 mb-1" />
                      <span className="text-sm">All Products</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">Account Created</p>
                        <p className="text-sm text-muted-foreground">Welcome to CompuCar!</p>
                      </div>
                    </div>
                  </div>
                  {!isLoading && orders.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium">First Order Placed</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(orders[orders.length - 1].createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{session?.user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{session?.user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member since:</span>
                      <span>{formatDistanceToNow(stats.accountCreated, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Shopping Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Orders:</span>
                      <span>{stats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Spent:</span>
                      <span>${stats.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Order:</span>
                      <span>${stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Loyalty & Rewards</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points Balance:</span>
                      <span>{stats.loyaltyPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points Value:</span>
                      <span>${(stats.loyaltyPoints * 0.01).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Reward:</span>
                      <span>250 points away</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
