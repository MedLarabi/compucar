"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalyticsEnhanced({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Load Google Analytics script
    const script1 = document.createElement("script");
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script1.async = true;
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
        // Enhanced measurement
        enhanced_measurement: {
          scroll_events: true,
          outbound_links: true,
          site_search: true,
          video_engagement: true,
          file_downloads: true
        },
        // Custom parameters for e-commerce
        custom_map: {
          'custom_parameter_1': 'product_category',
          'custom_parameter_2': 'user_type'
        }
      });

      // Track Core Web Vitals
      gtag('config', '${measurementId}', {
        custom_map: {
          custom_parameter_3: 'CLS',
          custom_parameter_4: 'LCP', 
          custom_parameter_5: 'FID'
        }
      });
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [measurementId]);

  return null;
}

// Enhanced tracking utilities
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const trackPurchase = (transactionId: string, items: any[], value: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: transactionId,
      value: value,
      currency: "DZD",
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price
      }))
    });
  }
};

export const trackAddToCart = (item: any) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency: "DZD",
      value: item.price * item.quantity,
      items: [{
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price
      }]
    });
  }
};

export const trackViewItem = (item: any) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      currency: "DZD",
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        price: item.price
      }]
    });
  }
};

export const trackSearch = (searchTerm: string, category?: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "search", {
      search_term: searchTerm,
      category: category
    });
  }
};

export const trackWebVital = (name: string, value: number, id: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, {
      event_category: "Web Vitals",
      event_label: id,
      value: Math.round(name === "CLS" ? value * 1000 : value),
      non_interaction: true,
    });
  }
};

export const trackUserEngagement = (engagementTime: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "user_engagement", {
      engagement_time_msec: engagementTime
    });
  }
};

export const trackScrollDepth = (scrollDepth: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "scroll", {
      event_category: "engagement",
      event_label: `${scrollDepth}%`,
      value: scrollDepth
    });
  }
};
