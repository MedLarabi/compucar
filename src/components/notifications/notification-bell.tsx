"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, X, FileText, DollarSign, CreditCard, CheckCircle, ShoppingCart, Package, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TuningNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  fileId?: string;
  createdAt: string;
  file?: {
    id: string;
    originalFilename: string;
  };
  data?: {
    orderNumber?: string;
    customerId?: string;
    items?: Array<{name: string; quantity: number; price: number}>;
    [key: string]: any;
  };
}

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<TuningNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      
      // Set up polling for new notifications (every 30 seconds)
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: TuningNotification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: TuningNotification) => {
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
      
      // Close the popover
      setOpen(false);
      
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

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FILE_READY':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PRICE_SET':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'PAYMENT_CONFIRMED':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'NEW_FILE_UPLOAD':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'NEW_ORDER_RECEIVED':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'ORDER_STATUS_UPDATE':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'NEW_CUSTOMER_COMMENT':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: TuningNotification) => {
    console.log('🔍 Getting notification link for:', {
      type: notification.type,
      fileId: notification.fileId,
      data: notification.data,
      isAdmin: session?.user?.isAdmin
    });

    // Handle file-related notifications
    if (notification.fileId) {
      const link = session?.user?.isAdmin 
        ? `/admin/files/${notification.fileId}` 
        : `/files/${notification.fileId}`;
      console.log('📁 File notification link:', link);
      return link;
    }
    
    // Handle order-related notifications
    if (notification.type === 'NEW_ORDER_RECEIVED' && notification.data?.orderNumber) {
      if (session?.user?.isAdmin) {
        const link = `/admin/orders?search=${notification.data.orderNumber}`;
        console.log('🛒 Order notification link:', link);
        return link;
      } else {
        // For customers, go to a general orders page or account page
        const link = `/account/orders`;
        console.log('🛒 Customer order notification link:', link);
        return link;
      }
    }
    
    // Handle order status updates
    if (notification.type === 'ORDER_STATUS_UPDATE' && notification.data?.orderNumber) {
      if (session?.user?.isAdmin) {
        const link = `/admin/orders?search=${notification.data.orderNumber}`;
        console.log('📦 Order status notification link:', link);
        return link;
      } else {
        // For customers, go to orders page
        const link = `/account/orders`;
        console.log('📦 Customer order status notification link:', link);
        return link;
      }
    }
    
    // Handle customer comments
    if (notification.type === 'NEW_CUSTOMER_COMMENT' && notification.fileId) {
      if (session?.user?.isAdmin) {
        const link = `/admin/files/${notification.fileId}`;
        console.log('💬 Comment notification link:', link);
        return link;
      }
      console.log('⚠️ Customer comment notifications not accessible to customers');
      return null;
    }
    
    // Default fallback
    if (session?.user?.isAdmin) {
      // For admin, default to admin dashboard
      console.log('🏠 Default admin link: /admin');
      return '/admin';
    } else {
      // For customers, default to account dashboard
      console.log('🏠 Default customer link: /account');
      return '/account';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  if (!session?.user?.id) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <CardDescription>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </CardDescription>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-0">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            {notification.file && (
                              <p className="text-xs text-blue-600 mt-1 truncate">
                                File: {notification.file.originalFilename}
                              </p>
                            )}
                            {notification.data?.orderNumber && (
                              <p className="text-xs text-green-600 mt-1 truncate">
                                Order: #{notification.data.orderNumber}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

// Hook for accessing notifications in other components
export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<TuningNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchNotifications = async () => {
        try {
          const response = await fetch('/api/notifications');
          const data = await response.json();

          if (data.success) {
            setNotifications(data.data);
            setUnreadCount(data.data.filter((n: TuningNotification) => !n.isRead).length);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return { notifications, unreadCount };
}