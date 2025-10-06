export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number;
  image?: string;
  imageAlt?: string;
  category?: string;
  variantName?: string;
  isVirtual?: boolean;
  isDigital?: boolean;
  requiresShipping?: boolean;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  isDigitalOnly: () => boolean;
  needsShipping: () => boolean;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image?: string;
  imageAlt?: string;
  category?: string;
  addedAt: Date;
}

export interface WishlistState {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  initializeForUser: (userId?: string) => void;
}





