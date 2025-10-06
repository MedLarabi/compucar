"use client";

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const url = pathname + searchParams.toString();
    
    // Track page views
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
      page_title: document.title,
    });

    // Track custom events for e-commerce
    window.gtag('event', 'page_view', {
      page_location: url,
      page_title: document.title,
      content_group1: getContentGroup(pathname),
    });

  }, [pathname, searchParams]);

  // Categorize pages for better analytics
  const getContentGroup = (path: string) => {
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/blog')) return 'Blog';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/account')) return 'Account';
    if (path.startsWith('/checkout')) return 'Checkout';
    if (path === '/') return 'Homepage';
    return 'Other';
  };

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_location: window.location.href,
              page_title: document.title,
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
}

// E-commerce tracking functions
export const trackPurchase = (transactionData: {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionData.transaction_id,
      value: transactionData.value,
      currency: transactionData.currency,
      items: transactionData.items,
    });
  }
};

export const trackAddToCart = (item: {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
}) => {
      if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'DZD',
        value: item.price * item.quantity,
        items: [item],
      });
    }
};

export const trackViewItem = (item: {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
}) => {
      if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'DZD',
        value: item.price,
        items: [item],
      });
    }
};

export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      ...(resultsCount !== undefined && { results_count: resultsCount }),
    });
  }
};
