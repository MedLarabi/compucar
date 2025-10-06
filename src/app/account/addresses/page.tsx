"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { createAddressSchema } from "@/lib/schemas/user-schema";

// Create a form-specific schema that makes required fields non-optional
const addressFormSchema = createAddressSchema.extend({
  type: z.enum(['shipping', 'billing', 'both']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address1: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean(),
});

type AddressForm = z.infer<typeof addressFormSchema>;

// Type for stored addresses (includes id and timestamps)
type StoredAddress = AddressForm & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

// Mock addresses data - in a real app this would come from your API
const mockAddresses: StoredAddress[] = [
  {
    id: '1',
    type: 'both',
    isDefault: true,
    firstName: 'John',
    lastName: 'Doe',
    company: '',
    address1: '123 Main Street',
    address2: 'Apt 4B',
    city: 'Anytown',
    state: 'CA',
    postalCode: '12345',
    country: 'US',
    phone: '+1 (555) 123-4567',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    type: 'shipping',
    isDefault: false,
    firstName: 'John',
    lastName: 'Doe',
    company: 'ACME Corp',
    address1: '456 Business Ave',
    address2: 'Suite 100',
    city: 'Business City',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    phone: '+1 (555) 987-6543',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function getAddressTypeIcon(type: string) {
  switch (type) {
    case 'billing':
      return <Building className="h-4 w-4" />;
    case 'shipping':
      return <Home className="h-4 w-4" />;
    case 'both':
      return <MapPin className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
}

function getAddressTypeLabel(type: string, t: (key: string) => string) {
  switch (type) {
    case 'billing':
      return t('addresses.billing');
    case 'shipping':
      return t('addresses.shipping');
    case 'both':
      return t('addresses.billingShipping');
    default:
      return t('addresses.address');
  }
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<StoredAddress[]>(mockAddresses);
  const [editingAddress, setEditingAddress] = useState<StoredAddress | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      type: 'shipping',
      isDefault: false,
      country: 'US',
    },
  });

  const watchedType = watch('type');
  const watchedIsDefault = watch('isDefault');

  const openAddDialog = () => {
    setEditingAddress(null);
    reset({
      type: 'shipping',
      isDefault: false,
      country: 'US',
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      phone: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: typeof mockAddresses[0]) => {
    setEditingAddress(address);
    reset({
      type: address.type,
      isDefault: address.isDefault,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: AddressForm) => {
    if (editingAddress) {
      // Update existing address
      setAddresses(prev => prev.map(addr => 
        addr.id === editingAddress.id 
          ? { ...addr, ...data, updatedAt: new Date() }
          : data.isDefault && addr.isDefault ? { ...addr, isDefault: false } : addr
      ));
      toast.success(t('addresses.addressUpdated'));
    } else {
      // Add new address
      const newAddress = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setAddresses(prev => {
        if (data.isDefault) {
          return [...prev.map(addr => ({ ...addr, isDefault: false })), newAddress];
        }
        return [...prev, newAddress];
      });
      toast.success(t('addresses.addressAdded'));
    }
    
    setIsDialogOpen(false);
    setEditingAddress(null);
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
    toast.info(t('addresses.addressDeleted'));
  };

  const setAsDefault = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
    toast.success(t('addresses.defaultUpdated'));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('addresses.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('addresses.description')}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addresses.addAddress')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? t('addresses.editAddress') : t('addresses.addNewAddress')}
                </DialogTitle>
                <DialogDescription>
                  {editingAddress 
                    ? 'Update your address information below.' 
                    : 'Add a new shipping or billing address to your account.'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Address Type */}
                <div className="grid grid-cols-3 gap-4">
                  <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg">
                    <input
                      type="radio"
                      value="billing"
                      {...register('type')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 ${watchedType === 'billing' ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                    <Building className="h-4 w-4" />
                    <span>{t('addresses.billing')}</span>
                  </Label>
                  
                  <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg">
                    <input
                      type="radio"
                      value="shipping"
                      {...register('type')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 ${watchedType === 'shipping' ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                    <Home className="h-4 w-4" />
                    <span>{t('addresses.shipping')}</span>
                  </Label>
                  
                  <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg">
                    <input
                      type="radio"
                      value="both"
                      {...register('type')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 ${watchedType === 'both' ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                    <MapPin className="h-4 w-4" />
                    <span>{t('addresses.both')}</span>
                  </Label>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t('auth.fullName')} *</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t('addresses.lastName')} *</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Company */}
                <div>
                  <Label htmlFor="company">{t('contact.company')}</Label>
                  <Input id="company" {...register('company')} />
                </div>

                {/* Address Fields */}
                <div>
                  <Label htmlFor="address1">{t('contact.address')} *</Label>
                  <Input
                    id="address1"
                    {...register('address1')}
                    className={errors.address1 ? 'border-destructive' : ''}
                  />
                  {errors.address1 && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.address1.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address2">{t('addresses.addressLine2')}</Label>
                  <Input id="address2" {...register('address2')} />
                </div>

                {/* City, State, Postal */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">{t('addresses.city')} *</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">{t('addresses.state')} *</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      className={errors.state ? 'border-destructive' : ''}
                    />
                    {errors.state && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">{t('addresses.postalCode')} *</Label>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                      className={errors.postalCode ? 'border-destructive' : ''}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">{t('addresses.phoneOptional')}</Label>
                  <Input id="phone" {...register('phone')} />
                </div>

                {/* Default Address Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={watchedIsDefault}
                    onCheckedChange={(checked) => setValue('isDefault', !!checked)}
                  />
                  <Label htmlFor="isDefault">{t('addresses.setAsDefault')}</Label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAddress ? 'Update Address' : 'Add Address'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Addresses List */}
        {addresses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <Card key={address.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getAddressTypeIcon(address.type)}
                      {getAddressTypeLabel(address.type, t)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {address.isDefault && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAddress(address.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {address.firstName} {address.lastName}
                    </p>
                    {address.company && (
                      <p className="text-sm text-muted-foreground">
                        {address.company}
                      </p>
                    )}
                    <div className="text-sm">
                      <p>{address.address1}</p>
                      {address.address2 && <p>{address.address2}</p>}
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                    </div>
                    {address.phone && (
                      <p className="text-sm text-muted-foreground">
                        {address.phone}
                      </p>
                    )}
                  </div>

                  {!address.isDefault && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAsDefault(address.id)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Set as Default
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first address to make checkout faster
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Address
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}














