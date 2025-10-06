// Performance monitoring script
(function() {
  'use strict';

  // Web Vitals monitoring
  function measureWebVitals() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.startTime;
          
          console.log('LCP:', lcp);
          
          // Send to analytics if needed
          if (window.gtag) {
            gtag('event', 'web_vitals', {
              name: 'LCP',
              value: Math.round(lcp),
              event_category: 'Performance'
            });
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP measurement failed:', e);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fid = entry.processingStart - entry.startTime;
            
            console.log('FID:', fid);
            
            if (window.gtag) {
              gtag('event', 'web_vitals', {
                name: 'FID',
                value: Math.round(fid),
                event_category: 'Performance'
              });
            }
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID measurement failed:', e);
      }

      // Cumulative Layout Shift
      try {
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
          
          console.log('CLS:', clsScore);
          
          if (window.gtag) {
            gtag('event', 'web_vitals', {
              name: 'CLS',
              value: Math.round(clsScore * 1000), // Convert to milliseconds
              event_category: 'Performance'
            });
          }
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS measurement failed:', e);
      }
    }

    // First Contentful Paint
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const paintEntries = performance.getEntriesByType('paint');
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          
          if (fcpEntry) {
            console.log('FCP:', fcpEntry.startTime);
            
            if (window.gtag) {
              gtag('event', 'web_vitals', {
                name: 'FCP',
                value: Math.round(fcpEntry.startTime),
                event_category: 'Performance'
              });
            }
          }
        }, 0);
      });
    }
  }

  // Resource loading optimization
  function optimizeResourceLoading() {
    // Lazy load images that are not in viewport
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px'
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }

    // Preload critical resources
    const criticalResources = [
      '/api/products?limit=8&featured=true',
      '/api/categories'
    ];

    criticalResources.forEach(url => {
      fetch(url, { priority: 'high' }).catch(() => {
        // Silently fail - this is just a preload
      });
    });
  }

  // Initialize performance monitoring
  function init() {
    // Only run in production
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return;
    }

    measureWebVitals();
    optimizeResourceLoading();

    // Monitor page load performance
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log('Page load time:', loadTime + 'ms');
      
      if (window.gtag) {
        gtag('event', 'page_load_time', {
          value: loadTime,
          event_category: 'Performance'
        });
      }
    });

    // Monitor route changes (for SPA navigation)
    let lastUrl = location.href;
    const routeChangeObserver = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('Route changed to:', currentUrl);
        
        // Re-optimize newly loaded content
        setTimeout(optimizeResourceLoading, 100);
      }
    });

    routeChangeObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Start monitoring when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
