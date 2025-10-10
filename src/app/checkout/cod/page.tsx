"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '@/stores';
import { MainLayout } from '@/components/layout/main-layout-simple';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { WILAYAS, getCommunesByWilaya } from '@/data/wilayas';
import { computeParcel, estimateShippingCost } from '@/lib/cart/packing';
import { 
  Loader2, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  User, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Home,
  Building2,
  DollarSign
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const codCheckoutSchema = z
  .object({
    // Delivery Type
    deliveryType: z.enum(['home', 'stopdesk']),
    stopdeskId: z.coerce.number().optional(),

    // Customer Information
    firstname: z.string().min(1, 'First name is required'),
    familyname: z.string().min(1, 'Last name is required'),
    phone: z.string().regex(/^[0-9]{9,10}$/, 'Phone must be 9-10 digits'),

    // Shipping Address
    wilaya: z.string().min(1, 'Please select a wilaya'),
    commune: z.string().optional(),

    // Parcel Override (optional)
    customLength: z.number().optional(),
    customWidth: z.number().optional(),
    customHeight: z.number().optional(),
    customWeight: z.number().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.deliveryType === 'home') {
      if (!val.commune || val.commune.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a commune', path: ['commune'] });
      }
    }
    if (val.deliveryType === 'stopdesk') {
      if (!val.stopdeskId || val.stopdeskId <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a stopdesk', path: ['stopdeskId'] });
      }
    }
  });

type CODCheckoutData = z.infer<typeof codCheckoutSchema>;

export default function CODCheckoutPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, clearCart } = useCartStore();
  const { t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [availableCommunes, setAvailableCommunes] = useState<Array<{id: number; name: string}>>([]);
  const [computedParcel, setComputedParcel] = useState<any>(null);
  const [estimatedShipping, setEstimatedShipping] = useState(0);
  const [stopdesks, setStopdesks] = useState<Array<{id: number; name: string; address: string}>>([]);
  const [yalidineWilayas, setYalidineWilayas] = useState<Array<{id: number; name: string; code: string}>>([]);
  const [isLoadingWilayas, setIsLoadingWilayas] = useState(false);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const form = useForm({
    resolver: zodResolver(codCheckoutSchema),
    defaultValues: {
      deliveryType: 'home',
      firstname: '',
      familyname: '',
      phone: '',
      wilaya: '',
      commune: '',
      stopdeskId: undefined
    }
  });

  // Track cart hydration status
  useEffect(() => {
    // Wait for store to hydrate
    const timer = setTimeout(() => {
      setHasHydrated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Load Yalidine wilayas on component mount
  useEffect(() => {
    const loadYalidineWilayas = async () => {
      setIsLoadingWilayas(true);
      try {
        const response = await fetch('/api/yalidine/wilayas');
        if (response.ok) {
          const data = await response.json();
          if (data.wilayas && data.wilayas.length > 0) {
            setYalidineWilayas(data.wilayas);
          } else {
            console.warn('Yalidine API returned empty wilayas');
            setYalidineWilayas([]);
          }
        } else {
          console.error('Failed to load wilayas from Yalidine API');
          setYalidineWilayas([]);
        }
      } catch (error) {
        console.error('Error loading wilayas from Yalidine API:', error);
        setYalidineWilayas([]);
      } finally {
        setIsLoadingWilayas(false);
      }
    };

    loadYalidineWilayas();
  }, []);

  // Redirect if cart is empty (but not during checkout process, after completion, or before hydration)
  useEffect(() => {
    console.log('COD useEffect: items.length =', items.length, 'isLoading =', isLoading, 'checkoutCompleted =', checkoutCompleted, 'hasHydrated =', hasHydrated);
    if (items.length === 0 && !isLoading && !checkoutCompleted && hasHydrated) {
      console.log('COD: Redirecting to products due to empty cart');
      router.push('/products');
    }
  }, [items.length, router, isLoading, checkoutCompleted, hasHydrated]);

  // Compute parcel dimensions when cart changes
  useEffect(() => {
    if (items.length > 0) {
      const cartForPacking = items.map(item => ({
        name: item.name,
        sku: item.category || 'AUTO',
        quantity: item.quantity,
        weightGr: 500, // Default 500g per item - you should get this from product data
        lengthCm: 20,
        widthCm: 15,
        heightCm: 3
      }));
      
      const parcel = computeParcel(cartForPacking);
      setComputedParcel(parcel);
    }
  }, [items]);

  // Update communes when wilaya changes
  useEffect(() => {
    if (selectedWilaya) {
      const loadCommunes = async () => {
        setIsLoadingCommunes(true);
        try {
          const response = await fetch(`/api/yalidine/communes?wilaya=${encodeURIComponent(selectedWilaya)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.communes && data.communes.length > 0) {
              setAvailableCommunes(data.communes);
            } else {
              console.warn('Yalidine API returned empty communes');
              setAvailableCommunes([]);
            }
          } else {
            console.error('Failed to load communes from Yalidine API');
            setAvailableCommunes([]);
          }
        } catch (error) {
          console.error('Error loading communes from Yalidine API:', error);
          setAvailableCommunes([]);
        } finally {
          setIsLoadingCommunes(false);
        }
      };

       loadCommunes();

       // If stopdesk selected, load stopdesks for this wilaya
       (async () => {
         if (form.watch('deliveryType') === 'stopdesk') {
           try {
             const sdRes = await fetch(`/api/yalidine/stopdesks?wilaya=${encodeURIComponent(selectedWilaya)}`);
             if (sdRes.ok) {
               const sdData = await sdRes.json();
               setStopdesks(sdData.stopdesks || []);
             } else {
               setStopdesks([]);
             }
           } catch {
             setStopdesks([]);
           }
         } else {
           setStopdesks([]);
         }
       })();
      form.setValue('commune', ''); // Reset commune selection
      
      // Reset shipping cost when wilaya changes (will recalculate when commune is selected)
      setEstimatedShipping(0);
    } else {
      setAvailableCommunes([]);
      setEstimatedShipping(0);
    }
  }, [selectedWilaya, computedParcel, form]);

  // Calculate shipping cost when both wilaya and commune are selected
  useEffect(() => {
    const selectedCommune = form.watch('commune');
    const deliveryType = form.watch('deliveryType');
    
    if (selectedWilaya && selectedCommune && computedParcel && deliveryType !== 'stopdesk') {
      console.log('🚢 Calculating shipping for:', { wilaya: selectedWilaya, commune: selectedCommune });
      calculateShippingCost(selectedWilaya, computedParcel.weight, false, selectedCommune);
    } else if (selectedWilaya && deliveryType === 'stopdesk' && computedParcel) {
      // For stopdesk, we don't need commune selection
      console.log('🚢 Calculating shipping for stopdesk:', { wilaya: selectedWilaya });
      calculateShippingCost(selectedWilaya, computedParcel.weight, true);
    }
  }, [selectedWilaya, form.watch('commune'), form.watch('deliveryType'), computedParcel]);

  // Calculate shipping cost using Yalidine API
  const calculateShippingCost = async (wilayaName: string, weightKg: number, isStopdesk: boolean, communeName?: string) => {
    setIsCalculatingShipping(true);
    try {
      const response = await fetch('/api/yalidine/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wilaya: wilayaName,
          commune: communeName || form.getValues('commune') || undefined,
          weight: weightKg,
          isStopdesk: isStopdesk
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEstimatedShipping(data.shipping.cost || 0);
      } else {
        console.error('Failed to calculate shipping from Yalidine');
        setEstimatedShipping(0);
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      setEstimatedShipping(0);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  // Handle wilaya selection
  const handleWilayaChange = (wilayaName: string) => {
    setSelectedWilaya(wilayaName);
    form.setValue('wilaya', wilayaName);
  };

  // Load stopdesks when stopdesk delivery is selected
  const handleDeliveryTypeChange = (type: 'home' | 'stopdesk') => {
    form.setValue('deliveryType', type);
    if (type === 'stopdesk') {
      // Clear commune for stopdesk flow
      form.setValue('commune', '');
    }
    
    (async () => {
      if (type === 'stopdesk' && selectedWilaya) {
        try {
          const sdRes = await fetch(`/api/yalidine/stopdesks?wilaya=${encodeURIComponent(selectedWilaya)}`);
          if (sdRes.ok) {
            const sdData = await sdRes.json();
            setStopdesks(sdData.stopdesks || []);
          } else {
            setStopdesks([]);
          }
        } catch {
          setStopdesks([]);
        }
      } else {
        setStopdesks([]);
        form.setValue('stopdeskId', undefined);
      }
    })();

    // Shipping will be recalculated by the useEffect when delivery type changes
  };

  // Submit COD order
  const onSubmit = async (data: any) => {
    console.log('onSubmit called with data:', data);
    setIsLoading(true);
    
    try {
      console.log('Submitting COD order:', data);

      // Prepare cart data with required fields
      const cartData = items.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.category || 'AUTO',
        unitPriceCents: Math.round(item.price * 100),
        quantity: item.quantity,
        weightGr: 500, // Default - should come from product data
        lengthCm: 20,
        widthCm: 15,
        heightCm: 3
      }));

      const checkoutPayload = {
        cart: cartData,
        customer: {
          firstname: data.firstname,
          familyname: data.familyname,
          phone: data.phone
        },
        destination: {
          wilaya: data.wilaya,
          commune: data.deliveryType === 'home' ? data.commune : ''
        },
        delivery: {
          isStopdesk: data.deliveryType === 'stopdesk',
          stopdeskId: data.stopdeskId,
          freeshipping: false,
          hasExchange: false
        },
        parcelOverride: data.customLength || data.customWidth || data.customHeight || data.customWeight ? {
          length: data.customLength,
          width: data.customWidth,
          height: data.customHeight,
          weight: data.customWeight
        } : undefined,
        // Include the shipping cost that was calculated and shown to customer
        calculatedShipping: estimatedShipping
      };

      console.log('Sending checkout payload:', checkoutPayload);
      console.log('🚢 Frontend shipping debug:', {
        estimatedShipping: estimatedShipping,
        calculatedShipping: checkoutPayload.calculatedShipping,
        isCalculatingShipping: isCalculatingShipping,
        selectedWilaya: selectedWilaya
      });

      const response = await fetch('/api/cod/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutPayload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order');
      }

      console.log('Order created successfully:', result);
      console.log('Redirecting to success page with orderId:', result.orderId);

      // Mark checkout as completed before clearing cart to prevent redirect race condition
      setCheckoutCompleted(true);
      
      // Redirect to success page first, then clear cart after a small delay
      console.log('Redirecting to success page first...');
      router.push(`/order/success?orderId=${result.orderId}`);
      console.log('Redirect called');
      
      // Clear cart after redirect is initiated to prevent race condition
      setTimeout(() => {
        clearCart();
        console.log('Cart cleared after redirect');
      }, 100);

    } catch (error) {
      console.error('COD checkout error:', error);
      
      // Handle specific error cases
      if (error instanceof Error && error.message.includes('no longer available')) {
        alert(`Some items in your cart are no longer available. Please refresh the page and add the items again.`);
        // Optionally clear the cart
        // clearCart();
      } else {
        alert(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while waiting for cart to hydrate or while cart is empty
  if (!hasHydrated || (items.length === 0 && hasHydrated)) {
    if (!hasHydrated) {
      // Still waiting for cart to hydrate from localStorage
      return (
        <MainLayout>
          <div className="container py-4 px-3 sm:px-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading checkout...</p>
              </div>
            </div>
          </div>
        </MainLayout>
      );
    }
    // Cart is hydrated but empty - will redirect in useEffect
    return null;
  }

  const subtotal = totalPrice;
  const shipping = estimatedShipping;
  const total = subtotal + shipping;

  return (
    <MainLayout>
      <div className="container py-4 px-3 sm:px-4 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="text-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('checkout.cod.backToCart')}
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('checkout.cod.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('checkout.cod.description')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-1">
              <Form {...form}>
                <form onSubmit={(e) => {
                  console.log('Form submit event triggered');
                  form.handleSubmit(onSubmit)(e);
                }} className="space-y-4">
                  
                  {/* Main Form Section - All Steps Combined */}
                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {/* 1. Delivery Type */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">1. {t('checkout.cod.deliveryType')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div 
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-colors text-center min-h-[80px] flex flex-col justify-center ${
                              form.watch('deliveryType') === 'home' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handleDeliveryTypeChange('home')}
                          >
                            <Home className="h-4 w-4 mx-auto mb-2" />
                            <div className="text-sm font-medium break-words">{t('checkout.cod.home')}</div>
                            <div className="text-xs text-muted-foreground break-words">{t('checkout.cod.directToAddress')}</div>
                          </div>
                          
                          <div 
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-colors text-center min-h-[80px] flex flex-col justify-center ${
                              form.watch('deliveryType') === 'stopdesk' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handleDeliveryTypeChange('stopdesk')}
                          >
                            <Building2 className="h-4 w-4 mx-auto mb-2" />
                            <div className="text-sm font-medium break-words">{t('checkout.cod.stopdesk')}</div>
                            <div className="text-xs text-muted-foreground break-words">{t('checkout.cod.stopdeskDescription')}</div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Customer Information */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">2. {t('checkout.cod.customerInfo')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="firstname"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">{t('checkout.cod.firstName')} *</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('checkout.cod.firstNamePlaceholder')} {...field} className="h-9 text-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="familyname"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">{t('checkout.cod.lastName')} *</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('checkout.cod.lastNamePlaceholder')} {...field} className="h-9 text-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">{t('checkout.cod.phone')} *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="0555123456" 
                                  {...field}
                                  maxLength={10}
                                  className="h-9 text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* 3. Shipping Location */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">3. {t('checkout.cod.shippingAddress')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="wilaya"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">{t('checkout.cod.wilaya')} *</FormLabel>
                                <Select onValueChange={handleWilayaChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-sm">
                                      <SelectValue placeholder={t('checkout.cod.selectWilaya')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {yalidineWilayas.map((wilaya) => (
                                      <SelectItem key={wilaya.id} value={wilaya.name}>
                                        {wilaya.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {form.watch('deliveryType') === 'home' && (
                            <FormField
                              control={form.control}
                              name="commune"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">{t('checkout.cod.commune')} *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedWilaya}>
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder={t('checkout.cod.selectCommune')} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {availableCommunes.map((commune) => (
                                        <SelectItem key={commune.id} value={commune.name}>
                                          {commune.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        
                        {form.watch('deliveryType') === 'stopdesk' && stopdesks.length > 0 && (
                          <FormField
                            control={form.control}
                            name="stopdeskId"
                            render={({ field }) => {
                              const selectedStopdesk = stopdesks.find(s => s.id === field.value);
                              
                              return (
                                <FormItem className="w-full space-y-3">
                                  <FormLabel className="text-sm font-medium text-foreground">
                                    {t('checkout.cod.selectStopdesk')}
                                  </FormLabel>
                                  
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                                    <FormControl>
                                      <SelectTrigger className="h-auto min-h-[50px] text-sm w-full border-2 hover:border-primary/50 focus:border-primary transition-colors bg-background">
                                        <SelectValue 
                                          placeholder={
                                            <span className="text-muted-foreground">
                                              Choose pickup location...
                                            </span>
                                          } 
                                          className="text-left"
                                        >
                                          {selectedStopdesk && (
                                            <span className="text-foreground font-medium">
                                              📍 {selectedStopdesk.name}
                                            </span>
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent 
                                      className="w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-[500px] md:max-w-[550px] max-h-[60vh] overflow-y-auto border-2 shadow-lg"
                                      position="popper"
                                      sideOffset={6}
                                    >
                                      {stopdesks.map((stopdesk) => (
                                        <SelectItem 
                                          key={stopdesk.id} 
                                          value={stopdesk.id.toString()} 
                                          className="w-full p-4 cursor-pointer hover:bg-accent focus:bg-accent border-b border-border/50 last:border-b-0 transition-colors"
                                        >
                                          <div className="w-full min-w-0 flex flex-col space-y-2 text-left">
                                            <div className="text-sm font-semibold text-foreground break-words leading-tight pr-2">
                                              📍 {stopdesk.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground break-words whitespace-normal leading-relaxed pr-2 max-w-full bg-muted/30 rounded-sm p-2">
                                              {stopdesk.address}
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  {/* Selected Stopdesk Address Display - Below Button */}
                                  {selectedStopdesk && (
                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2 mt-3">
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-foreground break-words">
                                            {selectedStopdesk.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground break-words whitespace-normal leading-relaxed mt-1">
                                            {selectedStopdesk.address}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        )}
                      </div>

                      {/* Submit Button - Combined with main form */}
                      <div className="pt-2">
                        <Button 
                          type="submit" 
                          className="w-full h-8 text-sm font-medium"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              {t('checkout.cod.loading')}
                            </>
                          ) : (
                            t('checkout.cod.orderNow')
                          )}
                        </Button>
                        
                        <p className="text-center text-xs text-muted-foreground mt-2">
                          {t('checkout.cod.codDescription')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {t('checkout.cod.orderSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Cart Items */}
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-2">
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={item.image || '/api/placeholder/48/48'}
                            alt={item.imageAlt || item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {t('common.quantity')}: {item.quantity}
                          </p>
                        </div>
                        <div className="text-xs font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs items-start">
                      <span className="break-words flex-1 mr-2">{t('checkout.cod.subtotal')} ({totalItems} {totalItems === 1 ? t('common.product') : t('common.products')})</span>
                      <span className="font-medium whitespace-nowrap">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs items-start">
                      <span className="break-words flex-1 mr-2">{t('checkout.cod.shipping')}</span>
                      <span>
                        {isCalculatingShipping ? (
                          <div className="flex items-center">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            {t('checkout.cod.calculating')}
                          </div>
                        ) : shipping > 0 ? (
                          formatPrice(shipping)
                        ) : selectedWilaya && !form.watch('commune') && form.watch('deliveryType') !== 'stopdesk' ? (
                          <span className="text-muted-foreground text-xs">{t('checkout.cod.selectCommuneFirst')}</span>
                        ) : (
                          t('common.free')
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-sm items-start">
                      <span className="break-words flex-1 mr-2">{t('checkout.cod.total')} (COD)</span>
                      <span className="font-bold whitespace-nowrap">{formatPrice(total)}</span>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                      {t('checkout.cod.allPricesInDA')}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {selectedWilaya && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
                      {form.watch('deliveryType') === 'stopdesk' && (
                        <div className="text-muted-foreground break-words">
                          {t('checkout.cod.stopdeskPickupDiscount')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Physical Products Notice */}
                  <Alert className="text-xs">
                    <CheckCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      <strong>{t('checkout.cod.physicalProducts')}</strong><br />
                      {t('checkout.cod.carefullyPackaged')}
                      {t('checkout.cod.paymentDueOnDelivery')}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
