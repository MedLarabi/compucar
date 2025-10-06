import { prisma } from '@/lib/database/prisma';
import { yalidineGetParcel } from '@/lib/yalidine/client';

interface YalidineStatusResult {
  tracking: string;
  status: string;
  delivered_at?: string;
  updated_at?: string;
  delivery_attempts?: number;
  notes?: string;
}

export class YalidineStatusChecker {
  private static instance: YalidineStatusChecker;

  static getInstance(): YalidineStatusChecker {
    if (!YalidineStatusChecker.instance) {
      YalidineStatusChecker.instance = new YalidineStatusChecker();
    }
    return YalidineStatusChecker.instance;
  }

  /**
   * Check all pending/shipped orders for delivery status updates
   */
  async checkAllPendingOrders(): Promise<{
    checked: number;
    updated: number;
    delivered: number;
    errors: string[];
  }> {
    console.log('🔍 Starting Yalidine status check for all pending orders...');
    
    const results = {
      checked: 0,
      updated: 0,
      delivered: 0,
      errors: [] as string[]
    };

    try {
      // Get all orders with Yalidine tracking that are not yet delivered
      const pendingOrders = await prisma.order.findMany({
        where: {
          AND: [
            {
              yalidine: {
                tracking: {
                  not: null
                }
              }
            },
            {
              OR: [
                { codStatus: { in: ['PENDING', 'SUBMITTED', 'DISPATCHED'] } },
                { status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] } }
              ]
            }
          ]
        },
        include: {
          yalidine: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      console.log(`📦 Found ${pendingOrders.length} orders to check`);

      for (const order of pendingOrders) {
        if (!order.yalidine?.tracking) continue;

        results.checked++;
        
        try {
          const statusResult = await this.checkOrderStatus(order.id, order.yalidine.tracking);
          
          if (statusResult.updated) {
            results.updated++;
            
            if (statusResult.delivered) {
              results.delivered++;
              console.log(`📬 Order ${order.orderNumber} marked as delivered!`);
            }
          }

          // Add small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          const errorMsg = `Failed to check order ${order.orderNumber}: ${error}`;
          results.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      console.log('✅ Yalidine status check completed:', results);
      return results;

    } catch (error) {
      console.error('💥 Error in checkAllPendingOrders:', error);
      results.errors.push(`System error: ${error}`);
      return results;
    }
  }

  /**
   * Check status for a specific order
   */
  async checkOrderStatus(orderId: string, tracking: string): Promise<{
    updated: boolean;
    delivered: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      console.log(`🔍 Checking status for tracking: ${tracking}`);

      // Get current parcel status from Yalidine
      const yalidineResult = await yalidineGetParcel(tracking);

      if (!yalidineResult.ok) {
        console.warn(`⚠️ Failed to get Yalidine status for ${tracking}:`, yalidineResult.error);
        return { updated: false, delivered: false, error: yalidineResult.error };
      }

      const yalidineStatus = this.parseYalidineStatus(yalidineResult.data);
      console.log(`📊 Yalidine status for ${tracking}:`, yalidineStatus);

      // Get current order from database
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { yalidine: true }
      });

      if (!order) {
        return { updated: false, delivered: false, error: 'Order not found' };
      }

      // Check if status has changed
      const currentStatus = order.yalidine?.status || 'unknown';
      const newStatus = yalidineStatus.status;

      if (currentStatus === newStatus) {
        console.log(`ℹ️ No status change for ${tracking}: ${currentStatus}`);
        return { updated: false, delivered: false };
      }

      // Update Yalidine parcel record
      await prisma.yalidineParcel.update({
        where: { orderId },
        data: {
          status: newStatus,
          lastStatusCheck: new Date(),
          statusHistory: {
            push: {
              status: newStatus,
              timestamp: new Date().toISOString(),
              source: 'yalidine_api'
            }
          }
        }
      });

      // Determine if order should be marked as delivered
      const isDelivered = this.isDeliveredStatus(newStatus);
      let orderUpdated = false;

      if (isDelivered) {
        // Update order status to delivered
        const isCODOrder = order.paymentMethod === 'COD';
        
        if (isCODOrder) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              codStatus: 'DELIVERED',
              updatedAt: new Date()
            }
          });
        } else {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'DELIVERED',
              updatedAt: new Date()
            }
          });
        }

        orderUpdated = true;
        console.log(`✅ Order ${order.orderNumber} marked as DELIVERED`);

        // TODO: Send delivery notification to customer
        // await this.sendDeliveryNotification(order);
      }

      return {
        updated: true,
        delivered: isDelivered,
        status: newStatus
      };

    } catch (error) {
      console.error(`💥 Error checking status for ${tracking}:`, error);
      return {
        updated: false,
        delivered: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parse Yalidine API response to extract status information
   */
  private parseYalidineStatus(yalidineData: any): YalidineStatusResult {
    // Yalidine API might return different formats, normalize them
    const status = yalidineData?.status || 
                   yalidineData?.parcel_status || 
                   yalidineData?.state || 
                   'unknown';

    return {
      tracking: yalidineData?.tracking || yalidineData?.tracking_code,
      status: status.toLowerCase(),
      delivered_at: yalidineData?.delivered_at || yalidineData?.delivery_date,
      updated_at: yalidineData?.updated_at || yalidineData?.last_update,
      delivery_attempts: yalidineData?.delivery_attempts,
      notes: yalidineData?.notes || yalidineData?.comment
    };
  }

  /**
   * Check if a Yalidine status indicates delivery
   */
  private isDeliveredStatus(status: string): boolean {
    const deliveredStatuses = [
      'delivered',
      'livré',
      'remis',
      'complete',
      'completed',
      'success',
      'successful'
    ];

    return deliveredStatuses.includes(status.toLowerCase());
  }

  /**
   * Send delivery notification to customer (placeholder)
   */
  private async sendDeliveryNotification(order: any): Promise<void> {
    // TODO: Implement customer notification
    // This could be email, SMS, or in-app notification
    console.log(`📧 TODO: Send delivery notification for order ${order.orderNumber}`);
  }

  /**
   * Get status check statistics
   */
  async getStatusCheckStats(): Promise<{
    totalTracked: number;
    pendingOrders: number;
    deliveredToday: number;
    lastCheckTime?: Date;
  }> {
    const [totalTracked, pendingOrders, deliveredToday] = await Promise.all([
      // Total orders with tracking
      prisma.order.count({
        where: {
          yalidine: {
            tracking: { not: null }
          }
        }
      }),

      // Orders still pending delivery
      prisma.order.count({
        where: {
          AND: [
            {
              yalidine: { tracking: { not: null } }
            },
            {
              OR: [
                { codStatus: { in: ['PENDING', 'SUBMITTED', 'DISPATCHED'] } },
                { status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] } }
              ]
            }
          ]
        }
      }),

      // Orders delivered today
      prisma.order.count({
        where: {
          AND: [
            {
              OR: [
                { codStatus: 'DELIVERED' },
                { status: 'DELIVERED' }
              ]
            },
            {
              updatedAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          ]
        }
      })
    ]);

    // Get last check time from most recent Yalidine parcel update
    const lastCheck = await prisma.yalidineParcel.findFirst({
      where: {
        lastStatusCheck: { not: null }
      },
      orderBy: {
        lastStatusCheck: 'desc'
      },
      select: {
        lastStatusCheck: true
      }
    });

    return {
      totalTracked,
      pendingOrders,
      deliveredToday,
      lastCheckTime: lastCheck?.lastStatusCheck || undefined
    };
  }
}

export const yalidineStatusChecker = YalidineStatusChecker.getInstance();
