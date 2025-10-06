"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import Analytics from '@/lib/analytics/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize analytics
    Analytics.init();
  }, []);

  useEffect(() => {
    // Track page views
    Analytics.trackPageView(pathname);
  }, [pathname]);

  return (
    <>
      {children}
      <VercelAnalytics />
    </>
  );
}
