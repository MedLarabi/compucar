"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { computeParcel } from '@/lib/cart/packing';
import { 
  Loader2, 
  User, 
  MapPin, 
  Home,
  Building2,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import Image from 'next/image';

const quickCheckoutSchema = z
  .object({
    deliveryType: z.enum(['home', 'stopdesk']),
    stopdeskId: z.number().optional(),
    firstname: z.string().min(1, 'First name is required'),
    familyname: z.string().min(1, 'Last name is required'),
    phone: z.string().regex(/^[0-9]{9,10}$/, 'Phone must be 9-10 digits'),
    wilaya: z.string().min(1, 'Please select a wilaya'),
    commune: z.string().optional(),
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

type QuickCheckoutData = z.infer<typeof quickCheckoutSchema>;

interface QuickCheckoutFormProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image?: string;
  };
  quantity: number;
  selectedVariant?: any;
  onSuccess: (orderId: string) => void;
  onCancel: () => void;
}

export function QuickCheckoutForm({ 
  product, 
  quantity, 
  selectedVariant, 
  onSuccess, 
  onCancel 
}: QuickCheckoutFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [availableCommunes, setAvailableCommunes] = useState<Array<{id: number; name: string}>>([]);
  const [computedParcel, setComputedParcel] = useState<any>(null);
  const [estimatedShipping, setEstimatedShipping] = useState(0);
  const [stopdesks, setStopdesks] = useState<Array<{id: number; name: string; address: string}>>([]);
  const [yalidineWilayas, setYalidineWilayas] = useState<Array<{id: number; name: string; code: string}>>([]);
  const [isLoadingWilayas, setIsLoadingWilayas] = useState(false);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const form = useForm<QuickCheckoutData>({
    resolver: zodResolver(quickCheckoutSchema),
    defaultValues: {
      deliveryType: 'home',
      firstname: '',
      familyname: '',
      phone: '',
      wilaya: '',
      commune: '',
      stopdeskId: undefined,
    },
  });

  const deliveryType = form.watch('deliveryType');
  const wilaya = form.watch('wilaya');
  const commune = form.watch('commune');

  // Calculate total
  const subtotal = product.price * quantity;
  const total = subtotal + estimatedShipping;

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

  // Compute parcel dimensions for the product
  useEffect(() => {
    const cartForPacking = [{
      name: product.name,
      sku: 'AUTO',
      quantity: quantity,
      weightGr: 500, // Default 500g per item
      lengthCm: 20,
      widthCm: 15,
      heightCm: 3
    }];
    
    const parcel = computeParcel(cartForPacking);
    setComputedParcel(parcel);
  }, [product, quantity]);

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

  const handleDeliveryTypeChange = (newType: 'home' | 'stopdesk') => {
    form.setValue('deliveryType', newType);
    
    // Reset commune/stopdesk when switching types
    if (newType === 'home') {
      form.setValue('stopdeskId', undefined);
    } else {
      form.setValue('commune', '');
    }
    
    // Recalculate shipping if wilaya is selected
    if (selectedWilaya && computedParcel) {
      if (newType === 'stopdesk') {
        calculateShippingCost(selectedWilaya, computedParcel.weight, true);
      } else {
        setEstimatedShipping(0);
      }
    }
  };

  const onSubmit = async (data: QuickCheckoutData) => {
    setIsLoading(true);
    
    try {
      const cartData = [{
        productId: product.id,
        name: product.name,
        sku: 'AUTO',
        unitPriceCents: Math.round(product.price * 100),
        quantity: quantity,
        weightGr: 500,
        lengthCm: 20,
        widthCm: 15,
        heightCm: 3
      }];

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
        calculatedShipping: estimatedShipping
      };

      console.log('Sending quick checkout payload:', checkoutPayload);

      const response = await fetch('/api/cod/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order');
      }

      console.log('Order created successfully:', result);
      console.log('Order ID:', result.orderId);

      // Call onSuccess callback with orderId which will handle redirect
      onSuccess(result.orderId);

    } catch (error: any) {
      console.error('Quick checkout error:', error);
      
      // Handle specific error cases
      if (error instanceof Error && error.message.includes('no longer available')) {
        alert(`This product is no longer available. Please refresh the page.`);
      } else {
        alert(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Product Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            {product.image && (
              <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground">
                {t('product.quantity')}: {quantity}
              </p>
              <p className="font-bold text-primary">{formatPrice(product.price * quantity)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Delivery Type */}
          <FormField
            control={form.control}
            name="deliveryType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{t('checkout.cod.deliveryType')}</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={field.value === 'home' ? 'default' : 'outline'}
                    className="w-full text-xs sm:text-sm"
                    onClick={() => handleDeliveryTypeChange('home')}
                  >
                    <Home className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {t('checkout.cod.home')}
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'stopdesk' ? 'default' : 'outline'}
                    className="w-full text-xs sm:text-sm"
                    onClick={() => handleDeliveryTypeChange('stopdesk')}
                  >
                    <Building2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {t('checkout.cod.stopdesk')}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Customer Information */}
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
              <User className="h-4 w-4" />
              {t('checkout.cod.customerInfo')}
            </h3>

            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t('checkout.cod.firstName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('checkout.cod.firstNamePlaceholder')} className="text-sm" />
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
                  <FormLabel className="text-sm">{t('checkout.cod.lastName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('checkout.cod.lastNamePlaceholder')} className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t('checkout.cod.phone')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0XXXXXXXXX" type="tel" className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Shipping Address */}
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="h-4 w-4" />
              {t('checkout.cod.shippingAddress')}
            </h3>

            <FormField
              control={form.control}
              name="wilaya"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t('checkout.cod.wilaya')}</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedWilaya(value);
                    }} 
                    value={field.value}
                    disabled={isLoadingWilayas}
                  >
                    <FormControl>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder={
                          isLoadingWilayas 
                            ? t('checkout.cod.loading') 
                            : t('checkout.cod.selectWilaya')
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-w-[90vw] sm:max-w-md">
                      {isLoadingWilayas ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm">{t('checkout.cod.loading')}</span>
                        </div>
                      ) : yalidineWilayas.length > 0 ? (
                        yalidineWilayas.map((wilaya) => (
                          <SelectItem key={wilaya.id} value={wilaya.name}>
                            <div className="truncate">
                              {wilaya.code} - {wilaya.name}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No wilayas available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {deliveryType === 'home' && (
              <FormField
                control={form.control}
                name="commune"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t('checkout.cod.commune')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      disabled={!selectedWilaya || isLoadingCommunes}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={
                            isLoadingCommunes 
                              ? t('checkout.cod.loading') 
                              : t('checkout.cod.selectCommune')
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-[90vw] sm:max-w-md">
                        {isLoadingCommunes ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">{t('checkout.cod.loading')}</span>
                          </div>
                        ) : availableCommunes.length > 0 ? (
                          availableCommunes.map((commune) => (
                            <SelectItem key={commune.id} value={commune.name}>
                              <div className="truncate">
                                {commune.name}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {selectedWilaya ? 'No communes available' : t('checkout.cod.selectWilaya')}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {deliveryType === 'stopdesk' && (
              <FormField
                control={form.control}
                name="stopdeskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t('checkout.cod.selectStopdesk')}</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                      disabled={!selectedWilaya || stopdesks.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={t('checkout.cod.selectStopdesk')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-[90vw] sm:max-w-md">
                        {stopdesks.length > 0 ? (
                          stopdesks.map((stopdesk) => (
                            <SelectItem key={stopdesk.id} value={stopdesk.id.toString()} className="whitespace-normal">
                              <div className="truncate">
                                {stopdesk.name} - {stopdesk.address}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {selectedWilaya ? 'No stopdesks available' : t('checkout.cod.selectWilaya')}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Order Summary */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
              <DollarSign className="h-4 w-4" />
              {t('checkout.cod.orderSummary')}
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{t('checkout.cod.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('checkout.cod.shipping')}</span>
                <span>
                  {isCalculatingShipping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    formatPrice(estimatedShipping)
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>{t('checkout.cod.total')}</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 text-sm"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isCalculatingShipping}
              className="flex-1 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="truncate">{t('checkout.cod.loading')}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{t('checkout.cod.orderNow')}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
