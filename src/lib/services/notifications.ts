import { prisma } from "@/lib/database/prisma";
import { MultiBotTelegramService, BotType } from "./multi-bot-telegram";

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  fileId?: string; // Add fileId field
  pushNotification?: boolean; // Add pushNotification field
  expiresAt?: Date;
}

export type NotificationType = 
  // Orders & Payments
  | 'new_order_received'
  | 'order_status_update'
  | 'order_confirmation'
  | 'payment_success'
  | 'payment_failed'
  | 'payment_pending'
  | 'refund_processed'
  | 'shipping_update'
  
  // Inventory & Product
  | 'low_stock_alert'
  | 'product_out_of_stock'
  | 'new_product_added'
  | 'product_back_in_stock'
  | 'price_drop'
  
  // Customer & Reviews
  | 'new_customer_registered'
  | 'new_review_submitted'
  | 'customer_support_message'
  | 'review_request'
  | 'abandoned_cart'
  
  // System & Security
  | 'admin_login_new_device'
  | 'system_error'
  | 'maintenance_completed'
  | 'security_alert'
  | 'license_key_api_failure'
  
  // General
  | 'promotional_offer'
  | 'account_update'
  | 'welcome'
  
  // Customer Notifications (File Tuning)
  | 'ORDER_PLACED'                    // Customer placed new order
  | 'PASSWORD_CHANGED'                // Customer changed password
  | 'FILE_RECEIVED'                   // File received by admin
  | 'FILE_IN_PROGRESS'                // File processing started
  | 'FILE_READY'                      // File ready for download
  | 'FILE_PRICE_SET'                  // Price set for file
  | 'FILE_PAYMENT_CONFIRMED'          // Payment confirmed for file
  | 'FILE_STATUS_UPDATE'              // Any file status change
  | 'FILE_ADMIN_COMMENT'              // Admin added comment to file
  
  // Admin Notifications (File Tuning)
  | 'NEW_ORDER_RECEIVED'              // New order placed by customer
  | 'NEW_CUSTOMER_COMMENT'            // New comment from customer
  | 'NEW_CUSTOMER_REVIEW'             // New product review
  | 'NEW_FILE_UPLOAD'                 // New file uploaded by customer
  | 'FILE_UPDATE_BY_ADMIN'            // Admin updated file
  | 'FILE_UPDATE_BY_CUSTOMER'         // Customer updated file
  | 'NEW_USER_REGISTRATION'           // New user registered
  | 'USER_ACCOUNT_UPDATE'             // User account updated
  | 'PAYMENT_RECEIVED'                // Payment received
  | 'SYSTEM_ALERT'                    // System alerts
  | 'INVENTORY_ALERT'                 // Inventory alerts
  | 'ORDER_STATUS_CHANGE'             // Order status changed
  | 'CUSTOMER_SUPPORT_REQUEST'        // Customer support request
  
  // Legacy File Tuning Types (for backward compatibility)
  | 'NEW_FILE_UPLOAD'
  | 'PRICE_SET'
  | 'PAYMENT_CONFIRMED';

export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      // Create notification record
      const notification = await prisma.tuningNotification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          fileId: data.fileId || null,
          isRead: false
        }
      });

      // Send email notification if user has email notifications enabled
      await this.sendEmailNotification(data);

      // Send push notification if user has push notifications enabled
      await this.sendPushNotification(data);

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendBulkNotification(
    userIds: string[],
    data: Omit<NotificationData, 'userId'>
  ): Promise<number> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: JSON.stringify(data.data || {}),
        expiresAt: data.expiresAt,
        isRead: false
      }));

      const result = await prisma.tuningNotification.createMany({
        data: notifications
      });

      // Send bulk email notifications
      await this.sendBulkEmailNotifications(userIds, data);

      return result.count;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return 0;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ) {
    try {
      const { page = 1, limit = 20, unreadOnly = false, type } = options;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      
      if (unreadOnly) {
        where.isRead = false;
      }
      
      if (type) {
        where.type = type;
      }

      const [notifications, total] = await Promise.all([
        prisma.tuningNotification.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.tuningNotification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.tuningNotification.update({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true
        }
      });

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.tuningNotification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.tuningNotification.delete({
        where: {
          id: notificationId,
          userId
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.tuningNotification.count({
        where: {
          userId,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Send order status update notification
   */
  static async sendOrderStatusUpdate(
    userId: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string
  ): Promise<boolean> {
    const statusMessages = {
      'CONFIRMED': 'Your order has been confirmed and is being processed.',
      'PROCESSING': 'Your order is being prepared for shipment.',
      'SHIPPED': 'Your order has been shipped!',
      'DELIVERED': 'Your order has been delivered.',
      'CANCELLED': 'Your order has been cancelled.',
      'REFUNDED': 'Your refund has been processed.'
    };

    const message = statusMessages[status as keyof typeof statusMessages] || 
      `Your order status has been updated to: ${status}`;

    return this.sendNotification({
      userId,
      type: 'order_status_update',
      title: `Order ${orderNumber} Status Update`,
      message,
      data: {
        orderNumber,
        status,
        trackingNumber
      },
    });
  }

  /**
   * Send order confirmation notification
   */
  static async sendOrderConfirmation(
    userId: string,
    orderNumber: string,
    total: number
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'order_confirmation',
      title: 'Order Confirmed!',
      message: `Thank you for your order! Your order #${orderNumber} has been confirmed and will be processed soon.`,
      data: {
        orderNumber,
        total
      },
    });
  }

  /**
   * Send payment success notification
   */
  static async sendPaymentSuccess(
    userId: string,
    orderNumber: string,
    amount: number
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your payment of $${amount} for order #${orderNumber} has been processed successfully.`,
      data: {
        orderNumber,
        amount
      },
    });
  }

  /**
   * Send payment failed notification
   */
  static async sendPaymentFailed(
    userId: string,
    orderNumber: string,
    reason: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment for order #${orderNumber} failed. Reason: ${reason}`,
      data: {
        orderNumber,
        reason
      },
    });
  }

  /**
   * Send product back in stock notification
   */
  static async sendProductBackInStock(
    userId: string,
    productName: string,
    productId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'product_back_in_stock',
      title: 'Product Back in Stock!',
      message: `${productName} is back in stock and available for purchase.`,
      data: {
        productId,
        productName
      },
    });
  }

  /**
   * Send price drop notification
   */
  static async sendPriceDrop(
    userId: string,
    productName: string,
    productId: string,
    oldPrice: number,
    newPrice: number
  ): Promise<boolean> {
    const savings = oldPrice - newPrice;
    const savingsPercent = ((savings / oldPrice) * 100).toFixed(0);

    return this.sendNotification({
      userId,
      type: 'price_drop',
      title: 'Price Drop Alert!',
      message: `${productName} price dropped by ${savingsPercent}%! Save $${savings.toFixed(2)}.`,
      data: {
        productId,
        productName,
        oldPrice,
        newPrice,
        savings
      },
    });
  }

  /**
   * Send abandoned cart reminder
   */
  static async sendAbandonedCartReminder(
    userId: string,
    cartItems: Array<{ name: string; price: number }>
  ): Promise<boolean> {
    const itemCount = cartItems.length;
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);

    return this.sendNotification({
      userId,
      type: 'abandoned_cart',
      title: 'Complete Your Purchase',
      message: `You have ${itemCount} item(s) in your cart worth $${total.toFixed(2)}. Complete your purchase before they're gone!`,
      data: {
        itemCount,
        total
      },
    });
  }

  /**
   * Send review request notification
   */
  static async sendReviewRequest(
    userId: string,
    orderNumber: string,
    productName: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'review_request',
      title: 'How was your purchase?',
      message: `We'd love to hear about your experience with ${productName} from order #${orderNumber}.`,
      data: {
        orderNumber,
        productName
      },
    });
  }

  /**
   * Send promotional offer notification
   */
  static async sendPromotionalOffer(
    userId: string,
    offerTitle: string,
    offerDescription: string,
    discountCode?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'promotional_offer',
      title: offerTitle,
      message: offerDescription,
      data: {
        discountCode
      },
    });
  }

  // === ORDERS & PAYMENTS NOTIFICATIONS ===

  /**
   * Send new order received notification (for admins)
   */
  static async sendNewOrderReceived(
    adminUserId: string,
    orderNumber: string,
    customerName: string,
    productName: string,
    total: number,
    paymentStatus: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'new_order_received',
      title: 'New Order Received',
      message: `Order #${orderNumber} from ${customerName} for ${productName} - $${total.toFixed(2)} (${paymentStatus})`,
      data: {
        orderNumber,
        customerName,
        productName,
        total,
        paymentStatus
      },
    });
  }

  /**
   * Send payment pending notification
   */
  static async sendPaymentPending(
    userId: string,
    orderNumber: string,
    amount: number,
    reason?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'payment_pending',
      title: 'Payment Pending',
      message: `Your payment of $${amount.toFixed(2)} for order #${orderNumber} is pending confirmation.${reason ? ` Reason: ${reason}` : ''}`,
      data: {
        orderNumber,
        amount,
        reason
      },
    });
  }

  // === INVENTORY & PRODUCT NOTIFICATIONS ===

  /**
   * Send low stock alert notification (for admins)
   */
  static async sendLowStockAlert(
    adminUserId: string,
    productName: string,
    productId: string,
    currentStock: number,
    threshold: number
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'low_stock_alert',
      title: 'Low Stock Alert',
      message: `${productName} is running low on stock. Current: ${currentStock}, Threshold: ${threshold}`,
      data: {
        productId,
        productName,
        currentStock,
        threshold
      },
    });
  }

  /**
   * Send product out of stock notification (for admins)
   */
  static async sendProductOutOfStock(
    adminUserId: string,
    productName: string,
    productId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'product_out_of_stock',
      title: 'Product Out of Stock',
      message: `${productName} is now out of stock and unavailable for purchase.`,
      data: {
        productId,
        productName
      },
    });
  }

  /**
   * Send new product added notification (for admins)
   */
  static async sendNewProductAdded(
    adminUserId: string,
    productName: string,
    productId: string,
    addedBy: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'new_product_added',
      title: 'New Product Added',
      message: `${productName} has been added to the catalog by ${addedBy}.`,
      data: {
        productId,
        productName,
        addedBy
      },
    });
  }

  // === CUSTOMER & REVIEWS NOTIFICATIONS ===

  /**
   * Send new customer registered notification (for admins)
   */
  static async sendNewCustomerRegistered(
    adminUserId: string,
    customerName: string,
    customerEmail: string,
    customerId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'new_customer_registered',
      title: 'New Customer Registered',
      message: `${customerName} (${customerEmail}) has registered and may need manual verification.`,
      data: {
        customerId,
        customerName,
        customerEmail
      },
    });
  }

  /**
   * Send new review submitted notification (for admins)
   */
  static async sendNewReviewSubmitted(
    adminUserId: string,
    productName: string,
    customerName: string,
    rating: number,
    reviewId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'new_review_submitted',
      title: 'New Product Review',
      message: `${customerName} submitted a ${rating}-star review for ${productName}. Review pending approval.`,
      data: {
        reviewId,
        productName,
        customerName,
        rating
      },
    });
  }

  /**
   * Send customer support message notification (for admins)
   */
  static async sendCustomerSupportMessage(
    adminUserId: string,
    customerName: string,
    customerEmail: string,
    subject: string,
    messageId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'customer_support_message',
      title: 'New Support Message',
      message: `${customerName} (${customerEmail}) sent a support message: "${subject}". Reply promptly.`,
      data: {
        messageId,
        customerName,
        customerEmail,
        subject
      },
    });
  }

  // === SYSTEM & SECURITY NOTIFICATIONS ===

  /**
   * Send admin login from new device notification
   */
  static async sendAdminLoginNewDevice(
    adminUserId: string,
    deviceInfo: string,
    ipAddress: string,
    location?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'admin_login_new_device',
      title: 'Admin Login from New Device',
      message: `Admin login detected from new device: ${deviceInfo} (IP: ${ipAddress}${location ? `, ${location}` : ''})`,
      data: {
        deviceInfo,
        ipAddress,
        location
      },
    });
  }

  /**
   * Send system error notification (for admins)
   */
  static async sendSystemError(
    adminUserId: string,
    errorType: string,
    errorMessage: string,
    errorDetails?: Record<string, any>
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'system_error',
      title: 'System Error Detected',
      message: `${errorType}: ${errorMessage}`,
      data: {
        errorType,
        errorMessage,
        errorDetails,
        timestamp: new Date().toISOString()
      },
    });
  }

  /**
   * Send license key API failure notification (for admins)
   */
  static async sendLicenseKeyAPIFailure(
    adminUserId: string,
    operation: string,
    productName: string,
    errorMessage: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'license_key_api_failure',
      title: 'License Key API Failure',
      message: `License key ${operation} failed for ${productName}: ${errorMessage}`,
      data: {
        operation,
        productName,
        errorMessage,
        timestamp: new Date().toISOString()
      },
    });
  }

  /**
   * Send maintenance completed notification (for admins)
   */
  static async sendMaintenanceCompleted(
    adminUserId: string,
    maintenanceType: string,
    duration: string,
    summary?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: adminUserId,
      type: 'maintenance_completed',
      title: 'Maintenance Completed',
      message: `${maintenanceType} maintenance completed successfully. Duration: ${duration}${summary ? `. ${summary}` : ''}`,
      data: {
        maintenanceType,
        duration,
        summary,
        completedAt: new Date().toISOString()
      },
    });
  }

  /**
   * Send virtual order completed notification
   */
  static async sendVirtualOrderCompleted(orderId: string, orderNumber: string): Promise<void> {
    await this.sendToAllAdmins({
      type: 'order_status_update',
      title: 'Virtual Order Auto-Completed',
      message: `Order #${orderNumber} has been automatically marked as DELIVERED because all products are virtual/digital.`,
      data: { 
        orderId, 
        orderNumber, 
        autoCompleted: true 
      },
    });
  }

  // === BULK NOTIFICATION HELPERS ===

  /**
   * Send notification to all admins
   */
  static async sendToAllAdmins(
    data: Omit<NotificationData, 'userId'>
  ): Promise<number> {
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        },
        select: { id: true }
      });

      const adminIds = adminUsers.map(user => user.id);
      return this.sendBulkNotification(adminIds, data);
    } catch (error) {
      console.error('Error sending notification to all admins:', error);
      return 0;
    }
  }

  /**
   * Send email notification (placeholder for email service integration)
   */
  private static async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      // Get user email preferences
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, newsletter: true }
      });

      if (!user || !user.newsletter) {
        return;
      }

      // Here you would integrate with your email service (Resend, SendGrid, etc.)
      console.log(`Sending email notification to ${user.email}:`, {
        subject: data.title,
        message: data.message,
        type: data.type
      });

      // Example with Resend:
      // await resend.emails.send({
      //   from: 'noreply@yourstore.com',
      //   to: user.email,
      //   subject: data.title,
      //   html: generateEmailTemplate(data)
      // });

    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Send bulk email notifications
   */
  private static async sendBulkEmailNotifications(
    userIds: string[],
    data: Omit<NotificationData, 'userId'>
  ): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          newsletter: true
        },
        select: { email: true }
      });

      const emails = users.map(user => user.email);

      if (emails.length === 0) {
        return;
      }

      // Here you would integrate with your email service for bulk sending
      console.log(`Sending bulk email notifications to ${emails.length} users:`, {
        subject: data.title,
        message: data.message,
        type: data.type
      });

    } catch (error) {
      console.error('Error sending bulk email notifications:', error);
    }
  }

  /**
   * Send notifications to multiple users
   */
  static async sendBulkNotifications(userIds: string[], notificationData: Omit<NotificationData, 'userId'>): Promise<boolean> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        fileId: notificationData.fileId || null,
        data: notificationData.data ? JSON.stringify(notificationData.data) : null, // Store as JSON string
        isRead: false
      }));

      await prisma.tuningNotification.createMany({
        data: notifications
      });

      // Send push notifications (if enabled)
      if (notificationData.pushNotification) {
        for (const userId of userIds) {
          await this.sendPushNotification({
            ...notificationData,
            userId
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return false;
    }
  }

  /**
   * Send push notification (placeholder for push notification service integration)
   */
  private static async sendPushNotification(data: NotificationData): Promise<void> {
    try {
      // Here you would integrate with your push notification service
      // (Firebase Cloud Messaging, OneSignal, etc.)
      console.log(`Sending push notification to user ${data.userId}:`, {
        title: data.title,
        message: data.message,
        type: data.type
      });

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // ==================== CUSTOMER NOTIFICATIONS ====================

  /**
   * Notify customer when they place a new order
   */
  static async notifyCustomerOrderPlaced(userId: string, orderNumber: string, total: number): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'ORDER_PLACED',
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} has been placed successfully. Total: ${total} DA`,
      data: {
        orderNumber,
        total,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify customer when they change their password
   */
  static async notifyCustomerPasswordChanged(userId: string): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'PASSWORD_CHANGED',
      title: 'Password Changed',
      message: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
      data: {
        timestamp: new Date().toISOString(),
        securityAlert: true
      }
    });
  }

  /**
   * Notify customer when their file is received by admin
   */
  static async notifyCustomerFileReceived(userId: string, fileName: string, fileId: string): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'FILE_RECEIVED',
      title: 'File Received',
      message: `Your file "${fileName}" has been received and is being processed.`,
      data: {
        fileName,
        fileId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify customer when their file processing starts
   */
  static async notifyCustomerFileInProgress(userId: string, fileName: string, fileId: string, estimatedTime?: number): Promise<boolean> {
    const timeMessage = estimatedTime 
      ? `Your file "${fileName}" is now being processed. Estimated completion time: ${estimatedTime} minutes.`
      : `Your file "${fileName}" is now being processed. You will be notified when it's ready.`;
    
    return this.sendNotification({
      userId,
      type: 'FILE_IN_PROGRESS',
      title: 'File Processing Started',
      message: timeMessage,
      fileId
    });
  }

  /**
   * Notify customer when their file is ready for download
   */
  static async notifyCustomerFileReady(userId: string, fileName: string, fileId: string): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'FILE_READY',
      title: 'File Ready for Download',
      message: `Your file "${fileName}" is ready for download!`,
      data: {
        fileName,
        fileId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify customer when price is set for their file
   */
  static async notifyCustomerFilePriceSet(userId: string, fileName: string, price: number, fileId: string): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'FILE_PRICE_SET',
      title: 'Price Set for Your File',
      message: `Price has been set for your file "${fileName}": ${price} DA`,
      data: {
        fileName,
        price,
        fileId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify customer when payment is confirmed for their file
   */
  static async notifyCustomerFilePaymentConfirmed(userId: string, fileName: string, fileId: string): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'FILE_PAYMENT_CONFIRMED',
      title: 'Payment Confirmed',
      message: `Payment confirmed for your file "${fileName}". Processing will begin shortly.`,
      data: {
        fileName,
        fileId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify customer when admin adds a comment to their file
   */
  static async notifyCustomerFileAdminComment(userId: string, fileName: string, comment: string, fileId: string): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'FILE_ADMIN_COMMENT',
      title: 'Admin Comment Added',
      message: `Admin has added a comment to your file "${fileName}": ${comment}`,
      data: {
        fileName,
        comment,
        fileId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // ==================== ADMIN NOTIFICATIONS ====================

  /**
   * Notify admin when a new order is placed
   */
  static async notifyAdminNewOrder(orderNumber: string, customerName: string, total: number, customerId: string, items?: Array<{name: string; quantity: number; price: number}>): Promise<boolean> {
    console.log('🔔 NotificationService.notifyAdminNewOrder called with:', {
      orderNumber,
      customerName,
      total,
      customerId,
      itemsCount: items?.length || 0
    });

    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true }
      });

      console.log('👥 Found admin users:', admins.length);

      if (admins.length === 0) {
        console.log('⚠️ No admin users found - cannot send notifications');
        return false;
      }

      const adminIds = admins.map(admin => admin.id);
      
      // Create detailed message with items
      let itemsText = '';
      if (items && items.length > 0) {
        itemsText = '\n\n📦 Items:\n' + items.map(item => 
          `• ${item.name} (x${item.quantity}) - ${item.price * item.quantity} DA`
        ).join('\n');
      }
      
      // Send database notifications
      console.log('📊 Sending database notifications to admin IDs:', adminIds);
      const dbResult = await this.sendBulkNotifications(adminIds, {
        type: 'NEW_ORDER_RECEIVED',
        title: 'New Order Received',
        message: `New order #${orderNumber} from ${customerName} for ${total} DA${itemsText}`,
        data: {
          orderNumber,
          customerName,
          customerId,
          total,
          items: items || [],
          timestamp: new Date().toISOString()
        }
      });

      console.log('📊 Database notifications result:', dbResult);

      // Send Super Admin notification for comprehensive system overview
      console.log('📱 Sending Telegram Super Admin notification...');
      try {
        // Create items summary for Telegram
        let telegramItemsText = '';
        if (items && items.length > 0) {
          telegramItemsText = '\n\n📦 <b>Items:</b>\n' + items.map(item => 
            `• ${item.name} (x${item.quantity}) - ${item.price * item.quantity} DA`
          ).join('\n');
        }

        await MultiBotTelegramService.notifySuperAdmin({
          type: 'new_order',
          title: 'New Order Received',
          message: `Order #${orderNumber} from ${customerName} for ${total} DA${telegramItemsText}`,
          details: `Customer: ${customerName} (ID: ${customerId})`,
          actionUrl: `${process.env.NEXTAUTH_URL}/admin/orders`
        });
        console.log('✅ Telegram Super Admin notification sent successfully');
      } catch (telegramError) {
        console.error('❌ Error sending Telegram notification:', telegramError);
        // Continue with database notifications even if Telegram fails
      }

      return dbResult;
    } catch (error) {
      console.error('💥 Error in notifyAdminNewOrder:', error);
      throw error;
    }
  }

  /**
   * Notify admin when a new customer comment is added
   */
  static async notifyAdminNewCustomerComment(customerName: string, comment: string, fileId: string, customerId: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'NEW_CUSTOMER_COMMENT',
      title: 'New Customer Comment',
      message: `${customerName} added a comment: "${comment}"`,
      fileId: fileId, // Add fileId at top level for navigation
      data: {
        customerName,
        comment,
        fileId,
        customerId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin when a new customer review is submitted
   */
  static async notifyAdminNewCustomerReview(customerName: string, productName: string, rating: number, reviewId: string, customerId: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'NEW_CUSTOMER_REVIEW',
      title: 'New Product Review',
      message: `${customerName} reviewed "${productName}" with ${rating} stars`,
      data: {
        customerName,
        productName,
        rating,
        reviewId,
        customerId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin when a new file is uploaded
   */
  static async notifyAdminNewFileUpload(customerName: string, fileName: string, fileId: string, customerId: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    // Send database notifications
    const dbResult = await this.sendBulkNotifications(adminIds, {
      type: 'NEW_FILE_UPLOAD',
      title: 'New File Uploaded',
      message: `${customerName} uploaded a new file: "${fileName}"`,
      fileId: fileId, // Add fileId at top level for navigation
      data: {
        customerName,
        fileName,
        fileId,
        customerId,
        timestamp: new Date().toISOString()
      }
    });

    // Send Telegram notification
    await MultiBotTelegramService.notifyFileAdminNewUpload({
      fileId,
      filename: fileName,
      customerName,
      fileSize: 0, // You might want to pass actual file size
      modifications: [] // You might want to pass actual modifications
    });

    return dbResult;
  }

  /**
   * Notify admin when a new file is uploaded with full details (for urgent notifications)
   */
  static async notifyAdminNewFileUploadWithDetails(
    customerName: string, 
    fileName: string, 
    fileId: string, 
    customerId: string,
    fileSize: number,
    modifications: string[]
  ): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    // Send database notifications
    const dbResult = await this.sendBulkNotifications(adminIds, {
      type: 'NEW_FILE_UPLOAD',
      title: 'New File Uploaded',
      message: `${customerName} uploaded a new file: "${fileName}"`,
      fileId: fileId, // Add fileId at top level for navigation
      data: {
        customerName,
        fileName,
        fileId,
        customerId,
        fileSize,
        modifications,
        timestamp: new Date().toISOString()
      }
    });

    // Send Super Admin notification for comprehensive system overview
    console.log('📱 Sending Super Admin notification for file upload:', {
      fileId,
      filename: fileName,
      customerName,
      fileSize: (fileSize / 1024 / 1024).toFixed(2) + ' MB'
    });
    
    await MultiBotTelegramService.notifySuperAdmin({
      type: 'new_file_upload',
      title: 'File Upload - Received',
      message: `${customerName} uploaded a new file: "${fileName}"`,
      details: `File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB\nModifications: ${modifications.join(', ')}`,
      actionUrl: `${process.env.NEXTAUTH_URL}/admin/files/${fileId}`,
      fileId: fileId,
      filename: fileName,
      customerName: customerName,
      modifications: modifications,
      status: 'RECEIVED',
      estimatedTime: 'Not set'
    });
    
    console.log('✅ Super Admin notification sent');

    // Check if Super Admin and File Admin bots are the same (to prevent duplicate notifications)
    const superAdminToken = process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN;
    const fileAdminToken = process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN;
    const superAdminChatId = process.env.TELEGRAM_SUPER_ADMIN_CHAT_ID;
    const fileAdminChatId = process.env.TELEGRAM_FILE_ADMIN_CHAT_ID;
    
    const isSameBot = superAdminToken === fileAdminToken && superAdminChatId === fileAdminChatId;
    
    console.log('🔍 Checking for duplicate bot configuration:', {
      isSameBot,
      superAdminEnabled: process.env.TELEGRAM_SUPER_ADMIN_ENABLED === 'true',
      fileAdminEnabled: process.env.TELEGRAM_FILE_ADMIN_ENABLED === 'true',
      hasSuperAdminToken: !!superAdminToken,
      hasFileAdminToken: !!fileAdminToken
    });

    // Only send File Admin notification if it's a different bot/chat to avoid duplicates
    if (!isSameBot) {
      console.log('📱 Sending separate File Admin notification (different bot configuration)');
      await MultiBotTelegramService.notifyFileAdminNewUpload({
        fileId,
        filename: fileName,
        customerName,
        fileSize,
        modifications
      });
      console.log('✅ File Admin notification sent');
    } else {
      console.log('⚠️ Skipping File Admin notification (same as Super Admin to prevent duplicates)');
    }

    return dbResult;
  }

  /**
   * Notify admin when a new user registers
   */
  static async notifyAdminNewUserRegistration(userName: string, userEmail: string, userId: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'NEW_USER_REGISTRATION',
      title: 'New User Registration',
      message: `New user registered: ${userName} (${userEmail})`,
      data: {
        userName,
        userEmail,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin when file is updated by admin
   */
  static async notifyAdminFileUpdateByAdmin(adminName: string, fileName: string, updateType: string, fileId: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'FILE_UPDATE_BY_ADMIN',
      title: 'File Updated by Admin',
      message: `${adminName} updated file "${fileName}": ${updateType}`,
      data: {
        adminName,
        fileName,
        updateType,
        fileId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin when file is updated by customer
   */
  static async notifyAdminFileUpdateByCustomer(customerName: string, fileName: string, updateType: string, fileId: string, customerId: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'FILE_UPDATE_BY_CUSTOMER',
      title: 'File Updated by Customer',
      message: `${customerName} updated file "${fileName}": ${updateType}`,
      data: {
        customerName,
        fileName,
        updateType,
        fileId,
        customerId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin when payment is received
   */
  static async notifyAdminPaymentReceived(customerName: string, amount: number, orderNumber: string, customerId: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `Payment of ${amount} DA received from ${customerName} for order #${orderNumber}`,
      data: {
        customerName,
        amount,
        orderNumber,
        customerId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin about system alerts
   */
  static async notifyAdminSystemAlert(alertType: string, message: string, severity: 'low' | 'medium' | 'high' = 'medium'): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'SYSTEM_ALERT',
      title: `System Alert: ${alertType}`,
      message: message,
      data: {
        alertType,
        severity,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin about inventory alerts
   */
  static async notifyAdminInventoryAlert(productName: string, currentStock: number, threshold: number): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'INVENTORY_ALERT',
      title: 'Inventory Alert',
      message: `Product "${productName}" is low on stock. Current: ${currentStock}, Threshold: ${threshold}`,
      data: {
        productName,
        currentStock,
        threshold,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin about order status changes
   */
  static async notifyAdminOrderStatusChange(orderNumber: string, oldStatus: string, newStatus: string, customerName: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'ORDER_STATUS_CHANGE',
      title: 'Order Status Changed',
      message: `Order #${orderNumber} status changed from ${oldStatus} to ${newStatus} for ${customerName}`,
      data: {
        orderNumber,
        oldStatus,
        newStatus,
        customerName,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify admin about customer support requests
   */
  static async notifyAdminCustomerSupportRequest(customerName: string, subject: string, message: string, customerId: string): Promise<boolean> {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (admins.length === 0) return false;

    const adminIds = admins.map(admin => admin.id);
    
    return this.sendBulkNotifications(adminIds, {
      type: 'CUSTOMER_SUPPORT_REQUEST',
      title: 'New Support Request',
      message: `${customerName} submitted a support request: "${subject}"`,
      data: {
        customerName,
        subject,
        message,
        customerId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify customer when file status is updated
   */
  static async notifyCustomerFileStatusUpdate(userId: string, fileName: string, fileId: string, newStatus: string): Promise<boolean> {
    const statusMessages = {
      'PENDING': 'Your file has been received and is pending processing.',
      'READY': 'Your file is ready for download.',
      'IN_PROGRESS': 'Your file is currently being processed.',
      'CANCELLED': 'Your file processing has been cancelled.'
    };

    const message = statusMessages[newStatus as keyof typeof statusMessages] || 
                   `Your file status has been updated to ${newStatus}.`;

    // Send database notification
    const dbResult = await this.sendNotification({
      userId,
      type: 'FILE_STATUS_UPDATE',
      title: 'File Status Updated',
      message: `"${fileName}" - ${message}`,
      fileId,
      data: {
        fileName,
        fileId,
        newStatus,
        timestamp: new Date().toISOString()
      }
    });

    // TODO: Send Customer bot notification when customer Telegram integration is implemented
    // This would require adding telegramChatId field to User model and customer bot registration

    return dbResult;
  }

  /**
   * Notify customer when estimated time is set
   */
  static async notifyCustomerEstimatedTime(userId: string, fileName: string, fileId: string, estimatedMinutes: number): Promise<boolean> {
    const timeText = estimatedMinutes === 1440 ? '1 day' : 
                     estimatedMinutes === 240 ? '4 hours' :
                     estimatedMinutes === 120 ? '2 hours' :
                     estimatedMinutes === 60 ? '1 hour' :
                     estimatedMinutes === 45 ? '45 minutes' :
                     estimatedMinutes === 30 ? '30 minutes' :
                     estimatedMinutes === 20 ? '20 minutes' :
                     estimatedMinutes === 15 ? '15 minutes' :
                     estimatedMinutes === 10 ? '10 minutes' :
                     estimatedMinutes === 5 ? '5 minutes' :
                     `${estimatedMinutes} minutes`;

    // Send database notification
    const dbResult = await this.sendNotification({
      userId,
      type: 'FILE_STATUS_UPDATE',
      title: 'Estimated Time Set',
      message: `Your file "${fileName}" is now being processed. Estimated completion time: ${timeText}.`,
      fileId,
      data: {
        fileName,
        fileId,
        estimatedMinutes,
        timeText,
        timestamp: new Date().toISOString()
      }
    });

    // TODO: Send Customer bot notification when customer Telegram integration is implemented
    // This would require adding telegramChatId field to User model and customer bot registration

    return dbResult;
  }

  /**
   * Notify customer when order is confirmed
   */
  static async notifyCustomerOrderConfirmation(userId: string, orderId: string, totalAmount: number, itemsCount: number): Promise<boolean> {
    // Send database notification
    const dbResult = await this.sendNotification({
      userId,
      type: 'order_confirmation',
      title: 'Order Confirmed!',
      message: `Your order #${orderId} has been confirmed and will be processed soon.`,
      data: {
        orderId,
        totalAmount,
        itemsCount,
        timestamp: new Date().toISOString()
      }
    });

    // TODO: Send Customer bot notification when customer Telegram integration is implemented
    // This would require adding telegramChatId field to User model and customer bot registration

    return dbResult;
  }
}
