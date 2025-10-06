"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  Download,
  Eye,
  Monitor
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatusUpdateDialog } from "./order-status-dialog";
import { YalidineParcelLive } from "./yalidine-parcel-live";
import { Suspense } from "react";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  sku?: string;
  product: {
    id: string;
    name: string;
    price: number;
    isVirtual: boolean;
    images: { url: string }[];
  };
}

interface Address {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

interface Download {
  id: string;
  productId: string;
  downloadCount: number;
  downloadLimit: number;
  isActive: boolean;
  createdAt: string;
  lastDownloadAt?: string | null;
  expiresAt?: string | null;
  product?: {
    id: string;
    name: string;
    isVirtual: boolean;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  estimatedDelivery?: string | null;
  user: Customer | null;
  items: OrderItem[];
  downloads: Download[];
  customerNotes?: string | null;
  shippingAddress?: Address | null;
  // COD-specific fields
  paymentMethod?: string;
  codStatus?: string;
  totalCents?: number;
  customerFirst?: string;
  customerLast?: string;
  customerPhone?: string;
  yalidine?: {
    order_id: string;
    firstname: string;
    familyname: string;
    contact_phone: string;
    address: string;
    to_wilaya_name: string;
    to_commune_name: string;
    product_list: string;
    price: number;
    height: number;
    width: number;
    length: number;
    weight: number;
    is_stopdesk: boolean;
    stopdesk_id?: number;
    freeshipping: boolean;
    has_exchange: boolean;
    from_wilaya_name: string;
    from_address: string;
    tracking?: string;
    label_url?: string;
    status?: string;
  };
  currency?: string; // Added currency field
  adminNotes?: string | null; // Added adminNotes field
}

interface OrderDetailViewProps {
  order: Order;
}

const orderStatuses = [
  { value: "PENDING", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "CONFIRMED", label: "Confirmed", icon: Package, color: "bg-blue-100 text-blue-800" },
  { value: "SHIPPED", label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-800" },
  { value: "DELIVERED", label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800" },
  { value: "REFUNDED", label: "Refunded", icon: AlertCircle, color: "bg-gray-100 text-gray-800" },
];

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState({
    firstName: order.user?.firstName || order.customerFirst || '',
    lastName: order.user?.lastName || order.customerLast || '',
    phone: order.user?.phone || order.customerPhone || '',
    email: order.user?.email || ''
  });
  const [editingItems, setEditingItems] = useState(order.items.map(item => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: item.price,
    quantity: item.quantity,
    sku: item.sku || ''
  })));
  const [editingOrder, setEditingOrder] = useState({
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    customerNotes: order.customerNotes || '',
    adminNotes: order.adminNotes || ''
  });
  const router = useRouter();

  // Debug: Log order details to help troubleshoot button visibility
  console.log('Order Detail Debug:', {
    orderNumber: order.orderNumber,
    paymentMethod: order.paymentMethod,
    hasCOD: order.paymentMethod === 'COD',
    hasYalidine: !!order.yalidine,
    hasTracking: !!order.yalidine?.tracking,
    trackingValue: order.yalidine?.tracking,
    buttonShouldShow: order.paymentMethod === 'COD',
    shouldShowCreate: order.paymentMethod === 'COD' && !order.yalidine?.tracking,
    shouldShowModifyDelete: order.paymentMethod === 'COD' && !!order.yalidine?.tracking
  });

  // Log full yalidine object to debug tracking issue
  console.log('🔍 Full Yalidine Data:', order.yalidine);
  
  // Log server logs instructions
  if (order.paymentMethod === 'COD' && !order.yalidine?.tracking) {
    console.log('📋 To debug: Check server terminal logs when clicking "Create Parcel" for Yalidine API response');
  }

  const getStatusInfo = (status: string) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  const getDownloadInfo = (productId: string) => {
    const download = order.downloads.find(d => d.productId === productId);
    if (!download) return null;
    
    return {
      downloadCount: download.downloadCount,
      downloadLimit: download.downloadLimit,
      isActive: download.isActive,
      lastDownloadAt: download.lastDownloadAt,
      hasBeenDownloaded: download.downloadCount > 0,
    };
  };

  // Get the correct status for display
  const displayStatus = order.paymentMethod === 'COD' && order.codStatus 
    ? (() => {
        // Map COD status back to regular status for display
        const mappedStatus = (() => {
          switch (order.codStatus) {
            case 'PENDING': return 'PENDING';
            case 'SUBMITTED': return 'CONFIRMED';
            case 'DISPATCHED': return 'SHIPPED';
            case 'DELIVERED': return 'DELIVERED';
            case 'FAILED': return 'CANCELLED';
            case 'CANCELLED': return 'CANCELLED'; // This covers both cancelled and refunded orders
            default: return 'PENDING';
          }
        })();
        
        // Debug logging for COD order detail
        console.log(`Order Detail ${order.orderNumber}:`, {
          paymentMethod: order.paymentMethod,
          codStatus: order.codStatus,
          mappedStatus: mappedStatus,
          orderStatus: order.status
        });
        
        return mappedStatus;
      })()
    : order.status;
    
  // Debug the final displayStatus
  console.log(`Final displayStatus for ${order.orderNumber}: "${displayStatus}" (from mappedStatus)`);
    
  const statusInfo = getStatusInfo(displayStatus);
  const StatusIcon = statusInfo.icon;
  
  // Debug the final statusInfo
  console.log(`StatusInfo for ${order.orderNumber}:`, statusInfo);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Order status update response:', data);
        
        // Refresh the page to show updated status
        console.log('Refreshing order detail page...');
        router.refresh();
        setShowStatusDialog(false);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const totalDownloads = order.downloads?.length || 0;
  const downloadedCount = order.downloads?.filter(d => d.downloadCount > 0).length || 0;
  const hasVirtualProducts = order.items.some(item => item.product.isVirtual);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
        
        <div className="flex items-center gap-4">
          {/* Download Status Summary */}
          {hasVirtualProducts && totalDownloads > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Downloads: {downloadedCount}/{totalDownloads}
              </span>
              {downloadedCount === totalDownloads ? (
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All Downloaded
                </Badge>
              ) : downloadedCount > 0 ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Partial
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  None Downloaded
                </Badge>
              )}
            </div>
          )}
          
          <Button
            onClick={() => setShowStatusDialog(true)}
            className="flex items-center gap-2"
          >
            <StatusIcon className="h-4 w-4" />
            Update Status
          </Button>

          {order.paymentMethod === 'COD' && (
            <div className="flex items-center gap-2">
              {!order.yalidine?.tracking ? (
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={async () => {
                    try {
                      toast.loading('Creating Yalidine parcel...', { id: 'yalidine-create' });
                      
                      const res = await fetch(`/api/admin/orders/${order.id}/yalidine/create`, { method: 'POST' });
                      const json = await res.json();
                      
                      toast.dismiss('yalidine-create');
                      
                      if (!res.ok) {
                        const errorMessage = typeof json.error === 'string' 
                          ? json.error 
                          : json.error?.message || 'Failed to create parcel';
                        toast.error(errorMessage);
                        return;
                      }
                      
                      toast.success(`✅ Yalidine parcel created successfully! 📦 Tracking: ${json.tracking || 'Generated'}`, {
                        duration: 5000,
                      });
                      
                      router.refresh();
                    } catch (e) {
                      toast.dismiss('yalidine-create');
                      toast.error('Failed to create parcel - Please try again');
                      console.error('Yalidine parcel creation error:', e);
                    }
                  }}
                >
                  <Truck className="h-4 w-4" />
                  Create Yalidine Parcel
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={async () => {
                      try {
                        toast.loading('Updating Yalidine parcel...', { id: 'yalidine-update' });
                        
                        const res = await fetch(`/api/admin/orders/${order.id}/yalidine/update`, { method: 'PATCH' });
                        const json = await res.json();
                        
                        toast.dismiss('yalidine-update');
                        
                        if (!res.ok) {
                          const errorMessage = typeof json.error === 'string' 
                            ? json.error 
                            : json.error?.message || json.message || 'Failed to update parcel';
                          toast.error(errorMessage);
                          return;
                        }
                        
                        const updatedFields = json.updated_fields && json.updated_fields.length > 0 
                          ? ` (${json.updated_fields.join(', ')})`
                          : '';
                        
                        const message = `✅ Yalidine parcel updated successfully${updatedFields}`;
                        
                        toast.success(message, {
                          duration: 5000,
                        });
                        
                        router.refresh();
                      } catch (e) {
                        toast.dismiss('yalidine-update');
                        const errorMessage = e instanceof Error ? e.message : 'Failed to update parcel - Please try again';
                        toast.error(errorMessage);
                        console.error('Yalidine parcel update error:', e);
                      }
                    }}
                  >
                    <Package className="h-4 w-4" />
                    Modify Parcel
                  </Button>
                  
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete this Yalidine parcel? This action cannot be undone.')) {
                        return;
                      }
                      
                      try {
                        toast.loading('Deleting Yalidine parcel...', { id: 'yalidine-delete' });
                        
                        const res = await fetch(`/api/admin/orders/${order.id}/yalidine/delete`, { method: 'DELETE' });
                        const json = await res.json();
                        
                        toast.dismiss('yalidine-delete');
                        
                        if (!res.ok) {
                          const errorMessage = typeof json.error === 'string' 
                            ? json.error 
                            : json.error?.message || json.message || 'Failed to delete parcel';
                          toast.error(errorMessage);
                          return;
                        }
                        
                        toast.success(`✅ Yalidine parcel deleted successfully!`, {
                          duration: 5000,
                        });
                        
                        router.refresh();
                      } catch (e) {
                        toast.dismiss('yalidine-delete');
                        toast.error('Failed to delete parcel - Please try again');
                        console.error('Yalidine parcel delete error:', e);
                      }
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Delete Parcel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Layout: Editor + Live Parcel Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Existing content (items, summary, etc.) + Editor */}
        <div className="space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const downloadInfo = getDownloadInfo(item.product.id);
                  
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.product.name}</h4>
                          {item.product.isVirtual && (
                            <Badge variant="outline" className="text-xs">
                              <Monitor className="h-3 w-3 mr-1" />
                              Digital
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                        
                        {/* Download Status for Virtual Products */}
                        {item.product.isVirtual && downloadInfo && (
                          <div className="mt-2 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Downloaded: 
                                <span className={`ml-1 font-medium ${downloadInfo.hasBeenDownloaded ? 'text-green-600' : 'text-red-600'}`}>
                                  {downloadInfo.downloadCount} / {downloadInfo.downloadLimit === -1 ? '∞' : downloadInfo.downloadLimit}
                                </span>
                              </span>
                            </div>
                            
                            {downloadInfo.hasBeenDownloaded ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Downloaded
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Not Downloaded
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Last Download Time */}
                        {item.product.isVirtual && downloadInfo?.lastDownloadAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last downloaded: {formatDateTime(downloadInfo.lastDownloadAt)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price)}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal, order.currency || 'DZD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax, order.currency || 'DZD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shipping, order.currency || 'DZD')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total, order.currency || 'DZD')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Status, customer, shipping, and Live Parcel Preview */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge className={statusInfo.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                <div className="text-sm space-y-1">
                  <p>Created: {formatDateTime(order.createdAt)}</p>
                  {order.updatedAt !== order.createdAt && (
                    <p>Updated: {formatDateTime(order.updatedAt)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">
                    {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest Customer'}
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {order.user?.email || 'No email provided'}
                    </div>
                    {order.user?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {order.user.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {order.shippingAddress ? (
                  <>
                    <p>{order.shippingAddress.address}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </>
                ) : order.paymentMethod === 'COD' && order.yalidine ? (
                  <>
                    <p><strong>COD Delivery Address:</strong></p>
                    <p>{order.yalidine.address}</p>
                    <p>{order.yalidine.to_commune_name}, {order.yalidine.to_wilaya_name}</p>
                    {order.yalidine.is_stopdesk && (
                      <p className="text-blue-600">📦 Stop-Desk Delivery (ID: {order.yalidine.stopdesk_id})</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No shipping address (Digital product)</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Yalidine Parcel Preview */}
          {order.paymentMethod === 'COD' && (
            <Suspense fallback={null}>
              {/* We reuse the OrderEditor component in hidden mode to expose its reactive state
                  up to a parent in a real refactor we would lift state to a wrapper; here, we render
                  the editor above in left column, and we compute preview directly from order. */}
              <YalidineParcelLive
                preview={{
                  deliveryType: order.yalidine?.is_stopdesk ? 'stopdesk' : 'home',
                  wilaya: order.yalidine?.to_wilaya_name || undefined,
                  commune: order.yalidine?.to_commune_name || undefined,
                  freeShipping: order.yalidine?.freeshipping || false,
                  stopdeskId: order.yalidine?.stopdesk_id || undefined,
                  priceDzd: order.totalCents ? Math.round(order.totalCents / 100) : order.total,
                  productList: order.yalidine?.product_list,
                  customer: {
                    firstname: order.customerFirst || order.user?.firstName,
                    familyname: order.customerLast || order.user?.lastName,
                    phone: order.customerPhone || order.user?.phone || undefined,
                  }
                }}
              />
            </Suspense>
          )}

          {/* Downloads Summary */}
          {order.downloads && order.downloads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Downloads ({order.downloads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.downloads.map((download) => {
                    const hasBeenDownloaded = download.downloadCount > 0;
                    return (
                      <div key={download.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">
                              {download.product?.name || 'Digital Product'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {download.downloadCount} / {download.downloadLimit === -1 ? '∞' : download.downloadLimit} downloads
                            </span>
                            {hasBeenDownloaded ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Downloaded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          {download.lastDownloadAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last: {formatDateTime(download.lastDownloadAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Download Stats */}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {order.downloads.filter(d => d.downloadCount > 0).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Downloaded</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {order.downloads.filter(d => d.downloadCount === 0).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          
        </div>
      </div>

      {/* Status Update Dialog */}
      <OrderStatusUpdateDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.user,
          status: order.status,
          total: order.total,
          itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          shippingAddress: order.shippingAddress || null,
          // COD-specific fields
          paymentMethod: order.paymentMethod,
          codStatus: order.codStatus,
          totalCents: order.totalCents,
          customerFirst: order.customerFirst,
          customerLast: order.customerLast,
          customerPhone: order.customerPhone,
        }}
        onStatusUpdate={handleStatusUpdate}
        currentStatus={order.paymentMethod === 'COD' ? (order.codStatus || 'PENDING') : order.status}
      />
    </div>
  );
}
