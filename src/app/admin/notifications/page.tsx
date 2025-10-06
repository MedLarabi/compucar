"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminGuard, AdminHeaderLayout } from "@/components/admin";
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
  AlertTriangle,
  Clock,
  Eye,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
  fileId?: string;
  data?: {
    orderNumber?: string;
    customerId?: string;
    items?: Array<{name: string; quantity: number; price: number}>;
    [key: string]: any;
  };
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

export default function AdminNotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
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
    systemNotifications: true,
  });

  useEffect(() => {
    if (session?.user?.id) {
      console.log('Session user ID:', session.user.id);
      console.log('Session user role:', (session.user as any).role);
      fetchNotifications();
      fetchUnreadCount();
      loadPreferences();
    } else {
      console.log('No session or user ID found');
    }
  }, [session?.user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('Fetching notifications for user:', session?.user?.id);
      const response = await fetch('/api/notifications?limit=100');
      console.log('Notifications response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Notifications response data:', data);
        console.log('Number of notifications:', data.notifications?.length || 0);
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to fetch notifications:', response.status, response.statusText);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
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
      console.log('Loading user preferences...');
      const response = await fetch('/api/user/preferences');
      console.log('Preferences response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Preferences data:', data);
        // The API returns preferences directly, not nested under 'preferences'
        setPreferences({
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? false,
          marketingEmails: data.marketingEmails ?? true,
          orderUpdates: true,
          productAlerts: true,
          securityAlerts: true,
          systemNotifications: true,
        });
      } else {
        console.log('User preferences API not found, using defaults');
        // Use default preferences if API doesn't exist
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      console.log('Using default preferences due to error');
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
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
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
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
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
        toast.success('Admin notification preferences saved');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      // Orders & Payments
      case 'new_order_received':
      case 'NEW_ORDER_RECEIVED':
        return <ShoppingCart className="h-5 w-5 text-green-600" />;
      case 'order_confirmation':
      case 'payment_success':
      case 'refund_processed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'payment_failed':
      case 'payment_pending':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'order_status_update':
      case 'ORDER_STATUS_UPDATE':
      case 'shipping_update':
        return <Package className="h-5 w-5 text-blue-600" />;
      
      // File notifications
      case 'NEW_FILE_UPLOAD':
      case 'new_file_upload':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'NEW_CUSTOMER_COMMENT':
      case 'new_customer_comment':
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      
      // Inventory & Product
      case 'low_stock_alert':
      case 'product_out_of_stock':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
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
        return <MessageSquare className="h-5 w-5 text-red-600" />;
      case 'abandoned_cart':
        return <Clock className="h-5 w-5 text-orange-600" />;
      
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
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Low</Badge>;
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

  const getNotificationLink = (notification: Notification) => {
    console.log('🔍 Getting admin notification link for:', {
      type: notification.type,
      fileId: notification.fileId,
      data: notification.data,
      hasFileId: !!notification.fileId,
      hasOrderNumber: !!notification.data?.orderNumber,
      isAdmin: session?.user?.isAdmin
    });

    // Handle file-related notifications - ADMIN ONLY
    if (notification.fileId) {
      const link = `/admin/files/${notification.fileId}`;
      console.log('📁 Admin file notification link:', link);
      return link;
    }
    
    // Handle order-related notifications - ADMIN ONLY
    if ((notification.type === 'NEW_ORDER_RECEIVED' || notification.type === 'new_order_received') && notification.data?.orderNumber) {
      const link = `/admin/orders?search=${notification.data.orderNumber}`;
      console.log('🛒 Admin order notification link:', link);
      return link;
    }
    
    // Handle order status updates - ADMIN ONLY
    if ((notification.type === 'ORDER_STATUS_UPDATE' || notification.type === 'order_status_update') && notification.data?.orderNumber) {
      const link = `/admin/orders?search=${notification.data.orderNumber}`;
      console.log('📦 Admin order status notification link:', link);
      return link;
    }
    
    // Handle customer comments - ADMIN ONLY
    if ((notification.type === 'NEW_CUSTOMER_COMMENT' || notification.type === 'new_customer_comment') && notification.fileId) {
      const link = `/admin/files/${notification.fileId}`;
      console.log('💬 Admin comment notification link:', link);
      return link;
    }

    // Handle all other notification types with admin-specific pages
    switch (notification.type) {
      case 'NEW_FILE_UPLOAD':
      case 'new_file_upload':
        // Check if fileId is in data field as fallback
        if (notification.data?.fileId) {
          const link = `/admin/files/${notification.data.fileId}`;
          console.log('📁 Admin file notification link (from data):', link);
          return link;
        }
        console.log('⚠️ File upload notification missing fileId');
        return '/admin/files';
        
      case 'low_stock_alert':
      case 'product_out_of_stock':
      case 'new_product_added':
      case 'product_back_in_stock':
      case 'price_drop':
        console.log('📦 Admin product notification link: /admin/products');
        return '/admin/products';
      
      case 'new_customer_registered':
      case 'customer_support_message':
        console.log('👥 Admin user notification link: /admin/users');
        return '/admin/users';
        
      case 'new_review_submitted':
        console.log('⭐ Admin review notification link: /admin/reviews');
        return '/admin/reviews';
        
      case 'payment_success':
      case 'payment_failed':
      case 'payment_pending':
      case 'refund_processed':
      case 'shipping_update':
        if (notification.data?.orderNumber) {
          const link = `/admin/orders?search=${notification.data.orderNumber}`;
          console.log('💳 Admin payment notification link:', link);
          return link;
        }
        console.log('💳 Generic admin payment notification link: /admin/orders');
        return '/admin/orders';
        
      case 'admin_login_new_device':
      case 'security_alert':
      case 'system_error':
      case 'license_key_api_failure':
      case 'maintenance_completed':
        console.log('🔒 Admin system notification link: /admin');
        return '/admin';
        
      default:
        console.log('🏠 Default admin notification link: /admin');
        return '/admin';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      console.log('🔔 Notification clicked:', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        data: notification.data,
        fileId: notification.fileId
      });

      // Mark as read if unread
      if (!notification.isRead) {
        console.log('📝 Marking notification as read...');
        await markAsRead(notification.id);
      }
      
      // Navigate to the appropriate page
      const link = getNotificationLink(notification);
      console.log('🔗 Generated link:', link);
      
      if (link) {
        console.log('🚀 Navigating to:', link);
        router.push(link);
      } else {
        console.log('⚠️ No link generated for notification');
      }
    } catch (error) {
      console.error('❌ Error handling notification click:', error);
    }
  };

  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      'new_order_received': 'New Orders',
      'NEW_ORDER_RECEIVED': 'New Orders',
      'order_status_update': 'Order Updates',
      'ORDER_STATUS_UPDATE': 'Order Updates',
      'payment_success': 'Payments',
      'payment_failed': 'Payment Issues',
      'payment_pending': 'Payment Pending',
      'NEW_FILE_UPLOAD': 'File Uploads',
      'new_file_upload': 'File Uploads',
      'NEW_CUSTOMER_COMMENT': 'Customer Comments',
      'new_customer_comment': 'Customer Comments',
      'low_stock_alert': 'Stock Alerts',
      'product_out_of_stock': 'Out of Stock',
      'new_customer_registered': 'New Customers',
      'new_review_submitted': 'Reviews',
      'customer_support_message': 'Support Messages',
      'security_alert': 'Security',
      'system_error': 'System Errors',
      'maintenance_completed': 'Maintenance',
      'promotional_offer': 'Promotions',
    };
    return typeMap[type] || type;
  };

  // Get notification statistics
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    high: notifications.filter(n => n.priority === 'high').length,
    orders: notifications.filter(n => ['new_order_received', 'order_status_update', 'payment_success'].includes(n.type)).length,
    security: notifications.filter(n => ['security_alert', 'system_error', 'admin_login_new_device'].includes(n.type)).length,
  };

  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="space-y-6">
          {/* Header with Stats */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Notifications</h1>
              <p className="text-muted-foreground">
                Manage system notifications and preferences
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={fetchNotifications}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/notifications/test', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ createTest: true })
                    });
                    if (response.ok) {
                      toast.success('Test notification created');
                      fetchNotifications();
                    }
                  } catch (error) {
                    console.error('Error creating test notification:', error);
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Test Notification
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/notifications/seed', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    if (response.ok) {
                      const data = await response.json();
                      toast.success(`Created ${data.count} sample notifications`);
                      fetchNotifications();
                      fetchUnreadCount();
                    }
                  } catch (error) {
                    console.error('Error seeding notifications:', error);
                    toast.error('Failed to seed notifications');
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Seed Notifications
              </Button>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read ({unreadCount})
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">notifications</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
                <p className="text-xs text-muted-foreground">need attention</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
                <p className="text-xs text-muted-foreground">urgent items</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.orders}</div>
                <p className="text-xs text-muted-foreground">order related</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security</CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.security}</div>
                <p className="text-xs text-muted-foreground">security alerts</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Admin Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search notifications..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="new_order_received">New Orders</SelectItem>
                          <SelectItem value="NEW_ORDER_RECEIVED">New Orders (Alt)</SelectItem>
                          <SelectItem value="NEW_FILE_UPLOAD">File Uploads</SelectItem>
                          <SelectItem value="NEW_CUSTOMER_COMMENT">Customer Comments</SelectItem>
                          <SelectItem value="payment_success">Payments</SelectItem>
                          <SelectItem value="security_alert">Security</SelectItem>
                          <SelectItem value="low_stock_alert">Stock Alerts</SelectItem>
                          <SelectItem value="new_customer_registered">New Customers</SelectItem>
                          <SelectItem value="system_error">System Errors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={readFilter} onValueChange={setReadFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Notifications</SelectItem>
                          <SelectItem value="unread">Unread Only</SelectItem>
                          <SelectItem value="read">Read Only</SelectItem>
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
                    <span>Admin Notifications</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {filteredNotifications.length} of {notifications.length} notifications
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    {loading ? (
                      <div className="p-6 text-center text-muted-foreground">
                        Loading notifications...
                      </div>
                    ) : filteredNotifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        {searchTerm || typeFilter !== "all" || priorityFilter !== "all" || readFilter !== "all" 
                          ? "No notifications match your filters" 
                          : notifications.length === 0 
                            ? "No notifications yet. Use the 'Seed Notifications' button to add sample data for testing."
                            : "No notifications match your filters"}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredNotifications.map((notification) => (
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
                                      <Badge variant="outline" className="text-xs">
                                        {getTypeDisplayName(notification.type)}
                                      </Badge>
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
                    Admin Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure how you receive admin notifications and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label className="text-base">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive admin alerts via email
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
                          <Label className="text-base">SMS Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Critical admin alerts via SMS
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

                    <h4 className="font-medium">Admin Alert Categories</h4>

                    <div className="space-y-4 pl-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm">Order Alerts</Label>
                            <p className="text-xs text-muted-foreground">
                              New orders, payment issues, fulfillment alerts
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
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm">Inventory Alerts</Label>
                            <p className="text-xs text-muted-foreground">
                              Low stock, out of stock, reorder alerts
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
                            <Label className="text-sm">Security Alerts</Label>
                            <p className="text-xs text-muted-foreground">
                              Failed logins, suspicious activity, security breaches
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
                            <Label className="text-sm">System Alerts</Label>
                            <p className="text-xs text-muted-foreground">
                              System errors, maintenance, performance issues
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
                      Save Admin Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}
