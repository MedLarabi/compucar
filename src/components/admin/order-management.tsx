"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatusUpdateDialog } from "./order-status-dialog";

interface Order {
  id: string;
  orderNumber: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  status: string;
  total: number;
  itemsCount: number;
  // Add items array for detailed display
  items?: Array<{
    id: string;
    name: string;
    price: number;
    priceCents?: number;
    quantity: number;
    sku?: string;
  }>;
  // Add subtotal for verification
  subtotal?: number;
  subtotalCents?: number;
  // Add shipping and other costs
  shipping?: number;
  shippingCents?: number;
  tax?: number;
  discount?: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
  // COD-specific fields
  paymentMethod?: string;
  codStatus?: string;
  totalCents?: number;
  customerFirst?: string;
  customerLast?: string;
  customerPhone?: string;
  currency?: string; // Added currency field
}

const orderStatuses = [
  { value: "PENDING", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "CONFIRMED", label: "Confirmed", icon: Package, color: "bg-blue-100 text-blue-800" },
  { value: "SHIPPED", label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-800" },
  { value: "DELIVERED", label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800" },
  { value: "REFUNDED", label: "Refunded", icon: AlertCircle, color: "bg-gray-100 text-gray-800" },
];

// COD-specific statuses
const codStatuses = [
  { value: "PENDING", label: "Order Placed", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "SUBMITTED", label: "Sent to Courier", icon: Package, color: "bg-blue-100 text-blue-800" },
  { value: "DISPATCHED", label: "Out for Delivery", icon: Truck, color: "bg-purple-100 text-purple-800" },
  { value: "DELIVERED", label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "FAILED", label: "Delivery Failed", icon: XCircle, color: "bg-red-100 text-red-800" },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle, color: "bg-gray-100 text-gray-800" },
];

export function OrderManagementTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  // Add state for expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Toggle row expansion
  const toggleRowExpansion = (orderId: string) => {
    if (!orderId) return;
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(orderId)) {
      newExpandedRows.delete(orderId);
    } else {
      newExpandedRows.add(orderId);
    }
    setExpandedRows(newExpandedRows);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Status update response:', data); // Debug log
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                // Update the correct status field based on payment method
                ...(order.paymentMethod === 'COD' 
                  ? { codStatus: data.order.status } 
                  : { status: data.order.status }
                ),
                updatedAt: data.order.updatedAt 
              }
            : order
        ));
        setShowStatusDialog(false);
        setSelectedOrder(null);
        
        // Force a re-fetch to ensure UI is in sync
        await fetchOrders();
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerFirst?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerLast?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm);
    
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter.startsWith("cod-")) {
      // Handle COD status filters
      const codStatusValue = statusFilter.replace("cod-", "").toUpperCase();
      matchesStatus = order.paymentMethod === 'COD' && order.codStatus === codStatusValue;
    } else {
      // Handle regular status filters
      matchesStatus = order.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (order: any) => {
    // For COD orders, map COD status back to regular status for display consistency
    if (order.paymentMethod === 'COD' && order.codStatus) {
      const mapFromCODStatus = (codStatus: string): string => {
        switch (codStatus) {
          case 'PENDING': return 'PENDING';
          case 'SUBMITTED': return 'CONFIRMED'; // Show as "Confirmed" since it's confirmed and sent to courier
          case 'DISPATCHED': return 'SHIPPED'; // Show as "Shipped" when actually dispatched
          case 'DELIVERED': return 'DELIVERED';
          case 'FAILED': return 'CANCELLED'; // Show failed deliveries as cancelled
          case 'CANCELLED': return 'CANCELLED'; // This covers both cancelled and refunded orders
          default: return 'PENDING';
        }
      };
      const mappedStatus = mapFromCODStatus(order.codStatus);
      return orderStatuses.find(s => s.value === mappedStatus) || orderStatuses[0];
    }
    return orderStatuses.find(s => s.value === order.status) || orderStatuses[0];
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {orderStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
                <SelectItem value="cod-pending">COD: Order Placed</SelectItem>
                <SelectItem value="cod-submitted">COD: Sent to Courier</SelectItem>
                <SelectItem value="cod-dispatched">COD: Out for Delivery</SelectItem>
                <SelectItem value="cod-delivered">COD: Delivered</SelectItem>
                <SelectItem value="cod-failed">COD: Delivery Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <p className="text-sm text-muted-foreground">Click on any row to view order details</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order);
                const StatusIcon = statusInfo.icon;
                
                // Debug logging for COD orders
                if (order.paymentMethod === 'COD') {
                  console.log(`Order ${order.orderNumber}:`, {
                    paymentMethod: order.paymentMethod,
                    codStatus: order.codStatus,
                    status: order.status,
                    statusInfo: statusInfo,
                    mappedStatus: (() => {
                      const mapFromCODStatus = (codStatus: string): string => {
                        switch (codStatus) {
                          case 'PENDING': return 'PENDING';
                          case 'SUBMITTED': return 'CONFIRMED';
                          case 'DISPATCHED': return 'SHIPPED';
                          case 'DELIVERED': return 'DELIVERED';
                          case 'FAILED': return 'CANCELLED';
                          case 'CANCELLED': return 'CANCELLED';
                          default: return 'PENDING';
                        }
                      };
                      return mapFromCODStatus(order.codStatus || 'PENDING');
                    })(),
                  });
                }
                
                                 return (
                   <React.Fragment key={order.id}>
                     <TableRow 
                       className="hover:bg-muted/50 cursor-pointer transition-colors group"
                       onClick={() => router.push(`/admin/orders/${order.id}`)}
                     >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {order.orderNumber}
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium group-hover:text-primary transition-colors">
                            {order.customer 
                              ? `${order.customer.firstName} ${order.customer.lastName}`
                              : `${order.customerFirst || 'N/A'} ${order.customerLast || ''}`
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer 
                              ? order.customer.email
                              : order.customerPhone || 'Guest Order'
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.totalCents ? order.totalCents / 100 : order.total, order.currency || 'DZD')}
                        {order.paymentMethod === 'COD' && (
                          <span className="text-xs text-blue-600 ml-1">COD</span>
                        )}
                      </TableCell>
                      <TableCell>{order.itemsCount} items</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDateTime(order.createdAt)}</div>
                          {order.updatedAt !== order.createdAt && (
                            <div className="text-muted-foreground">
                              Updated: {formatDateTime(order.updatedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (order.id) {
                                toggleRowExpansion(order.id);
                              }
                            }}
                            title="Toggle item details"
                          >
                            {order.id && expandedRows.has(order.id) ? '−' : '+'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/orders/${order.id}`);
                            }}
                            title="View order details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setShowStatusDialog(true);
                            }}
                            title="Update order status"
                          >
                            Update Status
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded row showing item details */}
                    {expandedRows.has(order.id) && order.items && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="p-4">
                            <h4 className="font-medium mb-3">Order Items:</h4>
                            <div className="space-y-2">
                              {order.items.map((item, index) => (
                                <div key={item.id || index} className="flex justify-between items-center p-2 bg-white rounded border">
                                  <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      SKU: {item.sku || 'N/A'}
                                    </div>
                                  </div>
                                                                     <div className="text-right">
                                     <div className="font-medium">
                                       {formatCurrency(item.priceCents ? item.priceCents / 100 : item.price, order.currency || 'DZD')} × {item.quantity}
                                     </div>
                                     <div className="text-sm text-muted-foreground">
                                       Total: {formatCurrency((item.priceCents ? item.priceCents / 100 : item.price) * item.quantity, order.currency || 'DZD')}
                                     </div>
                                   </div>
                                </div>
                              ))}
                            </div>
                                                                                     {order.subtotal && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Subtotal:</span>
                                  <span className="font-medium">
                                    {formatCurrency(order.subtotalCents ? order.subtotalCents / 100 : order.subtotal, order.currency || 'DZD')}
                                  </span>
                                </div>
                                {order.shipping && order.shipping > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Shipping:</span>
                                    <span className="font-medium">
                                      {formatCurrency(order.shippingCents ? order.shippingCents / 100 : order.shipping, order.currency || 'DZD')}
                                    </span>
                                  </div>
                                )}
                                {order.tax && order.tax > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Tax:</span>
                                    <span className="font-medium">
                                      {formatCurrency(order.tax, order.currency || 'DZD')}
                                    </span>
                                  </div>
                                )}
                                {order.discount && order.discount > 0 && (
                                  <div className="flex justify-between items-center text-green-600">
                                    <span className="font-medium">Discount:</span>
                                    <span className="font-medium">
                                      -{formatCurrency(order.discount, order.currency || 'DZD')}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <span className="font-medium">Order Total:</span>
                                  <span className="font-bold text-lg">
                                    {formatCurrency(order.totalCents ? order.totalCents / 100 : order.total, order.currency || 'DZD')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No orders found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      {selectedOrder && (
        <OrderStatusUpdateDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          order={selectedOrder}
          onStatusUpdate={handleStatusUpdate}
          currentStatus={selectedOrder.paymentMethod === 'COD' ? (selectedOrder.codStatus || 'PENDING') : selectedOrder.status}
        />
      )}
    </div>
  );
}
