/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    // Allow images from external sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-540795e0ce01450bb2eabc5acd5c3dcd.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'carworkshop.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Performance optimizations
  poweredByHeader: false,
  
  // Temporarily disable experimental features to debug
  // experimental: {
  //   optimizeCss: true,
  //   scrollRestoration: true,
  // },
  
  // Simplified configuration - removed experimental features causing webpack issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      // Long-term caching for Next static assets
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache static assets
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=31536000' },
        ],
      },
      // Cache fonts
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache icons and manifest
      {
        source: '/(apple-touch-icon|favicon|manifest)\\.(png|ico|json|svg)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      // API responses: prevent caching by proxies unless you set it per-route
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
}

// Optional: bundle analyzer (enable by setting ANALYZE=true)
let exportedConfig = nextConfig
if (process.env.ANALYZE === 'true') {
  const withAnalyzer = (await import('@next/bundle-analyzer')).default({ enabled: true })
  exportedConfig = withAnalyzer(nextConfig)
}

// Don't wrap with Sentry in development to avoid conflicts

export default exportedConfig


