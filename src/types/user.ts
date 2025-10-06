export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
  phone?: string | null;
  dateOfBirth?: Date | null;
  preferences: UserPreferences;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  newsletter: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  type: 'billing' | 'shipping' | 'both';
  isDefault: boolean;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
}

export interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  wishlistItems: number;
  recentOrders: UserOrder[];
  accountCreated: Date;
}

























































