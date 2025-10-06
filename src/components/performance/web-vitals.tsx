"use client";

import { useEffect } from 'react';

export function WebVitals() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Preconnect to our analytics endpoint to reduce connection setup time
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = '/api/analytics/web-vitals';
      document.head.appendChild(link);

      // Track Core Web Vitals
      const trackWebVital = (name: string, value: number) => {
        // Send to analytics (Google Analytics, etc.)
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', name, {
            event_category: 'Web Vitals',
            value: Math.round(name === 'CLS' ? value * 1000 : value),
            event_label: window.location.pathname,
            non_interaction: true,
          });
        }

        // Send to your own analytics endpoint
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            value,
            path: window.location.pathname,
            timestamp: Date.now(),
          }),
        }).catch(() => {
          // Silent fail for analytics
        });
      };

      // Import web-vitals library dynamically
      import('web-vitals').then(({ onCLS, onFCP, onFID, onLCP, onTTFB }) => {
        onCLS((metric) => trackWebVital(metric.name, metric.value));
        onFCP((metric) => trackWebVital(metric.name, metric.value));
        onFID((metric) => trackWebVital(metric.name, metric.value));
        onLCP((metric) => trackWebVital(metric.name, metric.value));
        onTTFB((metric) => trackWebVital(metric.name, metric.value));
      }).catch((error) => {
        // Silent fail if web-vitals not available
        console.debug('Web Vitals library not available:', error);
      });

      // Basic performance tracking
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            
            // Track page load time
            const loadTime = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
            if (loadTime > 0) {
              trackWebVital('page_load_time', loadTime);
            }

            // Track Time to Interactive
            const tti = navigationEntry.domInteractive - navigationEntry.navigationStart;
            if (tti > 0) {
              trackWebVital('time_to_interactive', tti);
            }
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => {
        observer.disconnect();
        document.head.removeChild(link);
      };
    }
  }, []);

  return null;
}

// Global type declaration for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
