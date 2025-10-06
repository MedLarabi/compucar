"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

interface OrderStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>;
  currentStatus: string;
}

const orderStatuses = [
  { value: "PENDING", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800", description: "Order received, awaiting confirmation" },
  { value: "CONFIRMED", label: "Confirmed", icon: Package, color: "bg-blue-100 text-blue-800", description: "Order confirmed, preparing for shipment" },
  { value: "SHIPPED", label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-800", description: "Order shipped to customer" },
  { value: "DELIVERED", label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-800", description: "Order successfully delivered" },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800", description: "Order cancelled by customer or admin" },
  { value: "REFUNDED", label: "Refunded", icon: AlertCircle, color: "bg-gray-100 text-gray-800", description: "Order refunded to customer" },
];

// COD-specific statuses
const codStatuses = [
  { value: "PENDING", label: "Order Placed", icon: Clock, color: "bg-yellow-100 text-yellow-800", description: "Customer has placed the order" },
  { value: "SUBMITTED", label: "Sent to Courier", icon: Package, color: "bg-blue-100 text-blue-800", description: "Order submitted to Yalidine for delivery" },
  { value: "DISPATCHED", label: "Out for Delivery", icon: Truck, color: "bg-purple-100 text-purple-800", description: "Package is out for delivery" },
  { value: "DELIVERED", label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-800", description: "Package delivered and payment collected" },
  { value: "FAILED", label: "Delivery Failed", icon: XCircle, color: "bg-red-100 text-red-800", description: "Delivery attempt failed" },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle, color: "bg-gray-100 text-gray-800", description: "Order cancelled" },
];

export function OrderStatusUpdateDialog({
  open,
  onOpenChange,
  order,
  onStatusUpdate,
  currentStatus,
}: OrderStatusUpdateDialogProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (newStatus === currentStatus) {
      onOpenChange(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusInfo = (status: string, isCOD = false) => {
    if (isCOD) {
      // Map COD statuses back to regular statuses for display
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
      const mappedStatus = mapFromCODStatus(status);
      return orderStatuses.find(s => s.value === mappedStatus) || orderStatuses[0];
    }
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  const isCODOrder = order.paymentMethod === 'COD';
  const currentStatusInfo = getStatusInfo(currentStatus, isCODOrder);
  // For newStatus, don't treat it as COD status since it comes from the regular dropdown
  const newStatusInfo = getStatusInfo(newStatus, false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Change the status of this order. This will update the order status and may trigger automated processes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Order Details</h3>
              <div className="text-sm text-muted-foreground space-y-1 mt-1">
                <div>Order #{order.orderNumber}</div>
                <div>Customer: {order.customer 
                  ? `${order.customer.firstName} ${order.customer.lastName}`
                  : `${order.customerFirst || 'N/A'} ${order.customerLast || ''}`
                }</div>
                <div>Total: {order.totalCents 
                  ? formatCurrency(order.totalCents / 100, order.currency || 'DZD')
                  : formatCurrency(order.total, order.currency || 'DZD')
                }</div>
                <div>Items: {order.itemsCount}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium">Current Status</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={currentStatusInfo.color}>
                  {currentStatusInfo.icon && <currentStatusInfo.icon className="h-3 w-3 mr-1" />}
                  {currentStatusInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-3">
            <Label htmlFor="status">New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      {status.icon && <status.icon className="h-4 w-4" />}
                      <div>
                        <div className="font-medium">{status.label}</div>
                        <div className="text-xs text-muted-foreground">{status.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {newStatus !== currentStatus && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className={newStatusInfo.color}>
                    {newStatusInfo.icon && <newStatusInfo.icon className="h-3 w-3 mr-1" />}
                    {newStatusInfo.label}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">New status will be applied</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || newStatus === currentStatus}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
