"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Download, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  shippingMethod?: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      isVirtual?: boolean;
    };
  }>;
}

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          console.error('Failed to fetch orders:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('invoices.title')}</h1>
            <p className="text-gray-600">{t('invoices.description')}</p>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('invoices.noInvoicesFound')}</h3>
                <p className="text-gray-600 mb-4">{t('invoices.noPurchasesYet')}</p>
                <Button asChild>
                  <Link href="/products">{t('invoices.browseProducts')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{t('invoices.orderNumber', { number: order.orderNumber })}</CardTitle>
                        <CardDescription>
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(order.total)}
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-xs`}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Order Items */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">{t('invoices.items')}</h4>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <span>{item.product.name}</span>
                                {item.product.isVirtual && (
                                  <Badge variant="secondary" className="text-xs">{t('invoices.digital')}</Badge>
                                )}
                              </div>
                              <div className="text-gray-600">
                                {item.quantity} × {formatPrice(item.price)} = {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Method */}
                      {order.shippingMethod && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{t('invoices.deliveryMethod')}:</span>
                          <span className="capitalize">{order.shippingMethod}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2 pt-3 border-t">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/account/invoices/${order.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('invoices.viewInvoice')}
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/account/invoices/${order.id}/download`, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('invoices.download')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
