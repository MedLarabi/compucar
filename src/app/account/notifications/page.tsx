"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  Settings,
  Mail,
  Smartphone,
  Globe,
  Package,
  ShoppingCart,
  Users,
  Shield,
  Wrench,
  Star,
  MessageSquare,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
  data?: Record<string, any>;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
  productAlerts: boolean;
  securityAlerts: boolean;
  systemNotifications: boolean;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    orderUpdates: true,
    productAlerts: true,
    securityAlerts: true,
    systemNotifications: false,
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      fetchUnreadCount();
      loadPreferences();
    }
  }, [session?.user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('notifications.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences({
            emailNotifications: data.preferences.emailNotifications ?? true,
            smsNotifications: data.preferences.smsNotifications ?? false,
            marketingEmails: data.preferences.marketingEmails ?? true,
            orderUpdates: true, // Default for new preference
            productAlerts: true, // Default for new preference
            securityAlerts: true, // Default for new preference
            systemNotifications: false, // Default for new preference
          });
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success(t('notifications.markedAsRead'));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error(t('notifications.failedToMarkRead'));
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
        toast.success(t('notifications.allMarkedAsRead'));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error(t('notifications.failedToMarkAllRead'));
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success(t('notifications.notificationDeleted'));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(t('notifications.failedToDelete'));
    }
  };

  const savePreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          smsNotifications: preferences.smsNotifications,
          marketingEmails: preferences.marketingEmails,
        }),
      });

      if (response.ok) {
        toast.success(t('notifications.preferencesSaved'));
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(t('notifications.failedToSavePreferences'));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      // Orders & Payments
      case 'new_order_received':
      case 'order_confirmation':
      case 'payment_success':
      case 'refund_processed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'payment_failed':
      case 'payment_pending':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'order_status_update':
      case 'shipping_update':
        return <Package className="h-5 w-5 text-blue-600" />;
      
      // Inventory & Product
      case 'low_stock_alert':
      case 'product_out_of_stock':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'new_product_added':
      case 'product_back_in_stock':
      case 'price_drop':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      
      // Customer & Reviews
      case 'new_customer_registered':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'new_review_submitted':
      case 'review_request':
        return <Star className="h-5 w-5 text-blue-600" />;
      case 'customer_support_message':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'abandoned_cart':
        return <ShoppingCart className="h-5 w-5 text-orange-600" />;
      
      // System & Security
      case 'admin_login_new_device':
      case 'system_error':
      case 'license_key_api_failure':
      case 'security_alert':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'maintenance_completed':
        return <Wrench className="h-5 w-5 text-green-600" />;
      
      // General
      case 'promotional_offer':
        return <Globe className="h-5 w-5 text-purple-600" />;
      case 'account_update':
      case 'welcome':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">{t('notifications.high')}</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">{t('notifications.medium')}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{t('notifications.low')}</Badge>;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchTerm === "" || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || notification.priority === priorityFilter;
    const matchesRead = readFilter === "all" || 
      (readFilter === "unread" && !notification.isRead) ||
      (readFilter === "read" && notification.isRead);

    return matchesSearch && matchesType && matchesPriority && matchesRead;
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'order_status_update':
      case 'order_confirmation':
      case 'payment_success':
      case 'payment_failed':
      case 'payment_pending':
      case 'refund_processed':
      case 'shipping_update':
        window.location.href = '/account/orders';
        break;
      case 'review_request':
        if (notification.data?.orderNumber) {
          window.location.href = `/account/orders`;
        }
        break;
      case 'abandoned_cart':
        window.location.href = '/cart';
        break;
      case 'promotional_offer':
      case 'price_drop':
      case 'product_back_in_stock':
        window.location.href = '/products';
        break;
      case 'security_alert':
      case 'admin_login_new_device':
        window.location.href = '/account/security';
        break;
      default:
        // Default behavior
        break;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('notifications.title')}</h1>
            <p className="text-muted-foreground">
              {t('notifications.description')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={fetchNotifications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('notifications.refresh')}
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                {t('notifications.markAllRead', { count: unreadCount })}
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('notifications.notifications')}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('notifications.preferences')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('notifications.filterNotifications')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>{t('common.search')}</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('notifications.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('notifications.type')}</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('notifications.allTypes')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('notifications.allTypes')}</SelectItem>
                        <SelectItem value="order_status_update">{t('notifications.orders')}</SelectItem>
                        <SelectItem value="payment_success">{t('notifications.payments')}</SelectItem>
                        <SelectItem value="security_alert">{t('notifications.security')}</SelectItem>
                        <SelectItem value="promotional_offer">{t('notifications.promotions')}</SelectItem>
                        <SelectItem value="product_back_in_stock">{t('notifications.products')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('notifications.priority')}</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('notifications.allPriorities')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('notifications.allPriorities')}</SelectItem>
                        <SelectItem value="high">{t('notifications.highPriority')}</SelectItem>
                        <SelectItem value="medium">{t('notifications.mediumPriority')}</SelectItem>
                        <SelectItem value="low">{t('notifications.lowPriority')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('notifications.status')}</Label>
                    <Select value={readFilter} onValueChange={setReadFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('notifications.allStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('notifications.allNotifications')}</SelectItem>
                        <SelectItem value="unread">{t('notifications.unreadOnly')}</SelectItem>
                        <SelectItem value="read">{t('notifications.readOnly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('notifications.recentNotifications')}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {t('notifications.notificationCount', { filtered: filteredNotifications.length, total: notifications.length })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {loading ? (
                    <div className="p-6 text-center text-muted-foreground">
                      {t('notifications.loading')}
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      {searchTerm || typeFilter !== "all" || priorityFilter !== "all" || readFilter !== "all" 
                        ? t('notifications.noMatchingFilters') 
                        : t('notifications.noNotificationsYet')}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNotifications.map((notification, index) => (
                        <div key={notification.id}>
                          <div
                            className={cn(
                              "p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                              getPriorityColor(notification.priority),
                              !notification.isRead && "bg-muted/30"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h4 className={cn(
                                    "font-medium truncate",
                                    !notification.isRead ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {getPriorityBadge(notification.priority)}
                                    {!notification.isRead && (
                                      <div className="h-2 w-2 bg-primary rounded-full" />
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.createdAt), { 
                                      addSuffix: true 
                                    })}
                                  </p>
                                  
                                  <div className="flex items-center gap-1">
                                    {!notification.isRead && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(notification.id);
                                        }}
                                        className="h-7 w-7 p-0"
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t('notifications.notificationPreferences')}
                </CardTitle>
                <CardDescription>
                  {t('notifications.customizeDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">{t('notifications.emailNotifications')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('notifications.emailNotificationsDesc')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">{t('notifications.smsNotifications')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('notifications.smsNotificationsDesc')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.smsNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, smsNotifications: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">{t('notifications.marketingEmails')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('notifications.marketingEmailsDesc')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, marketingEmails: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <h4 className="font-medium">{t('notifications.notificationCategories')}</h4>

                  <div className="space-y-4 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm">{t('notifications.orderUpdates')}</Label>
                          <p className="text-xs text-muted-foreground">
                            {t('notifications.orderUpdatesDesc')}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.orderUpdates}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, orderUpdates: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm">{t('notifications.productAlerts')}</Label>
                          <p className="text-xs text-muted-foreground">
                            {t('notifications.productAlertsDesc')}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.productAlerts}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, productAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm">{t('notifications.securityAlerts')}</Label>
                          <p className="text-xs text-muted-foreground">
                            {t('notifications.securityAlertsDesc')}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.securityAlerts}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, securityAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm">{t('notifications.systemNotifications')}</Label>
                          <p className="text-xs text-muted-foreground">
                            {t('notifications.systemNotificationsDesc')}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.systemNotifications}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, systemNotifications: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={savePreferences}>
                    {t('notifications.savePreferences')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
