import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Providers } from "@/components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "CompuCar - Auto Diagnostic Tools & Equipment",
  description: "Premium auto diagnostic tools and equipment for all vehicle types. Quality guaranteed.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "CompuCar - Auto Parts & Accessories",
    description: "Premium automotive parts and accessories for all vehicle types. Quality guaranteed.",
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CompuCar - Auto Parts & Accessories",
    description: "Premium automotive parts and accessories for all vehicle types. Quality guaranteed.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical resource preloading */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//uploadthing.com" />
        <link rel="dns-prefetch" href="//utfs.io" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://uploadthing.com" />
        <link rel="preconnect" href="https://utfs.io" />
        
        {/* Critical CSS hints */}
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#000000" />
        
        {/* Viewport meta for better mobile performance */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        
        {/* Analytics and performance monitoring */}
        <Script
          src="/scripts/performance-monitor.js"
          strategy="afterInteractive"
        />
        
        {/* Service Worker: only register in production; aggressively unregister in dev to avoid stale caches */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              const isProd = ${process.env.NODE_ENV === 'production' ? 'true' : 'false'};
              if (isProd) {
                navigator.serviceWorker
                  .register('/sw.js', { scope: '/' })
                  .catch(() => console.log('SW registration failed'));
              } else {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  registrations.forEach(reg => reg.unregister());
                });
                if (window.caches) {
                  caches.keys().then(keys => keys.forEach(key => caches.delete(key))).catch(() => {});
                }
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}