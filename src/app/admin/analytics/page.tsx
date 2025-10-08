"use client";

import { useState, useEffect } from "react";
import { AdminGuard, AdminHeaderLayout } from "@/components/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Star,
  RefreshCw,
  Activity,
  Target,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const { t } = useLanguage();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/comprehensive?range=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        toast.error('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading || !data) {
    return (
      <AdminGuard>
        <AdminHeaderLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.analytics.title')}</h1>
                <p className="text-muted-foreground">{t('admin.analytics.loadingSubtitle')}</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </AdminHeaderLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('admin.analytics.title')}</h1>
              <p className="text-muted-foreground">
                {t('admin.analytics.subtitle')} {data.summary?.period || timeRange + ' ' + t('admin.analytics.days')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('admin.analytics.timeRanges.7')}</SelectItem>
                  <SelectItem value="14">{t('admin.analytics.timeRanges.14')}</SelectItem>
                  <SelectItem value="30">{t('admin.analytics.timeRanges.30')}</SelectItem>
                  <SelectItem value="60">{t('admin.analytics.timeRanges.60')}</SelectItem>
                  <SelectItem value="90">{t('admin.analytics.timeRanges.90')}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('admin.analytics.refresh')}
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.analytics.metrics.totalRevenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.stats?.totalRevenue || 0)}</div>
                <div className="flex items-center text-xs">
                  {getChangeIcon(data.stats?.revenueChange || 0)}
                  <span className={cn("ml-1", getChangeColor(data.stats?.revenueChange || 0))}>
                    {(data.stats?.revenueChange || 0) > 0 ? '+' : ''}{(data.stats?.revenueChange || 0).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">{t('admin.analytics.metrics.fromLastPeriod')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.analytics.metrics.totalOrders')}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.stats?.totalOrders || 0)}</div>
                <div className="flex items-center text-xs">
                  {getChangeIcon(data.stats?.ordersChange || 0)}
                  <span className={cn("ml-1", getChangeColor(data.stats?.ordersChange || 0))}>
                    {(data.stats?.ordersChange || 0) > 0 ? '+' : ''}{(data.stats?.ordersChange || 0).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">{t('admin.analytics.metrics.fromLastPeriod')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.analytics.metrics.averageOrderValue')}</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.stats?.averageOrderValue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.analytics.metrics.perOrderAverage')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.analytics.metrics.conversionRate')}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(data.stats?.conversionRate || 0).toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.analytics.metrics.ordersPerCustomer')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and more content */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">{t('admin.analytics.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="sales">{t('admin.analytics.tabs.sales')}</TabsTrigger>
              <TabsTrigger value="products">{t('admin.analytics.tabs.products')}</TabsTrigger>
              <TabsTrigger value="customers">{t('admin.analytics.tabs.customers')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Sales Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.analytics.charts.salesTrend.title')}</CardTitle>
                    <CardDescription>{t('admin.analytics.charts.salesTrend.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={data.salesData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Order Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.analytics.charts.orderStatus.title')}</CardTitle>
                    <CardDescription>{t('admin.analytics.charts.orderStatus.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.orderStatus || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={(entry) => `${entry.status}: ${entry.percentage}%`}
                        >
                          {(data.orderStatus || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.charts.topProducts.title')}</CardTitle>
                  <CardDescription>{t('admin.analytics.charts.topProducts.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(data.topProducts || []).slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="revenue" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Customer Growth */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.analytics.charts.customerGrowth.title')}</CardTitle>
                    <CardDescription>{t('admin.analytics.charts.customerGrowth.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.customerGrowth || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="newCustomers" stroke="#3b82f6" name={t('admin.analytics.chartLabels.newCustomers')} />
                        <Line type="monotone" dataKey="totalCustomers" stroke="#10b981" name={t('admin.analytics.chartLabels.totalCustomers')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.analytics.charts.paymentMethods.title')}</CardTitle>
                    <CardDescription>{t('admin.analytics.charts.paymentMethods.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(data.paymentMethods || []).map((method: any, index: number) => (
                        <div key={method.method} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="font-medium">{method.method}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(method.revenue)}</div>
                            <div className="text-sm text-muted-foreground">{method.count} {t('admin.analytics.chartLabels.transactions')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('admin.analytics.productInsights.totalProducts')}</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(data.productInsights?.totalProducts || 0)}</div>
                    <p className="text-xs text-muted-foreground">{t('admin.analytics.productInsights.activeProducts')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('admin.analytics.productInsights.averageRating')}</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.productInsights?.averageRating || 0}/5</div>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.analytics.productInsights.fromReviews', { count: formatNumber(data.productInsights?.totalReviews || 0) })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('admin.analytics.productInsights.stockAlerts')}</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {data.productInsights?.lowStockProducts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.analytics.productInsights.outOfStock', { count: data.productInsights?.outOfStockProducts || 0 })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('admin.analytics.customerInsights.totalCustomers')}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(data.customerInsights?.totalCustomers || 0)}</div>
                    <p className="text-xs text-muted-foreground">{t('admin.analytics.customerInsights.registeredCustomers')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('admin.analytics.customerInsights.newCustomers')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(data.customerInsights?.newCustomers || 0)}</div>
                    <p className="text-xs text-muted-foreground">{t('admin.analytics.customerInsights.thisPeriod')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('admin.analytics.customerInsights.retentionRate')}</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.customerInsights?.customerRetentionRate || 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.analytics.customerInsights.repeatCustomers', { count: formatNumber(data.customerInsights?.repeatCustomers || 0) })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}
