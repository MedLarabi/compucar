export interface Address {
  id?: string;
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
  isDefault?: boolean;
  // Digital checkout specific fields
  email?: string;
  newsletter?: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  name: string;
  icon?: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image?: string;
  variantName?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  billingAddress: Address;
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
}

export interface CheckoutState {
  step: 'cart' | 'checkout' | 'success';
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    newsletter: boolean;
  } | null;
  paymentMethod: PaymentMethod | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStep: (step: CheckoutState['step']) => void;
  setCustomerInfo: (info: { firstName: string; lastName: string; email: string; newsletter: boolean }) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  billingAddress: Address;
  shippingAddress: Address;
  shippingMethodId: string;
  paymentMethodId: string;
}

export interface CreateOrderResponse {
  order: Order;
  clientSecret?: string; // For Stripe payment intent
  paymentUrl?: string; // For external payment providers
}







