import { prisma } from '@/lib/database/prisma';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  redirectUrl?: string;
  requiresRedirect?: boolean;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
  };
  successUrl: string;
  cancelUrl: string;
}

// Payment service class to handle different payment methods
export class PaymentService {
  
  /**
   * Process payment based on order amount
   * - Free orders (amount = 0): Complete immediately
   * - Paid orders: Redirect to payment gateway
   */
  static async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // For free orders, complete immediately
      if (request.amount === 0) {
        return await this.completeFreeOrder(request.orderId);
      }

      // For paid orders, process through payment gateway
      switch (request.paymentMethod) {
        case 'stripe':
          return await this.processStripePayment(request);
        case 'paypal':
          return await this.processPayPalPayment(request);
        case 'google-pay':
          return await this.processGooglePayPayment(request);
        case 'apple-pay':
          return await this.processApplePayPayment(request);
        case 'link':
          return await this.processLinkPayment(request);
        case 'crypto':
          return await this.processCryptoPayment(request);
        default:
          throw new Error(`Unsupported payment method: ${request.paymentMethod}`);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Complete free order immediately
   */
  private static async completeFreeOrder(orderId: string): Promise<PaymentResult> {
    try {
      // Update order status to completed
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'DELIVERED' // Use DELIVERED for completed free orders
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      });

      // Create a payment record for tracking
      await prisma.payment.create({
        data: {
          orderId: orderId,
          method: 'CARD', // Default method for free orders
          status: 'SUCCEEDED',
          amount: 0,
          currency: 'DZD',
          paidAt: new Date(),
          transactionId: `FREE-${orderId}-${Date.now()}`
        }
      });

      console.log(`Free order ${orderId} completed successfully`);
      
      return {
        success: true,
        transactionId: `FREE-${orderId}`,
        requiresRedirect: false
      };
    } catch (error) {
      console.error('Error completing free order:', error);
      throw error;
    }
  }

  /**
   * Stripe payment processing placeholder
   */
  private static async processStripePayment(request: PaymentRequest): Promise<PaymentResult> {
    // TODO: Implement Stripe integration
    // This is where you would integrate with Stripe's payment intent API
    
    console.log('Processing Stripe payment:', {
      orderId: request.orderId,
      amount: request.amount,
      currency: request.currency
    });

    // For now, return a mock redirect URL
    // In real implementation, you would create a Stripe checkout session
    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: `/payment/stripe?orderId=${request.orderId}&amount=${request.amount}`,
      transactionId: `stripe_mock_${Date.now()}`
    };
  }

  /**
   * PayPal payment processing placeholder
   */
  private static async processPayPalPayment(request: PaymentRequest): Promise<PaymentResult> {
    // TODO: Implement PayPal integration
    console.log('Processing PayPal payment:', request);
    
    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: `/payment/paypal?orderId=${request.orderId}&amount=${request.amount}`,
      transactionId: `paypal_mock_${Date.now()}`
    };
  }

  /**
   * Google Pay processing placeholder
   */
  private static async processGooglePayPayment(request: PaymentRequest): Promise<PaymentResult> {
    // TODO: Implement Google Pay integration
    console.log('Processing Google Pay payment:', request);
    
    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: `/payment/google-pay?orderId=${request.orderId}&amount=${request.amount}`,
      transactionId: `googlepay_mock_${Date.now()}`
    };
  }

  /**
   * Apple Pay processing placeholder
   */
  private static async processApplePayPayment(request: PaymentRequest): Promise<PaymentResult> {
    // TODO: Implement Apple Pay integration
    console.log('Processing Apple Pay payment:', request);
    
    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: `/payment/apple-pay?orderId=${request.orderId}&amount=${request.amount}`,
      transactionId: `applepay_mock_${Date.now()}`
    };
  }

  /**
   * Link payment processing placeholder
   */
  private static async processLinkPayment(request: PaymentRequest): Promise<PaymentResult> {
    // TODO: Implement Link payment integration
    console.log('Processing Link payment:', request);
    
    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: `/payment/link?orderId=${request.orderId}&amount=${request.amount}`,
      transactionId: `link_mock_${Date.now()}`
    };
  }

  /**
   * Crypto payment processing placeholder
   */
  private static async processCryptoPayment(request: PaymentRequest): Promise<PaymentResult> {
    // TODO: Implement crypto payment integration
    console.log('Processing Crypto payment:', request);
    
    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: `/payment/crypto?orderId=${request.orderId}&amount=${request.amount}`,
      transactionId: `crypto_mock_${Date.now()}`
    };
  }

  /**
   * Confirm payment from webhook/callback
   * This method should be called when payment gateway confirms payment
   */
  static async confirmPayment(
    orderId: string, 
    transactionId: string, 
    paymentMethod: string,
    amount: number
  ): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      console.log(`Confirming payment for order ${orderId}:`, {
        transactionId,
        paymentMethod,
        amount
      });

      // Verify the order exists and is in pending state
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      if (existingOrder.status !== 'PENDING') {
        throw new Error(`Order is not in pending state. Current status: ${existingOrder.status}`);
      }

      // Security: Double-check the amount matches
      const expectedAmount = Number(existingOrder.total);
      if (Math.abs(expectedAmount - amount) > 0.01) { // Allow for small rounding differences
        throw new Error(`Amount mismatch. Expected: ${expectedAmount}, Received: ${amount}`);
      }

      // Update order status to completed
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'DELIVERED' // Mark as delivered for digital products
        }
      });

      // Find existing payment or create new one
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId: orderId }
      });

      if (existingPayment) {
        // Update existing payment
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'SUCCEEDED',
            transactionId: transactionId,
            paidAt: new Date()
          }
        });
      } else {
        // Create new payment
        await prisma.payment.create({
          data: {
            orderId: orderId,
            method: paymentMethod.toUpperCase() as any,
            status: 'SUCCEEDED',
            amount: amount,
            currency: 'DZD',
            transactionId: transactionId,
            paidAt: new Date()
          }
        });
      }

      console.log(`Payment confirmed successfully for order ${orderId}`);
      
      return {
        success: true,
        order: updatedOrder
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed'
      };
    }
  }

  /**
   * Handle failed payment
   */
  static async handleFailedPayment(
    orderId: string, 
    reason: string,
    transactionId?: string
  ): Promise<void> {
    try {
      // Find existing payment or create new one
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId: orderId }
      });

      if (existingPayment) {
        // Update existing payment
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'FAILED'
          }
        });
      } else {
        // Create new payment
        await prisma.payment.create({
          data: {
            orderId: orderId,
            method: 'CARD',
            status: 'FAILED',
            amount: 0,
            currency: 'DZD',
            transactionId: transactionId || `failed_${Date.now()}`
          }
        });
      }

      // Optionally update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'CANCELLED',
          adminNotes: `Payment failed: ${reason}`
        }
      });

      console.log(`Payment failed for order ${orderId}: ${reason}`);
    } catch (error) {
      console.error('Error handling failed payment:', error);
    }
  }
}






