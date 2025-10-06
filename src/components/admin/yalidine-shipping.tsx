"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  DollarSign,
  Search,
  ExternalLink,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

interface YalidineShippingProps {
  order: {
    id: string;
    orderNumber: string;
    trackingNumber?: string;
    total: number;
    shippingAddress?: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
}

export function YalidineShipping({ order }: YalidineShippingProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: order.shippingAddress?.name || '',
    phone: order.shippingAddress?.phone || '',
    address: order.shippingAddress?.address || '',
    commune: order.shippingAddress?.city || '',
    wilaya: order.shippingAddress?.state || '',
    cashOnDelivery: order.total,
    shippingCost: 250
  });

  const handleCreateParcel = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/shipping/yalidine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          recipient: {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            commune: formData.commune,
            wilaya: formData.wilaya
          },
          cashOnDelivery: formData.cashOnDelivery,
          shippingCost: formData.shippingCost
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Parcel created successfully! Tracking: ${result.trackingNumber}`);
        // Refresh the page or update the order state
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to create parcel');
      }
    } catch (error) {
      console.error('Error creating parcel:', error);
      toast.error('Failed to create parcel');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTrackParcel = async () => {
    if (!order.trackingNumber) return;

    setIsTracking(true);
    try {
      const response = await fetch(`/api/admin/shipping/yalidine?trackingNumber=${order.trackingNumber}`);
      const result = await response.json();

      if (response.ok) {
        setTrackingData(result.parcel);
        toast.success('Tracking information updated');
      } else {
        toast.error(result.error || 'Failed to fetch tracking info');
      }
    } catch (error) {
      console.error('Error tracking parcel:', error);
      toast.error('Failed to fetch tracking information');
    } finally {
      setIsTracking(false);
    }
  };

  if (order.trackingNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Yalidine Shipping
          </CardTitle>
          <CardDescription>
            Track and manage this order's shipment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Tracking Number</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                  {order.trackingNumber}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTrackParcel}
                  disabled={isTracking}
                >
                  <Search className="h-4 w-4 mr-1" />
                  {isTracking ? 'Tracking...' : 'Update'}
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://yalidine.app/track/${order.trackingNumber}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View on Yalidine
            </Button>
          </div>

          {trackingData && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Current Status</Label>
                <Badge variant={trackingData.status === 'delivered' ? 'default' : 'secondary'}>
                  {trackingData.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Recipient</Label>
                  <p>{trackingData.recipient.name}</p>
                  <p>{trackingData.recipient.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p>{trackingData.recipient.address}</p>
                  <p>{trackingData.recipient.commune}, {trackingData.recipient.wilaya}</p>
                </div>
              </div>

              {trackingData.delivered_at && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Delivered</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Delivered on {new Date(trackingData.delivered_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {trackingData.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <Label className="text-xs text-blue-700 font-medium">Notes</Label>
                  <p className="text-sm text-blue-800">{trackingData.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create Yalidine Shipment
        </CardTitle>
        <CardDescription>
          Create a shipping parcel with Yalidine for this order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Recipient Name</Label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0123456789"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Delivery Address</Label>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-3" />
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Complete delivery address"
              rows={2}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commune">Commune</Label>
            <Input
              id="commune"
              value={formData.commune}
              onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
              placeholder="e.g., Alger Centre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wilaya">Wilaya</Label>
            <Input
              id="wilaya"
              value={formData.wilaya}
              onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
              placeholder="e.g., Alger"
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cod">Cash on Delivery (DZD)</Label>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Input
                id="cod"
                type="number"
                value={formData.cashOnDelivery}
                onChange={(e) => setFormData({ ...formData, cashOnDelivery: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping">Shipping Cost (DZD)</Label>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <Input
                id="shipping"
                type="number"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: Number(e.target.value) })}
                placeholder="250"
              />
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Order Items</h4>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>{item.price.toFixed(2)} DZD</span>
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formData.cashOnDelivery.toFixed(2)} DZD</span>
          </div>
        </div>

        <Button
          onClick={handleCreateParcel}
          disabled={isCreating || !formData.name || !formData.phone || !formData.address}
          className="w-full"
        >
          {isCreating ? 'Creating Parcel...' : 'Create Yalidine Parcel'}
        </Button>
      </CardContent>
    </Card>
  );
}
