"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore, useCheckoutStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';
import { Loader2, Package, CreditCard, User } from 'lucide-react';
import Image from 'next/image';

const createCheckoutSchema = (totalPrice: number) => z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  newsletter: z.boolean(),
  createAccount: z.boolean(),
  paymentMethod: totalPrice > 0 
    ? z.enum(['stripe', 'paypal', 'google-pay', 'apple-pay', 'link', 'crypto'], {
        message: 'Please select a payment method',
      })
    : z.enum(['stripe', 'paypal', 'google-pay', 'apple-pay', 'link', 'crypto']).optional(),
});

type CheckoutFormData = z.infer<ReturnType<typeof createCheckoutSchema>>;

// Payment methods configuration
const paymentMethods = [
  {
    id: 'stripe',
    name: 'Stripe Payment',
    description: 'Credit Cards, Debit Cards',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCA2MCAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTI0LjQgMTAuNFYxNS4xQzI0LjQgMTYuNyAyMy43IDE3LjMgMjIuMSAxNy4zSDIxLjhWMTUuOUgyMi4xQzIyLjYgMTUuOSAyMi44IDE1LjcgMjIuOCAxNS4yVjEwLjRIMjQuNFpNMjguOCA5QzMwLjMgOSAzMS4zIDkuNSAzMS4zIDEwLjZWMTcuM0gyOS43VjEwLjlDMjkuNyAxMC4zIDI5LjQgMTAuMSAyOC44IDEwLjFDMjguMiAxMC4xIDI3LjkgMTAuNCAyNy45IDEwLjlWMTcuM0gyNi4zVjkuMkg3LjlWMTcuM0gyOC44WiIgZmlsbD0iIzAwRDRBQSIvPjwvc3ZnPg==',
    logoAlt: 'Stripe Logo',
    fields: [
      { name: 'cardNumber', label: 'Card Number', placeholder: '1234 5678 9012 3456', type: 'text' },
      { name: 'expiryDate', label: 'Expiry Date', placeholder: 'MM/YY', type: 'text' },
      { name: 'cvv', label: 'CVV', placeholder: '123', type: 'text' },
      { name: 'cardholderName', label: 'Cardholder Name', placeholder: 'John Doe', type: 'text' },
    ]
  },
  {
    id: 'paypal',
    name: 'PayPal Payments',
    description: 'Pay with your PayPal account',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNy4wNzYgMjEuMzM3aDIuMTEybC40NjEtMi45MjRoMi4xNDRjNC40NzQgMCA3LjA0NC0yLjE2IDcuOTQ0LTcuNDI4QzIwLjE3MyA3LjMwNiAxOS45OSA0Ljk3OSAxOC44MzkgMy4zNzJDMTcuNDkyIDEuNDkzIDE1LjI5OS44MDQgMTIuNTYuODA0SDUuODI0Yy0uNTQyIDAtMS4wMDYuNDAyLTEuMDg2Ljk0TDIuNjM3IDIwLjIxYy0uMDY4LjQyNi4yNzIuNzgxLjcwMy43ODEiIGZpbGw9IiMwMDMwODciLz48L3N2Zz4=',
    logoAlt: 'PayPal Logo',
    fields: []
  },
  {
    id: 'google-pay',
    name: 'Google Pay',
    description: 'Pay with Google Pay',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iMTciIHZpZXdCb3g9IjAgMCA0MSAxNyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTkuMjYgOC44NXY1LjMyaDEuNTN2LTUuMzJoMi4zOHYtMS4zaC02LjI5djEuM2gyLjM4em0tOC4zMSA1LjMyaDEuNTN2LTUuMzJoLTEuNTN2NS4zMnptLTMuODUgMGgxLjUzdi00aDIuMzh2LTEuMzJIMTQuMnYxLjMySC45djRoMS41M3ptMTMuNzctNC4wN2MtLjkxIDAtMS42Ni4zNS0xLjY2IDEuMTJzLjc1IDEuMTIgMS42NiAxLjEyIDEuNjYtLjM1IDEuNjYtMS4xMi0uNzUtMS4xMi0xLjY2LTEuMTJ6bS0uMDEgMy41M2MtLjg5IDAtMS42Mi0uNzMtMS42Mi0xLjYyczLjczLTEuNjIgMS42Mi0xLjYyczEuNjIuNzMgMS42MiAxLjYyLS43MyAxLjYyLTEuNjIgMS42MnptMTIuNDItNC4wN2MtLjkxIDAtMS42Ni4zNS0xLjY2IDEuMTJzLjc1IDEuMTIgMS42NiAxLjEyIDEuNjYtLjM1IDEuNjYtMS4xMi0uNzUtMS4xMi0xLjY2LTEuMTJ6bTAgMy41M2MtLjg5IDAtMS42Mi0uNzMtMS42Mi0xLjYyczLjczLTEuNjIgMS42Mi0xLjYyczEuNjIuNzMgMS42MiAxLjYyLS43MyAxLjYyLTEuNjIgMS42MnoiIGZpbGw9IiM1RjYzNjgiLz48L3N2Zz4=',
    logoAlt: 'Google Pay Logo',
    fields: []
  },
  {
    id: 'apple-pay',
    name: 'Apple Pay',
    description: 'Pay with Touch ID or Face ID',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTguNzEgMTkuNWMtLjgzIDEuMjQtMS43MSAyLjQ1LTMuMDUgMi40Ny0xLjMuMDEtMS42MS0uODctMi45Ny0uODctMS4zNSAwLTEuNzQuODctMi45NS44NS0xLjMxLS4wMy0yLjMtMS4zNS0zLjE0LTIuNTgtMS43NC0yLjYyLTMuMDYtNy40LTEuMjgtMTAuNjMuODktMS42IDIuNDktMi42MSA0LjIyLTIuNjMgMS4zMS0uMDIgMi41NC44OSAzLjM0LjkuOC4wMSAyLjEyLS45NyAzLjU4LS44MyAxLjg4LjA5IDMuMTYuNTQgNC4xIDIuNTA0LS4wOS4wNi0yLjMgMS4zMi0yLjI5IDMuOTMuMDEgMi45MiAyLjU4IDMuOTAgMi41NyAzLjkxLS4yLjY2LTEuNjIgMi43My0yLjEzIDMuNTJ6bS02LjIzLTEzLjI1Yy0uNzEuODMtMS45NSAxLjMtMi43MiAxLjMxLS4zLS44NC0uNy0xLjgzLS43LTIuOTYgMC0uNzEuMzctMS41LjcxLTEuODhDMTEgMi4yIDEyLjEgMS42NyAxMy4wNyAxLjQyYy4wMS4zLjI3IDEuMDUuNDEgMS44My0uMzMuMzctLjU4LjY5LS45NSAxLjAzeiIgZmlsbD0iIzAwMDAwMCIvPjwvc3ZnPg==',
    logoAlt: 'Apple Pay Logo',
    fields: []
  },
  {
    id: 'link',
    name: 'Link Payment',
    description: 'Pay with Link by Stripe',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAuMDg5IDEyLjIxNGMtLjAwMS0uMDAzLS4wMDItLjAwNi0uMDAzLS4wMDlhMi40IDIuNCAwIDEgMSAzLjgzIDIuODI3IDE2LjkgMTYuOSAwIDAgMS0uNTEzIDMuNzMgNC41IDQuNSAwIDAgMC0zLjMxMy02LjU0OFptMi4xOTEgNy43OWExNi45IDE2LjkgMCAwIDEtLjUxMyAzLjczIDQuNSA0LjUgMCAwIDEtMS42NzYtMy43M2MuNzQ4LS4wMDEgMS40OTUtLjAwMSAyLjE4OS0wWiIgZmlsbD0iIzAwRDRBQSIvPjwvc3ZnPg==',
    logoAlt: 'Link Payment Logo',
    fields: [
      { name: 'linkEmail', label: 'Email for Link', placeholder: 'your-email@example.com', type: 'email' },
    ]
  },
  {
    id: 'crypto',
    name: 'Crypto Payment',
    description: 'Bitcoin, Ethereum, and more',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMS4zNSAxNS42OEMxMy4wNSAxOCAxMi42OCAxOCAxMi4yNSAxOEgxMVYxNS42OGgxLjM1Wm0wLTMuMTdIMTJWMTIuMWgxLjM1YzEuMDUgMCAxLjkuNDQgMS45IDEuNDQgMCAuODQtLjQzIDEuMy0uOSAxLjQyek0xMS41IDloMS4zNWMuODQgMCAxLjUuMzggMS41IDEuMTcgMCAuNy0uMzggMS4wMy0xLjE1IDEuMDNIMTFWOUgxMS41WiIgZmlsbD0iI0Y3OTMxQSIvPjwvc3ZnPg==',
    logoAlt: 'Crypto Payment Logo',
    fields: [
      { name: 'cryptoType', label: 'Cryptocurrency', placeholder: 'Select cryptocurrency', type: 'select' },
      { name: 'walletAddress', label: 'Wallet Address', placeholder: '0x...', type: 'text' },
    ]
  },
];

export function CheckoutForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { items, totalPrice, clearCart } = useCartStore();
  const { setCustomerInfo, setStep, setLoading } = useCheckoutStore();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(() => totalPrice > 0 ? 'stripe' : '');

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(createCheckoutSchema(totalPrice)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      newsletter: false,
      createAccount: false,
      paymentMethod: totalPrice > 0 ? 'stripe' as const : undefined,
    },
  });

  // Auto-fill form with logged-in user's information
  useEffect(() => {
    if (session?.user) {
      const firstName = session.user.firstName || '';
      const lastName = session.user.lastName || '';
      const email = session.user.email || '';
      const newsletter = (session.user as any).newsletter || false;
      
      // Debug logging
      console.log('Checkout Form - Session User:', session.user);
      console.log('Checkout Form - Newsletter field:', (session.user as any).newsletter);
      console.log('Checkout Form - Has newsletter field:', 'newsletter' in session.user);
      
      form.setValue('firstName', firstName);
      form.setValue('lastName', lastName);
      form.setValue('email', email);
      form.setValue('newsletter', newsletter); // Set current subscription status
      form.setValue('createAccount', false); // Already has account
    }
    
    // Set default payment method only if there's a price
    if (totalPrice > 0) {
      setSelectedPaymentMethod('stripe');
      form.setValue('paymentMethod', 'stripe');
    } else {
      setSelectedPaymentMethod('');
      form.setValue('paymentMethod', undefined);
    }
  }, [session, form, totalPrice]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      console.error('No items in cart');
      alert('Your cart is empty. Please add items before checkout.');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // Debug logging for mobile
      console.log('Starting checkout process:', {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        userAgent: navigator.userAgent,
        itemsCount: items.length,
        totalPrice,
        customerData: data,
        timestamp: new Date().toISOString()
      });

      // Authentication will be checked by the API

      // Save customer info
      setCustomerInfo(data);

      // Create order
      const orderData = {
        customerInfo: {
          ...data,
          paymentMethod: totalPrice > 0 ? data.paymentMethod : undefined
        },
        items: items.map(item => ({
          productId: item.productId, // Use the actual product ID
          variantId: item.variantId,
          name: item.name,
          slug: item.slug,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          sku: `PRD-${item.productId}`,
        })),
        subtotal: totalPrice,
        total: totalPrice, // No shipping for digital products
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Enhanced error handling with specific messages
        const errorMessage = result.error || `Server error: ${response.status}`;
        console.error('Order creation failed:', {
          status: response.status,
          error: result.error,
          details: result.details,
          orderData
        });
        throw new Error(errorMessage);
      }
      
      // Handle payment flow based on order type
      if (result.payment?.isFree) {
        // Free order - complete immediately
        console.log('Free order completed:', result.payment.message);
        clearCart();
        setStep('success');
        
        // Check if auto-login is needed for guest created account
        if (result.autoLogin?.requiresPasswordSetup) {
          console.log('Auto-login required for new account:', result.autoLogin.email);
          
          // Redirect to password setup page with token and email
          const setupUrl = `/auth/setup-password?token=${result.autoLogin.setupPasswordToken}&email=${encodeURIComponent(result.autoLogin.email)}&orderId=${result.order.id}`;
          router.push(setupUrl);
        } else {
          // Redirect to success page
          const welcomeParam = result.autoLogin ? '&welcome=true' : '';
          router.push(`/checkout/success?orderId=${result.order.id}${welcomeParam}`);
        }
        
      } else if (result.payment?.requiresRedirect) {
        // Paid order - redirect to payment gateway
        console.log('Redirecting to payment gateway:', result.payment.message);
        clearCart();
        
        // Store order info for potential return
        sessionStorage.setItem('pendingOrderId', result.order.id);
        sessionStorage.setItem('pendingOrderAmount', result.order.total.toString());
        
        // Check if auto-login is needed for guest created account
        if (result.autoLogin?.requiresPasswordSetup) {
          console.log('Auto-login required for new account:', result.autoLogin.email);
          
          // Redirect to password setup page with token and email
          const setupUrl = `/auth/setup-password?token=${result.autoLogin.setupPasswordToken}&email=${encodeURIComponent(result.autoLogin.email)}&orderId=${result.order.id}`;
          router.push(setupUrl);
        } else {
          // Redirect to payment gateway
          if (result.payment.redirectUrl) {
            window.location.href = result.payment.redirectUrl;
          } else {
            // Fallback to success page if no redirect URL
            router.push(`/checkout/success?orderId=${result.order.id}&status=pending`);
          }
        }
        
      } else {
        // Unknown payment flow
        console.error('Unknown payment flow:', result);
        throw new Error('Unknown payment processing result');
      }

      // Remove the duplicate redirect logic that was causing conflicts
      
    } catch (error) {
      console.error('Checkout error:', error);
      
      // Enhanced error messaging for mobile debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      console.log('Error details:', {
        error: errorMessage,
        isMobile,
        userAgent,
        timestamp: new Date().toISOString(),
        formData: data
      });
      
      // Note: We now support guest checkout, so no authentication redirect needed
      
      if (isMobile) {
        alert(`Mobile checkout error: ${errorMessage}. Please try again or contact support.`);
      } else {
        alert('There was an error processing your order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some items to your cart to continue</p>
        <Button onClick={() => router.push('/products')}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-0">
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Customer Information Form */}
      <div className="w-full">
        <Card className="border-0 sm:border shadow-none sm:shadow-md">
          <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              {session?.user ? 'Review Your Information' : 'Customer Information'}
            </CardTitle>
            <CardDescription className="text-xs">
              {session?.user 
                ? 'Your account information will be used for this order.'
                : 'Please provide your details to complete your digital purchase.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 py-3 sm:py-4">
            <Form {...form}>
              <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {session?.user ? (
                  /* Logged-in user: Show their info as read-only */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {session.user.firstName} {session.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                        {(session.user as any).newsletter && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Newsletter subscriber
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Only show newsletter checkbox if user hasn't already subscribed */}
                    {!(session.user as any).newsletter && (
                      <FormField
                        control={form.control}
                        name="newsletter"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="flex-1 space-y-1">
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  📧 Subscribe to our newsletter
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Get notified about new products and exclusive offers.
                                </p>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ) : (
                  /* Guest user: Show full form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John" 
                                {...field}
                                className="h-8 text-sm" 
                                autoComplete="given-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Doe" 
                                {...field}
                                className="h-8 text-sm" 
                                autoComplete="family-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="john.doe@example.com" 
                              {...field}
                              className="h-10"
                              autoComplete="email"
                              inputMode="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newsletter"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="flex-1 space-y-1">
                              <FormLabel className="text-sm font-medium cursor-pointer">
                                📧 Subscribe to our newsletter
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Get notified about new products and exclusive offers.
                              </p>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="createAccount"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="flex-1 space-y-1">
                              <FormLabel className="text-sm font-medium cursor-pointer">
                                🚀 Create an account for faster checkout
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                We'll send you a password via email to access your account.
                              </p>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}



              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <div className="w-full">
        <Card className="border-0 sm:border shadow-none sm:shadow-md">
          <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Package className="h-4 w-4 text-primary" />
              Order Summary
            </CardTitle>
            <CardDescription className="text-xs">
              Review your digital products before placing the order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-3 sm:px-4 py-3 sm:py-4">
            {/* Items */}
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30 border">
                  <div className="relative h-8 w-8 rounded-md overflow-hidden bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-sm font-medium leading-none">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Digital Products Notice */}
            <div className="bg-muted/50 border rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs font-medium mb-1">
                <Package className="h-3 w-3 text-primary" />
                Digital Products
              </div>
              <p className="text-muted-foreground text-xs">
                Your digital products will be available for instant download after payment confirmation.
              </p>
            </div>

            {/* Payment Methods Section - Only show if total price > 0 */}
            {totalPrice > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Method
                </h3>
                
                <Tabs 
                  value={selectedPaymentMethod} 
                  onValueChange={(value) => {
                    setSelectedPaymentMethod(value);
                    form.setValue('paymentMethod', value as any);
                  }}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted/50">
                    {paymentMethods.map((method) => (
                      <TabsTrigger 
                        key={method.id} 
                        value={method.id}
                        className="flex flex-col items-center gap-1 px-2 py-3 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <div className="w-5 h-5 rounded-md overflow-hidden bg-white border flex items-center justify-center">
                          <Image
                            src={method.logo}
                            alt={method.logoAlt}
                            width={12}
                            height={12}
                            className="object-contain"
                            onError={(e) => {
                              // Fallback for broken images
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><rect width="12" height="12" fill="%23e5e7eb"/></svg>';
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium leading-tight text-center">
                          {method.name.split(' ')[0]}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {paymentMethods.map((method) => (
                    <TabsContent key={method.id} value={method.id} className="mt-3">
                      <div className="p-3 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-md overflow-hidden bg-white border flex items-center justify-center">
                            <Image
                              src={method.logo}
                              alt={method.logoAlt}
                              width={16}
                              height={16}
                              className="object-contain"
                              onError={(e) => {
                                // Fallback for broken images
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23e5e7eb"/></svg>';
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{method.name}</h4>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                        
                        {method.fields.length > 0 ? (
                          <div className="space-y-3">
                            {method.fields.map((field) => (
                              <div key={field.name} className="space-y-1">
                                <label className="text-xs font-medium">{field.label}</label>
                                {field.type === 'select' ? (
                                  <select className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background">
                                    <option value="">{field.placeholder}</option>
                                    <option value="bitcoin">Bitcoin (BTC)</option>
                                    <option value="ethereum">Ethereum (ETH)</option>
                                    <option value="da">Algerian Dinar (DA)</option>
                <option value="usdc">USD Coin (USDC)</option>
                                  </select>
                                ) : (
                                  <Input
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    className="h-8 text-sm"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-xs text-muted-foreground">
                              {method.id === 'paypal' && 'You will be redirected to PayPal to complete your payment.'}
                              {method.id === 'google-pay' && 'Google Pay will open in a new window.'}
                              {method.id === 'apple-pay' && 'Use Touch ID or Face ID to complete your payment.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {/* Free Products Notice - Show when total price is 0 */}
            {totalPrice === 0 && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1 text-green-800">
                    🎉 Free Download
                  </div>
                  <p className="text-green-700 text-xs">
                    This is a free product! No payment required. Click "Place Order" to get your download links.
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Order Total */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shipping</span>
                <span>Free (Digital Products)</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax</span>
                <span>Included</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <div className="pt-3">
              <Button 
                type="submit" 
                form="checkout-form"
                className="w-full h-10 text-sm font-semibold" 
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Processing Order...
                  </>
                ) : totalPrice === 0 ? (
                  <>
                    🎉 Get Free Download
                  </>
                ) : (
                  <>
                    🛒 Place Order • {formatPrice(totalPrice)}
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                🔒 Secure checkout • Digital products delivered instantly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
