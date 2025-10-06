"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2,
  Package,
  Search,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
}

interface OrderEditorProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    customerFirst?: string;
    customerLast?: string;
    customerPhone?: string;
    customerEmail?: string;
    items: OrderItem[];
    customerNotes?: string;
    adminNotes?: string;
    currency?: string;
    shippingAddress?: {
      id: string;
      firstName: string;
      lastName: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone?: string;
    } | null;
    yalidine?: {
      is_stopdesk: boolean;
      to_wilaya_name: string;
      to_commune_name: string;
      freeshipping: boolean;
    } | null;
  };
  onSave: (updatedOrder: any) => Promise<void>;
}

export function OrderEditor({ order, onSave }: OrderEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [yalidineWilayas, setYalidineWilayas] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [availableCommunes, setAvailableCommunes] = useState<Array<{ id: number; name: string }>>([]);
  const [stopdesks, setStopdesks] = useState<Array<{ id: number; name: string; address: string }>>([]);
  const [isLoadingWilayas, setIsLoadingWilayas] = useState(false);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);
  const [isLoadingStopdesks, setIsLoadingStopdesks] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState({
    firstName: order.customerFirst || '',
    lastName: order.customerLast || '',
    phone: order.customerPhone || '',
    email: order.customerEmail || ''
  });
  const [editingItems, setEditingItems] = useState(order.items.map(item => ({
    ...item,
    price: item.price,
    quantity: item.quantity
  })));

  // Debug: Log initial order items
  useEffect(() => {
    console.log('🔄 OrderEditor initialized with order:', order);
    console.log('📦 Initial order items:', order.items);
    console.log('📦 Initial editingItems state:', editingItems);
  }, [order.id]);

  // Debug: Log whenever editingItems changes
  useEffect(() => {
    console.log('📦 editingItems state changed:', editingItems);
  }, [editingItems]);
  const [editingOrder, setEditingOrder] = useState({
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    customerNotes: order.customerNotes || '',
    adminNotes: order.adminNotes || '',
    // delivery options
    deliveryType: (order.yalidine?.is_stopdesk ? 'stopdesk' : 'home') as 'stopdesk' | 'home',
    wilaya: order.yalidine?.to_wilaya_name || '',
    commune: order.yalidine?.to_commune_name || '',
    freeShipping: order.yalidine?.freeshipping ?? false,
    stopdeskId: undefined as number | undefined,
  });

  // Load Yalidine wilayas once
  useEffect(() => {
    const loadWilayas = async () => {
      setIsLoadingWilayas(true);
      try {
        const res = await fetch('/api/yalidine/wilayas');
        if (res.ok) {
          const data = await res.json();
          setYalidineWilayas(data.wilayas || []);
        } else {
          setYalidineWilayas([]);
        }
      } catch {
        setYalidineWilayas([]);
      } finally {
        setIsLoadingWilayas(false);
      }
    };
    loadWilayas();
  }, []);

  // Load communes when wilaya changes
  useEffect(() => {
    if (!editingOrder.wilaya) {
      setAvailableCommunes([]);
      setStopdesks([]);
      return;
    }
    const loadCommunes = async () => {
      setIsLoadingCommunes(true);
      try {
        const res = await fetch(`/api/yalidine/communes?wilaya=${encodeURIComponent(editingOrder.wilaya)}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableCommunes(data.communes || []);
        } else {
          setAvailableCommunes([]);
        }
      } catch {
        setAvailableCommunes([]);
      } finally {
        setIsLoadingCommunes(false);
      }
    };
    loadCommunes();

    const loadStopdesks = async () => {
      if (editingOrder.deliveryType !== 'stopdesk') {
        setStopdesks([]);
        return;
      }
      setIsLoadingStopdesks(true);
      try {
        const sdRes = await fetch(`/api/yalidine/stopdesks?wilaya=${encodeURIComponent(editingOrder.wilaya)}`);
        if (sdRes.ok) {
          const sdData = await sdRes.json();
          setStopdesks(sdData.stopdesks || []);
        } else {
          setStopdesks([]);
        }
      } catch {
        setStopdesks([]);
      } finally {
        setIsLoadingStopdesks(false);
      }
    };
    loadStopdesks();
  }, [editingOrder.wilaya]);

  // React to delivery type change
  useEffect(() => {
    if (editingOrder.deliveryType === 'stopdesk') {
      setEditingOrder(prev => ({ ...prev, commune: prev.commune ? '' : prev.commune, stopdeskId: undefined }));
    } else {
      setEditingOrder(prev => ({ ...prev, stopdeskId: undefined }));
      setStopdesks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingOrder.deliveryType]);

  const [editingAddress, setEditingAddress] = useState({
    firstName: order.shippingAddress?.firstName || '',
    lastName: order.shippingAddress?.lastName || '',
    company: order.shippingAddress?.company || '',
    address1: order.shippingAddress?.address1 || '',
    address2: order.shippingAddress?.address2 || '',
    city: order.shippingAddress?.city || '',
    state: order.shippingAddress?.state || '',
    postalCode: order.shippingAddress?.postalCode || '',
    country: order.shippingAddress?.country || 'DZ',
    phone: order.shippingAddress?.phone || ''
  });

  // Manual refresh function to get updated order data
  const refreshOrderData = async () => {
    try {
      console.log('🔄 Manually refreshing order data...');
      const response = await fetch(`/api/admin/orders/${order.id}`);
      if (response.ok) {
        const refreshedOrder = await response.json();
        console.log('✅ Refreshed order data:', refreshedOrder);
        console.log('📦 Refreshed items:', refreshedOrder.items);
        
        // Update the local state with refreshed data
        setEditingItems(refreshedOrder.items.map((item: any) => ({
          ...item,
          price: item.price,
          quantity: item.quantity
        })));
        
        // Update other fields if needed
        if (refreshedOrder.customerFirst) {
          setEditingCustomer(prev => ({
            ...prev,
            firstName: refreshedOrder.customerFirst || prev.firstName,
            lastName: refreshedOrder.customerLast || prev.lastName,
            phone: refreshedOrder.customerPhone || prev.phone,
            email: refreshedOrder.customerEmail || prev.email
          }));
        }
        
        toast.success('Order data refreshed successfully!');
      } else {
        console.log('❌ Failed to refresh order data:', response.status);
      }
    } catch (error) {
      console.error('❌ Error refreshing order data:', error);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Search products function
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching products for:', query);
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`);
      console.log('🔍 Search response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Search results:', data);
        // Fix: API returns data.data, not data.products
        setSearchResults(data.data || []);
      } else {
        console.error('🔍 Search failed with status:', response.status);
        const errorText = await response.text();
        console.error('🔍 Error response:', errorText);
      }
    } catch (error) {
      console.error('🔍 Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const debouncedSearch = (query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      searchProducts(query);
    }, 300); // 300ms delay
    
    setSearchTimeout(timeout);
  };

  // Add product from search results
  const addProductFromSearch = (product: Product) => {
    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      sku: product.sku || ''
    };
    setEditingItems([...editingItems, newItem]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    try {
      setIsSaving(true);
      
      // Validation
      if (editingItems.length === 0) {
        toast.error('Order must have at least one item');
        return;
      }

      if (!editingCustomer.firstName || !editingCustomer.lastName || !editingCustomer.phone) {
        toast.error('Customer first name, last name, and phone are required');
        return;
      }

      if (editingItems.some(item => !item.name || item.price <= 0 || item.quantity <= 0)) {
        toast.error('All items must have a name, positive price, and positive quantity');
        return;
      }

      // Calculate new total
      const newSubtotal = editingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newTotal = newSubtotal + editingOrder.shipping + editingOrder.tax - editingOrder.discount;
      
      const updatedOrder = {
        ...order,
        customerFirst: editingCustomer.firstName,
        customerLast: editingCustomer.lastName,
        customerPhone: editingCustomer.phone,
        customerEmail: editingCustomer.email,
        items: editingItems,
        subtotal: newSubtotal,
        total: newTotal,
        customerNotes: editingOrder.customerNotes,
        adminNotes: editingOrder.adminNotes,
        shipping: editingOrder.shipping,
        tax: editingOrder.tax,
        discount: editingOrder.discount,
        shippingAddress: editingAddress,
        yalidineOptions: {
          deliveryType: editingOrder.deliveryType,
          wilaya: editingOrder.wilaya || undefined,
          commune: editingOrder.deliveryType === 'home' ? (editingOrder.commune || undefined) : undefined,
          freeShipping: editingOrder.freeShipping,
          stopdeskId: editingOrder.deliveryType === 'stopdesk' ? editingOrder.stopdeskId : undefined,
        },
      };

      console.log('💾 Saving order with data:', updatedOrder);
      console.log('📦 Items to save:', editingItems);
      console.log('📦 Items to save (detailed):', editingItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sku: item.sku,
        productId: item.productId
      })));

      // Make API call to update the order
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrder),
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      const result = await response.json();
      console.log('✅ Order update response:', result);
      console.log('✅ Order update response (raw):', JSON.stringify(result, null, 2));

      // Verify the update by fetching the order again
      console.log('🔍 Verifying order update...');
      try {
        const verifyResponse = await fetch(`/api/admin/orders/${order.id}`);
        console.log('🔍 Verification response status:', verifyResponse.status);
        if (verifyResponse.ok) {
          const verifiedOrder = await verifyResponse.json();
          console.log('✅ Verified order data:', verifiedOrder);
          console.log('📦 Verified items:', verifiedOrder.items);
          console.log('📦 Verified items (detailed):', verifiedOrder.items?.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            sku: item.sku,
            productId: item.productId
          })));
        } else {
          console.log('❌ Verification failed with status:', verifyResponse.status);
        }
      } catch (verifyError) {
        console.log('⚠️ Could not verify order update:', verifyError);
      }

      await onSave(updatedOrder);
      setIsEditing(false);
      toast.success('Order updated successfully!');
      
      // Wait longer for the database transaction to fully commit
      console.log('⏳ Waiting for database transaction to commit...');
      setTimeout(() => {
        console.log('🔄 Refreshing page to show updated data...');
        // Force a hard refresh to ensure we get the latest data
        window.location.href = window.location.href;
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error updating order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setEditingCustomer({
      firstName: order.customerFirst || '',
      lastName: order.customerLast || '',
      phone: order.customerPhone || '',
      email: order.customerEmail || ''
    });
    setEditingItems(order.items.map(item => ({
      ...item,
      price: item.price,
      quantity: item.quantity
    })));
    setEditingOrder({
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      customerNotes: order.customerNotes || '',
      adminNotes: order.adminNotes || '',
      deliveryType: (order.yalidine?.is_stopdesk ? 'stopdesk' : 'home') as 'stopdesk' | 'home',
      wilaya: order.yalidine?.to_wilaya_name || '',
      commune: order.yalidine?.to_commune_name || '',
      freeShipping: order.yalidine?.freeshipping ?? false,
      stopdeskId: undefined,
    });
    setEditingAddress({
      firstName: order.shippingAddress?.firstName || '',
      lastName: order.shippingAddress?.lastName || '',
      company: order.shippingAddress?.company || '',
      address1: order.shippingAddress?.address1 || '',
      address2: order.shippingAddress?.address2 || '',
      city: order.shippingAddress?.city || '',
      state: order.shippingAddress?.state || '',
      postalCode: order.shippingAddress?.postalCode || '',
      country: order.shippingAddress?.country || 'DZ',
      phone: order.shippingAddress?.phone || ''
    });
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...editingItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditingItems(newItems);
    console.log(`✏️ Updated item ${index}: ${field} = ${value}`);
    console.log(`📦 Current items:`, newItems);
  };

  const removeItem = (index: number) => {
    const removedItem = editingItems[index];
    const newItems = editingItems.filter((_, i) => i !== index);
    setEditingItems(newItems);
    console.log(`🗑️ Removed item: ${removedItem.name} (index: ${index})`);
    console.log(`📦 Remaining items:`, newItems);
  };

  const addItem = () => {
    const newItem = {
      id: `temp-${Date.now()}`,
      productId: '',
      name: 'New Product',
      price: 0,
      quantity: 1,
      sku: ''
    };
    setEditingItems([...editingItems, newItem]);
    console.log(`➕ Added new item:`, newItem);
    console.log(`📦 Total items:`, editingItems.length + 1);
  };

  const calculateNewTotal = () => {
    const newSubtotal = editingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return newSubtotal + editingOrder.shipping + editingOrder.tax - editingOrder.discount;
  };

  // Recalculate totals whenever items change
  useEffect(() => {
    const newSubtotal = editingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTotal = newSubtotal + editingOrder.shipping + editingOrder.tax - editingOrder.discount;
    
    setEditingOrder(prev => ({
      ...prev,
      subtotal: newSubtotal,
      total: newTotal
    }));
    
    console.log(`💰 Totals recalculated: Subtotal=${newSubtotal}, Total=${newTotal}`);
  }, [editingItems, editingOrder.shipping, editingOrder.tax, editingOrder.discount]);

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Order Editor
            </CardTitle>
            <CardDescription className="text-xs">
              Edit order details, customer information, and items
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Order
                </Button>
                <Button onClick={refreshOrderData} variant="outline" size="sm">
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Refresh
                </Button>
                <Button 
                  onClick={() => {
                    console.log('🧪 Test: Current editingItems state:', editingItems);
                    console.log('🧪 Test: Current order items:', order.items);
                    console.log('🧪 Test: Are they different?', JSON.stringify(editingItems) !== JSON.stringify(order.items));
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Test Data
                </Button>
                <Button 
                  onClick={() => {
                    console.log('🧪 Test Save: Triggering save with current data...');
                    handleSave();
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Test Save
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} variant="default" size="sm" disabled={isSaving}>
                  <Save className="h-3 w-3 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-3 w-3 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Information */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={editingCustomer.firstName}
              onChange={(e) => setEditingCustomer({...editingCustomer, firstName: e.target.value})}
              disabled={!isEditing}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={editingCustomer.lastName}
              onChange={(e) => setEditingCustomer({...editingCustomer, lastName: e.target.value})}
              disabled={!isEditing}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={editingCustomer.phone}
              onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
              disabled={!isEditing}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <Separator />

        {/* Delivery Options (Yalidine) */}
        <div>
          <Label className="text-sm font-medium mb-2">Delivery Options</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={editingOrder.deliveryType === 'stopdesk'}
                  onChange={() => setEditingOrder(prev => ({ ...prev, deliveryType: 'stopdesk' }))}
                  disabled={!isEditing}
                />
                Stopdesk
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={editingOrder.deliveryType === 'home'}
                  onChange={() => setEditingOrder(prev => ({ ...prev, deliveryType: 'home' }))}
                  disabled={!isEditing}
                />
                Home Delivery
              </label>
            </div>

            <div>
              <Label htmlFor="wilaya">Wilaya</Label>
              <Select
                value={editingOrder.wilaya}
                onValueChange={(val) => {
                  setEditingOrder(prev => ({ ...prev, wilaya: val, commune: '' }));
                }}
                disabled={!isEditing || isLoadingWilayas}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={isLoadingWilayas ? 'Loading…' : 'Select wilaya'} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {yalidineWilayas.map((w) => (
                    <SelectItem key={w.id} value={w.name}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editingOrder.deliveryType === 'home' && (
              <div>
                <Label htmlFor="commune">Commune</Label>
                <Select
                  value={editingOrder.commune}
                  onValueChange={(val) => setEditingOrder(prev => ({ ...prev, commune: val }))}
                  disabled={!isEditing || !editingOrder.wilaya || isLoadingCommunes}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={isLoadingCommunes ? 'Loading…' : 'Select commune'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {availableCommunes.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editingOrder.deliveryType === 'stopdesk' && (
              <div>
                <Label htmlFor="stopdesk">Stopdesk</Label>
                <Select
                  value={editingOrder.stopdeskId ? String(editingOrder.stopdeskId) : ''}
                  onValueChange={(val) => setEditingOrder(prev => ({ ...prev, stopdeskId: Number(val) }))}
                  disabled={!isEditing || !editingOrder.wilaya || isLoadingStopdesks}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={isLoadingStopdesks ? 'Loading…' : 'Select stopdesk'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {stopdesks.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-3 flex items-center gap-2">
              <input
                id="freeShipping"
                type="checkbox"
                checked={!!editingOrder.freeShipping}
                onChange={(e) => setEditingOrder({ ...editingOrder, freeShipping: e.target.checked })}
                disabled={!isEditing}
              />
              <Label htmlFor="freeShipping">Free Shipping</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* No additional shipping meta per requirements */}

        {/* Order Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Order Items</Label>
            {isEditing && (
              <Button onClick={addItem} size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-2" />
                Add Item
              </Button>
            )}
          </div>
          
          {/* Product Search */}
          {isEditing && (
            <div className="mb-4">
              <Label htmlFor="productSearch">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="productSearch"
                  placeholder="Search for products to add..."
                  value={searchQuery}
                  onChange={(e) => {
                    console.log('🔍 Search input changed:', e.target.value);
                    setSearchQuery(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
              
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Search query: "{searchQuery}" | Results: {searchResults.length} | Searching: {isSearching ? 'Yes' : 'No'}
                </div>
              )}
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                  <div className="p-2 text-xs text-muted-foreground border-b bg-muted/30">
                    Found {searchResults.length} products
                  </div>
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      onClick={() => addProductFromSearch(product)}
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {product.sku || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(product.price, order.currency || 'DZD')}
                        </div>
                        <Button size="sm" variant="outline" className="mt-1">
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {isSearching && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Searching products...
                </div>
              )}
              
              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  No products found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            {editingItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Product name"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    disabled={!isEditing}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    disabled={!isEditing}
                    min="1"
                    className="h-8 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(item.price * item.quantity, order.currency || 'DZD')}
                    </span>
                    {isEditing && (
                      <Button
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Order Totals */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="shipping">Shipping Cost</Label>
            <Input
              id="shipping"
              type="number"
              value={editingOrder.shipping}
              onChange={(e) => setEditingOrder({...editingOrder, shipping: parseFloat(e.target.value) || 0})}
              disabled={!isEditing}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="tax">Tax</Label>
            <Input
              id="tax"
              type="number"
              value={editingOrder.tax}
              onChange={(e) => setEditingOrder({...editingOrder, tax: parseFloat(e.target.value) || 0})}
              disabled={!isEditing}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="discount">Discount</Label>
            <Input
              id="discount"
              type="number"
              value={editingOrder.discount}
              onChange={(e) => setEditingOrder({...editingOrder, discount: parseFloat(e.target.value) || 0})}
              disabled={!isEditing}
              className="h-8 text-sm"
            />
          </div>
          <div className="col-span-3">
            <Label>New Total</Label>
            <div className="text-base font-bold text-primary">
              {formatCurrency(calculateNewTotal(), order.currency || 'DZD')}
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="customerNotes">Customer Notes</Label>
            <Textarea
              id="customerNotes"
              value={editingOrder.customerNotes}
              onChange={(e) => setEditingOrder({...editingOrder, customerNotes: e.target.value})}
              disabled={!isEditing}
              rows={3}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              value={editingOrder.adminNotes}
              onChange={(e) => setEditingOrder({...editingOrder, adminNotes: e.target.value})}
              disabled={!isEditing}
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        {/* Summary */}
        {isEditing && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Summary of Changes</h4>
              <div className="text-sm space-y-1">
              <div>Original Total: {formatCurrency(order.total, order.currency || 'DZD')}</div>
              <div>New Total: {formatCurrency(calculateNewTotal(), order.currency || 'DZD')}</div>
              <div>Items: {editingItems.length}</div>
              <div>Customer: {editingCustomer.firstName} {editingCustomer.lastName}</div>
                <div>Delivery: {editingOrder.deliveryType === 'stopdesk' ? 'Stopdesk' : 'Home'} - {editingOrder.wilaya}{editingOrder.deliveryType === 'home' && editingOrder.commune ? `, ${editingOrder.commune}` : ''}</div>
              
              {/* Debug section for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-3 pt-3 border-t">
                  <div className="font-medium text-xs">Debug Info:</div>
                  <div className="text-xs space-y-1">
                    <div>Items being edited:</div>
                    {editingItems.map((item, index) => (
                      <div key={index} className="ml-2 text-muted-foreground">
                        • {item.name} - {formatCurrency(item.price, order.currency || 'DZD')} x{item.quantity}
                      </div>
                    ))}
                    
                    <div className="mt-2 pt-2 border-t">
                      <div className="font-medium">Data Comparison:</div>
                      <div>Original items count: {order.items.length}</div>
                      <div>Editing items count: {editingItems.length}</div>
                      <div>Items changed: {JSON.stringify(editingItems) !== JSON.stringify(order.items) ? 'YES' : 'NO'}</div>
                      <div>Price changes: {editingItems.some((item, index) => 
                        order.items[index] && item.price !== order.items[index].price
                      ) ? 'YES' : 'NO'}</div>
                      <div>Quantity changes: {editingItems.some((item, index) => 
                        order.items[index] && item.quantity !== order.items[index].quantity
                      ) ? 'YES' : 'NO'}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground mt-2">
                Changes will be saved when you click "Save Changes"
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
