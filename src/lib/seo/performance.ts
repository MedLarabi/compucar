/**
 * SEO Performance Optimization Utilities
 * 
 * Tools and configurations for optimizing Core Web Vitals
 * and overall site performance for better SEO rankings.
 */

// Core Web Vitals thresholds (as per Google's standards)
export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: { // Largest Contentful Paint
    GOOD: 2500,    // <= 2.5s
    NEEDS_IMPROVEMENT: 4000, // 2.5s - 4s
    POOR: Infinity // > 4s
  },
  FID: { // First Input Delay
    GOOD: 100,     // <= 100ms
    NEEDS_IMPROVEMENT: 300, // 100ms - 300ms
    POOR: Infinity // > 300ms
  },
  CLS: { // Cumulative Layout Shift
    GOOD: 0.1,     // <= 0.1
    NEEDS_IMPROVEMENT: 0.25, // 0.1 - 0.25
    POOR: Infinity // > 0.25
  },
  FCP: { // First Contentful Paint
    GOOD: 1800,    // <= 1.8s
    NEEDS_IMPROVEMENT: 3000, // 1.8s - 3s
    POOR: Infinity // > 3s
  },
  TTFB: { // Time to First Byte
    GOOD: 800,     // <= 0.8s
    NEEDS_IMPROVEMENT: 1800, // 0.8s - 1.8s
    POOR: Infinity // > 1.8s
  }
};

// Performance optimization configurations
export const PERFORMANCE_CONFIG = {
  // Image optimization settings
  IMAGES: {
    // Formats in order of preference
    FORMATS: ['webp', 'avif', 'jpeg'],
    // Quality settings
    QUALITY: {
      high: 85,
      medium: 75,
      low: 60
    },
    // Responsive breakpoints
    BREAKPOINTS: [640, 768, 1024, 1280, 1536],
    // Lazy loading threshold
    LAZY_THRESHOLD: '50px'
  },
  
  // CSS optimization
  CSS: {
    // Critical CSS size limit
    CRITICAL_SIZE_LIMIT: 14336, // 14KB
    // Minification settings
    MINIFY: true,
    // Purge unused CSS
    PURGE: true
  },
  
  // JavaScript optimization
  JS: {
    // Bundle size limits
    MAX_BUNDLE_SIZE: 244000, // 244KB
    // Code splitting threshold
    SPLIT_THRESHOLD: 20000, // 20KB
    // Tree shaking
    TREE_SHAKE: true
  },
  
  // Caching strategies
  CACHE: {
    // Static assets cache duration (1 year)
    STATIC_CACHE_DURATION: 31536000,
    // API cache duration (5 minutes)
    API_CACHE_DURATION: 300,
    // Page cache duration (1 hour)
    PAGE_CACHE_DURATION: 3600
  }
};

// Performance monitoring utilities
export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

export function analyzeWebVital(metric: WebVitalsMetric): {
  rating: string;
  recommendation: string;
  impact: string;
} {
  const { name, value } = metric;
  const thresholds = CORE_WEB_VITALS_THRESHOLDS[name];
  
  let rating: string;
  let recommendation: string;
  let impact: string;
  
  if (value <= thresholds.GOOD) {
    rating = 'good';
    recommendation = `${name} is performing well. Maintain current optimization strategies.`;
    impact = 'Positive impact on SEO rankings and user experience.';
  } else if (value <= thresholds.NEEDS_IMPROVEMENT) {
    rating = 'needs-improvement';
    recommendation = getImprovementRecommendation(name);
    impact = 'May negatively impact SEO rankings. Optimization recommended.';
  } else {
    rating = 'poor';
    recommendation = getUrgentRecommendation(name);
    impact = 'Likely negative impact on SEO rankings. Immediate optimization required.';
  }
  
  return { rating, recommendation, impact };
}

function getImprovementRecommendation(metric: string): string {
  const recommendations = {
    LCP: 'Optimize largest contentful paint by: reducing server response times, optimizing images, removing unused CSS/JS, using CDN.',
    FID: 'Improve first input delay by: breaking up long tasks, optimizing JavaScript execution, using web workers.',
    CLS: 'Reduce cumulative layout shift by: setting dimensions for images/videos, avoiding dynamic content injection, using transform animations.',
    FCP: 'Optimize first contentful paint by: eliminating render-blocking resources, minifying CSS, optimizing fonts.',
    TTFB: 'Reduce time to first byte by: optimizing server performance, using CDN, implementing efficient caching.'
  };
  
  return recommendations[metric as keyof typeof recommendations] || 'Review performance optimization strategies.';
}

function getUrgentRecommendation(metric: string): string {
  const recommendations = {
    LCP: 'URGENT: Implement image optimization, enable compression, consider upgrading hosting, remove unnecessary third-party scripts.',
    FID: 'URGENT: Defer non-critical JavaScript, reduce JavaScript execution time, consider code splitting.',
    CLS: 'URGENT: Fix layout shifts by setting explicit dimensions, avoiding late-loading content, optimizing font loading.',
    FCP: 'URGENT: Remove render-blocking resources, inline critical CSS, optimize server response times.',
    TTFB: 'URGENT: Upgrade server infrastructure, implement aggressive caching, optimize database queries.'
  };
  
  return recommendations[metric as keyof typeof recommendations] || 'URGENT: Immediate performance optimization required.';
}

// Image optimization utilities
export function generateImageSrcSet(
  baseUrl: string, 
  breakpoints: number[] = PERFORMANCE_CONFIG.IMAGES.BREAKPOINTS
): string {
  return breakpoints
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

export function generateImageSizes(
  breakpoints: number[] = PERFORMANCE_CONFIG.IMAGES.BREAKPOINTS
): string {
  const sizes = breakpoints.map((width, index) => {
    if (index === breakpoints.length - 1) {
      return `${width}px`;
    }
    return `(max-width: ${width}px) ${width}px`;
  });
  
  return sizes.join(', ');
}

// Resource hints for performance
export const RESOURCE_HINTS = {
  // DNS prefetching for external domains
  DNS_PREFETCH: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://www.google-analytics.com',
    'https://js.stripe.com'
  ],
  
  // Preconnect to critical third-party origins
  PRECONNECT: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ],
  
  // Preload critical resources
  PRELOAD: {
    fonts: [
      '/fonts/inter-var.woff2'
    ],
    images: [
      '/images/hero-bg.webp'
    ],
    css: [
      '/styles/critical.css'
    ]
  }
};

// Performance budget configuration
export const PERFORMANCE_BUDGET = {
  // Network requests
  REQUESTS: {
    total: 50,
    images: 20,
    scripts: 10,
    stylesheets: 5,
    fonts: 3
  },
  
  // File sizes (in KB)
  SIZES: {
    totalJS: 300,
    totalCSS: 100,
    totalImages: 500,
    individualImage: 100,
    individualScript: 50
  },
  
  // Timing budgets (in ms)
  TIMINGS: {
    LCP: 2500,
    FCP: 1800,
    TTI: 3800, // Time to Interactive
    TBT: 300   // Total Blocking Time
  }
};

// SEO performance scoring
export function calculatePerformanceScore(metrics: {
  LCP: number;
  FID: number;
  CLS: number;
  FCP: number;
  TTFB: number;
}): {
  score: number;
  grade: string;
  recommendations: string[];
} {
  const scores = {
    LCP: getMetricScore(metrics.LCP, CORE_WEB_VITALS_THRESHOLDS.LCP),
    FID: getMetricScore(metrics.FID, CORE_WEB_VITALS_THRESHOLDS.FID),
    CLS: getMetricScore(metrics.CLS, CORE_WEB_VITALS_THRESHOLDS.CLS),
    FCP: getMetricScore(metrics.FCP, CORE_WEB_VITALS_THRESHOLDS.FCP),
    TTFB: getMetricScore(metrics.TTFB, CORE_WEB_VITALS_THRESHOLDS.TTFB)
  };
  
  // Weighted average (Core Web Vitals have higher weight)
  const totalScore = (
    scores.LCP * 0.25 +  // 25%
    scores.FID * 0.25 +  // 25%
    scores.CLS * 0.25 +  // 25%
    scores.FCP * 0.15 +  // 15%
    scores.TTFB * 0.10   // 10%
  );
  
  const grade = getPerformanceGrade(totalScore);
  const recommendations = generateRecommendations(scores, metrics);
  
  return {
    score: Math.round(totalScore),
    grade,
    recommendations
  };
}

function getMetricScore(value: number, thresholds: any): number {
  if (value <= thresholds.GOOD) return 100;
  if (value <= thresholds.NEEDS_IMPROVEMENT) {
    // Linear interpolation between 100 and 50
    const ratio = (value - thresholds.GOOD) / (thresholds.NEEDS_IMPROVEMENT - thresholds.GOOD);
    return 100 - (ratio * 50);
  }
  // Poor performance gets 0-50 score
  return Math.max(0, 50 - ((value - thresholds.NEEDS_IMPROVEMENT) / thresholds.NEEDS_IMPROVEMENT) * 50);
}

function getPerformanceGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateRecommendations(scores: any, metrics: any): string[] {
  const recommendations = [];
  
  if (scores.LCP < 75) {
    recommendations.push('Optimize Largest Contentful Paint: Reduce server response time and optimize images');
  }
  if (scores.FID < 75) {
    recommendations.push('Improve First Input Delay: Minimize JavaScript execution time');
  }
  if (scores.CLS < 75) {
    recommendations.push('Reduce Cumulative Layout Shift: Set explicit dimensions for dynamic content');
  }
  if (scores.FCP < 75) {
    recommendations.push('Optimize First Contentful Paint: Remove render-blocking resources');
  }
  if (scores.TTFB < 75) {
    recommendations.push('Reduce Time to First Byte: Optimize server performance and caching');
  }
  
  return recommendations;
}
