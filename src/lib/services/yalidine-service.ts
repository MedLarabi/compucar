import { prisma } from "@/lib/database/prisma";
import { NotificationService } from "./notifications";

// Yalidine API configuration
const YALIDINE_API_BASE = process.env.YALIDINE_API_URL || 'https://api.yalidine.app/v1';
const YALIDINE_API_TOKEN = process.env.YALIDINE_API_TOKEN;

// Yalidine webhook event types
export type YalidineEventType = 
  | 'parcel.created'
  | 'parcel.picked_up'
  | 'parcel.in_transit'
  | 'parcel.out_for_delivery'
  | 'parcel.delivered'
  | 'parcel.returned'
  | 'parcel.failed_delivery'
  | 'parcel.cancelled';

// Yalidine parcel status mapping to our order status
const YALIDINE_STATUS_MAP: Record<string, string> = {
  'pending': 'PENDING',
  'picked_up': 'SHIPPED',
  'in_transit': 'SHIPPED',
  'out_for_delivery': 'SHIPPED',
  'delivered': 'DELIVERED',
  'returned': 'RETURNED',
  'failed_delivery': 'FAILED',
  'cancelled': 'CANCELLED'
};

export interface YalidineParcel {
  id: string;
  tracking_number: string;
  status: string;
  order_id: string;
  recipient: {
    name: string;
    phone: string;
    address: string;
    commune: string;
    wilaya: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  cash_on_delivery: number;
  shipping_cost: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  notes?: string;
}

export interface YalidineWebhookPayload {
  event: YalidineEventType;
  parcel: YalidineParcel;
  timestamp: string;
  signature?: string;
}

export class YalidineService {
  
  /**
   * Create a parcel in Yalidine system
   */
  static async createParcel(orderData: {
    orderId: string;
    orderNumber: string;
    recipient: {
      name: string;
      phone: string;
      address: string;
      commune: string;
      wilaya: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    cashOnDelivery: number;
    shippingCost?: number;
  }): Promise<{ success: boolean; trackingNumber?: string; error?: string }> {
    
    try {
      console.log('Creating Yalidine parcel for order:', orderData.orderId);

      const parcelData = {
        order_id: orderData.orderNumber,
        recipient: orderData.recipient,
        items: orderData.items,
        cash_on_delivery: orderData.cashOnDelivery,
        shipping_cost: orderData.shippingCost || 0,
        total_amount: orderData.cashOnDelivery + (orderData.shippingCost || 0)
      };

      if (!YALIDINE_API_TOKEN) {
        console.warn('Yalidine API token not configured, simulating parcel creation');
        const mockTrackingNumber = `YLD${Date.now()}`;
        
        // Update order with tracking number
        await prisma.order.update({
          where: { id: orderData.orderId },
          data: { 
            trackingNumber: mockTrackingNumber,
            status: 'SHIPPED',
            shippedAt: new Date()
          }
        });

        return { 
          success: true, 
          trackingNumber: mockTrackingNumber 
        };
      }

      const response = await fetch(`${YALIDINE_API_BASE}/parcels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${YALIDINE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(parcelData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Yalidine API error:', errorData);
        return { 
          success: false, 
          error: errorData.message || 'Failed to create parcel' 
        };
      }

      const result = await response.json();
      const trackingNumber = result.tracking_number;

      // Update order with tracking number
      await prisma.order.update({
        where: { id: orderData.orderId },
        data: { 
          trackingNumber,
          status: 'SHIPPED',
          shippedAt: new Date()
        }
      });

      console.log('Yalidine parcel created successfully:', trackingNumber);
      return { success: true, trackingNumber };

    } catch (error) {
      console.error('Error creating Yalidine parcel:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Handle Yalidine webhook events
   */
  static async handleWebhook(payload: YalidineWebhookPayload): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('Processing Yalidine webhook:', payload.event, payload.parcel.tracking_number);

      const { event, parcel } = payload;
      
      // Find order by tracking number
      const order = await prisma.order.findFirst({
        where: { trackingNumber: parcel.tracking_number },
        include: { 
          user: true,
          items: {
            include: { product: true }
          }
        }
      });

      if (!order) {
        console.warn('Order not found for tracking number:', parcel.tracking_number);
        return { success: false, error: 'Order not found' };
      }

      // Update order status based on parcel status
      const newStatus = YALIDINE_STATUS_MAP[parcel.status] || order.status;
      const updateData: any = { status: newStatus };

      // Set delivery date if delivered
      if (parcel.status === 'delivered' && parcel.delivered_at) {
        updateData.deliveredAt = new Date(parcel.delivered_at);
      }

      // Update estimated delivery for out_for_delivery status
      if (parcel.status === 'out_for_delivery' && !order.estimatedDelivery) {
        // Estimate delivery in next 24 hours
        updateData.estimatedDelivery = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: updateData
      });

      // Send notification to customer if user exists
      if (order.user) {
        await this.sendDeliveryNotification(order.user.id, event, parcel, order.orderNumber);
      }

      // Send notification to admins for important status changes
      if (['delivered', 'returned', 'failed_delivery'].includes(parcel.status)) {
        await this.sendAdminDeliveryNotification(event, parcel, order.orderNumber);
      }

      console.log('Order updated successfully:', order.id, newStatus);
      return { 
        success: true, 
        message: `Order ${order.orderNumber} updated to ${newStatus}` 
      };

    } catch (error) {
      console.error('Error processing Yalidine webhook:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send delivery notification to customer
   */
  private static async sendDeliveryNotification(
    userId: string, 
    event: YalidineEventType, 
    parcel: YalidineParcel,
    orderNumber: string
  ) {
    const notificationMap: Record<YalidineEventType, { title: string; message: string }> = {
      'parcel.created': {
        title: '📦 Shipment Created',
        message: `Your order #${orderNumber} has been prepared for shipment. Tracking: ${parcel.tracking_number}`
      },
      'parcel.picked_up': {
        title: '🚚 Package Picked Up',
        message: `Your order #${orderNumber} has been picked up by our delivery partner. Tracking: ${parcel.tracking_number}`
      },
      'parcel.in_transit': {
        title: '🚛 Package In Transit',
        message: `Your order #${orderNumber} is on its way to you. Tracking: ${parcel.tracking_number}`
      },
      'parcel.out_for_delivery': {
        title: '🚪 Out for Delivery',
        message: `Your order #${orderNumber} is out for delivery and will arrive soon. Tracking: ${parcel.tracking_number}`
      },
      'parcel.delivered': {
        title: '✅ Package Delivered',
        message: `Your order #${orderNumber} has been delivered successfully. Thank you for shopping with us!`
      },
      'parcel.returned': {
        title: '↩️ Package Returned',
        message: `Your order #${orderNumber} has been returned. Please contact support for assistance.`
      },
      'parcel.failed_delivery': {
        title: '❌ Delivery Failed',
        message: `Delivery failed for order #${orderNumber}. Our team will contact you to reschedule.`
      },
      'parcel.cancelled': {
        title: '🚫 Shipment Cancelled',
        message: `Shipment for order #${orderNumber} has been cancelled. Please contact support for details.`
      }
    };

    const notification = notificationMap[event];
    if (notification) {
      await NotificationService.sendNotification({
        userId,
        type: 'shipping_update',
        title: notification.title,
        message: notification.message,
        data: {
          orderId: parcel.order_id,
          trackingNumber: parcel.tracking_number,
          status: parcel.status,
          event
        }
      });
    }
  }

  /**
   * Send delivery notification to admins
   */
  private static async sendAdminDeliveryNotification(
    event: YalidineEventType, 
    parcel: YalidineParcel,
    orderNumber: string
  ) {
    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: { id: true }
    });

    const adminNotificationMap: Record<string, { title: string; message: string }> = {
      'parcel.delivered': {
        title: '✅ Delivery Completed',
        message: `Order #${orderNumber} has been delivered successfully. Customer: ${parcel.recipient.name}`
      },
      'parcel.returned': {
        title: '↩️ Package Returned',
        message: `Order #${orderNumber} has been returned. Customer: ${parcel.recipient.name}. Action may be required.`
      },
      'parcel.failed_delivery': {
        title: '❌ Delivery Failed',
        message: `Delivery failed for order #${orderNumber}. Customer: ${parcel.recipient.name}. Follow up required.`
      }
    };

    const notification = adminNotificationMap[event];
    if (notification) {
      for (const admin of adminUsers) {
        await NotificationService.sendNotification({
          userId: admin.id,
          type: 'shipping_update',
          title: notification.title,
          message: notification.message,
          data: {
            orderId: parcel.order_id,
            trackingNumber: parcel.tracking_number,
            status: parcel.status,
            customerName: parcel.recipient.name,
            event
          }
        });
      }
    }
  }

  /**
   * Verify webhook signature (implement based on Yalidine's signature method)
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // Implement Yalidine's signature verification logic here
      // This depends on how Yalidine signs their webhooks
      // Common methods: HMAC-SHA256
      
      const crypto = require('crypto');
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return computedSignature === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Get parcel tracking information
   */
  static async getTrackingInfo(trackingNumber: string): Promise<{ success: boolean; parcel?: YalidineParcel; error?: string }> {
    try {
      if (!YALIDINE_API_TOKEN) {
        console.warn('Yalidine API token not configured');
        return { success: false, error: 'API not configured' };
      }

      const response = await fetch(`${YALIDINE_API_BASE}/parcels/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${YALIDINE_API_TOKEN}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return { success: false, error: 'Tracking number not found' };
      }

      const parcel = await response.json();
      return { success: true, parcel };

    } catch (error) {
      console.error('Error fetching tracking info:', error);
      return { success: false, error: 'Failed to fetch tracking information' };
    }
  }
}
