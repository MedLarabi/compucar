import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy client components
export const LazyProductSearch = dynamic(
  () => import('@/components/search/search-results').then(mod => ({ default: mod.SearchResults })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    ),
  }
);

export const LazyShoppingCart = dynamic(
  () => import('@/components/cart/cart-sidebar').then(mod => ({ default: mod.CartSidebar })),
  {
    loading: () => <Skeleton className="h-96 w-80" />,
    ssr: false,
  }
);

export const LazyCheckoutForm = dynamic(
  () => import('@/components/checkout/checkout-form').then(mod => ({ default: mod.CheckoutForm })),
  {
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    ),
  }
);

export const LazyPaymentForm = dynamic(
  () => import('@/components/checkout/payment-form').then(mod => ({ default: mod.PaymentForm })),
  {
    loading: () => <Skeleton className="h-48 w-full" />,
    ssr: false,
  }
);

export const LazyWishlistPage = dynamic(
  () => import('@/app/wishlist/page'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    ),
  }
);
