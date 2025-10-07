import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load admin components
export const LazyRichTextEditor = dynamic(
  () => import('@/components/ui/smooth-rich-text-editor').then(mod => ({ default: mod.SmoothRichTextEditor })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

export const LazyProductForm = dynamic(
  () => import('@/components/admin/enhanced-product-form').then(mod => ({ default: mod.EnhancedProductForm })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
  }
);

export const LazyImageUpload = dynamic(
  () => import('@/components/uploads/advanced-product-image-upload').then(mod => ({ default: mod.AdvancedProductImageUpload })),
  {
    loading: () => <Skeleton className="h-40 w-full" />,
    ssr: false,
  }
);

export const LazyAnalytics = dynamic(
  () => import('@/components/admin/analytics-dashboard').then(mod => ({ default: mod.AnalyticsDashboard })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    ),
  }
);

