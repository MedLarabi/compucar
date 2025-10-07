"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCheckoutStore } from '@/stores';
import { useCartStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Truck, Package, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Address, ShippingMethod } from '@/types/checkout';

const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
});

// Simplified schema for digital products
const digitalCheckoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  newsletter: z.boolean(),
});

type AddressForm = z.infer<typeof addressSchema>;
type DigitalCheckoutForm = z.infer<typeof digitalCheckoutSchema>;

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivered in 5-7 business days',
    price: 9.99,
    estimatedDays: '5-7 days',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Delivered in 2-3 business days',
    price: 19.99,
    estimatedDays: '2-3 days',
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Delivered next business day',
    price: 39.99,
    estimatedDays: '1 day',
  },
];

export function ShippingForm() {
  const {
    setStep,
    setBillingAddress,
    setShippingAddress,
    setShippingMethod,
    setSameAsShipping,
    billingAddress,
    shippingAddress,
    shippingMethod,
    sameAsShipping,
  } = useCheckoutStore();

  const { needsShipping, isDigitalOnly } = useCartStore();

  const [selectedShipping, setSelectedShipping] = useState<string>(
    shippingMethod?.id || ''
  );

  // Use different form configs for digital vs physical products
  const isDigitalCheckout = !needsShipping();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AddressForm | DigitalCheckoutForm>({
    resolver: zodResolver(isDigitalCheckout ? digitalCheckoutSchema : addressSchema),
    defaultValues: isDigitalCheckout 
      ? {
          firstName: billingAddress?.firstName || '',
          lastName: billingAddress?.lastName || '',
          email: '',
          newsletter: false,
        }
      : billingAddress || {
          firstName: '',
          lastName: '',
          company: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
          phone: '',
        },
  });

  const formValues = watch();

  const onSubmit = (data: AddressForm | DigitalCheckoutForm) => {
    if (isDigitalCheckout) {
      // For digital products, create minimal billing address from form data
      const digitalData = data as DigitalCheckoutForm;
      const minimalBillingAddress = {
        firstName: digitalData.firstName,
        lastName: digitalData.lastName,
        email: digitalData.email,
        newsletter: digitalData.newsletter,
        // Set minimal required fields for API compatibility
        company: '',
        address1: 'Digital Purchase',
        address2: '',
        city: 'Digital',
        state: 'Digital',
        postalCode: '00000',
        country: 'US',
        phone: '',
      };
      
      setBillingAddress(minimalBillingAddress);
      setShippingAddress(null);
      setShippingMethod(null);
    } else {
      // Physical products - use full address form
      const addressData = data as AddressForm;
      setBillingAddress(addressData);

      // Save shipping address (either same as billing or existing shipping address)
      setShippingAddress(sameAsShipping ? addressData : shippingAddress || addressData);

      // Save selected shipping method
      const method = SHIPPING_METHODS.find(m => m.id === selectedShipping);
      if (method) {
        setShippingMethod(method);
      }
    }

    // Proceed to payment
    setStep('payment');
  };

  const handleShippingMethodSelect = (methodId: string) => {
    setSelectedShipping(methodId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          {needsShipping() ? 'Shipping Information' : 'Billing Information'}
        </h2>
        <p className="text-muted-foreground">
          {needsShipping() 
            ? 'Enter your delivery address and select a shipping method.'
            : 'Your cart contains only digital products. No shipping required.'
          }
        </p>
        {isDigitalOnly() && (
          <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              All items will be available for instant download after payment.
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Conditional Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isDigitalCheckout ? 'Customer Information' : 'Billing Address'}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isDigitalCheckout ? (
              // Digital Products - Simplified Form
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      className={(errors as any).firstName ? 'border-destructive' : ''}
                    />
                    {(errors as any).firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors as any).firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      className={(errors as any).lastName ? 'border-destructive' : ''}
                    />
                    {(errors as any).lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors as any).lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={isDigitalCheckout && (errors as any).email ? 'border-destructive' : ''}
                    placeholder="your.email@example.com"
                  />
                  {isDigitalCheckout && (errors as any).email && (
                    <p className="text-sm text-destructive mt-1">
                      {(errors as any).email.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                  <Checkbox
                    id="newsletter"
                    {...register('newsletter')}
                  />
                  <Label htmlFor="newsletter" className="text-sm">
                    Subscribe to our newsletter for updates, special offers, and new product announcements
                  </Label>
                </div>
              </>
            ) : (
              // Physical Products - Full Address Form
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      className={(errors as any).firstName ? 'border-destructive' : ''}
                    />
                    {(errors as any).firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors as any).firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      className={(errors as any).lastName ? 'border-destructive' : ''}
                    />
                    {(errors as any).lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors as any).lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input id="company" {...register('company')} />
                </div>

                <div>
                  <Label htmlFor="address1">Address *</Label>
                  <Input
                    id="address1"
                    {...register('address1')}
                    className={(errors as any).address1 ? 'border-destructive' : ''}
                  />
                  {(errors as any).address1 && (
                    <p className="text-sm text-destructive mt-1">
                      {(errors as any).address1.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                  <Input id="address2" {...register('address2')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      className={(errors as any).city ? 'border-destructive' : ''}
                    />
                    {(errors as any).city && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors as any).city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      className={(errors as any).state ? 'border-destructive' : ''}
                    />
                    {(errors as any).state && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors as any).state.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                      className={(errors as any).postalCode ? 'border-destructive' : ''}
                    />
                    {(errors as any).postalCode && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors as any).postalCode.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      {...register('country')}
                      className={(errors as any).country ? 'border-destructive' : ''}
                    />
                    {(errors as any).country && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors as any).country.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input id="phone" {...register('phone')} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Shipping-related sections - only show for physical products */}
        {needsShipping() && (
          <>
            {/* Same as Shipping Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAsShipping"
                checked={sameAsShipping}
                onCheckedChange={(checked) => setSameAsShipping(!!checked)}
              />
              <Label htmlFor="sameAsShipping">
                Shipping address is the same as billing address
              </Label>
            </div>

            {/* Shipping Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {SHIPPING_METHODS.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      selectedShipping === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    )}
                    onClick={() => handleShippingMethodSelect(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted">
                          {method.id === 'standard' && <Package className="h-4 w-4" />}
                          {method.id === 'express' && <Truck className="h-4 w-4" />}
                          {method.id === 'overnight' && <Zap className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{method.price.toFixed(2)} DA</p>
                        <p className="text-sm text-muted-foreground">
                          {method.estimatedDays}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        <Separator />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('cart')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>

          <Button
            type="submit"
            disabled={needsShipping() && !selectedShipping}
          >
            Continue to Payment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}







