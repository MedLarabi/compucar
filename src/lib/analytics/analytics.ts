import { track } from '@vercel/analytics';
import mixpanel from 'mixpanel-browser';

// Initialize analytics services
class Analytics {
  private static isInitialized = false;

  static init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Initialize Mixpanel
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: 'localStorage',
      });
    }

    this.isInitialized = true;
  }

  // Page tracking
  static trackPageView(page: string, properties?: Record<string, any>) {
    this.init();
    
    // Vercel Analytics
    track('page_view', { page, ...properties });
    
    // Mixpanel
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('Page View', { page, ...properties });
    }
  }

  // E-commerce events
  static trackProductView(productId: string, productName: string, category: string, price: number) {
    this.init();
    
    const properties = {
      product_id: productId,
      product_name: productName,
      category,
      price,
    };

    track('product_view', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('Product View', properties);
    }
  }

  static trackAddToCart(productId: string, productName: string, price: number, quantity: number) {
    this.init();
    
    const properties = {
      product_id: productId,
      product_name: productName,
      price,
      quantity,
      value: price * quantity,
    };

    track('add_to_cart', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('Add to Cart', properties);
    }
  }

  static trackRemoveFromCart(productId: string, productName: string, price: number, quantity: number) {
    this.init();
    
    const properties = {
      product_id: productId,
      product_name: productName,
      price,
      quantity,
      value: price * quantity,
    };

    track('remove_from_cart', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('Remove from Cart', properties);
    }
  }

  static trackPurchase(orderId: string, total: number, items: any[]) {
    this.init();
    
    const properties = {
      order_id: orderId,
      total,
      item_count: items.length,
      items: items.map(item => ({
        product_id: item.productId,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    track('purchase', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('Purchase', properties);
    }
  }

  // User events
  static trackUserRegister(userId: string, method: string) {
    this.init();
    
    const properties = {
      user_id: userId,
      method, // 'email', 'google', 'github'
    };

    track('user_register', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('User Register', properties);
      mixpanel.identify(userId);
    }
  }

  static trackUserLogin(userId: string, method: string) {
    this.init();
    
    const properties = {
      user_id: userId,
      method,
    };

    track('user_login', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('User Login', properties);
      mixpanel.identify(userId);
    }
  }

  static trackSearch(query: string, resultsCount: number) {
    this.init();
    
    const properties = {
      search_query: query,
      results_count: resultsCount,
    };

    track('search', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('Search', properties);
    }
  }

  // Wishlist events
  static trackAddToWishlist(productId: string, productName: string) {
    this.init();
    
    const properties = {
      product_id: productId,
      product_name: productName,
    };

    track('add_to_wishlist', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('Add to Wishlist', properties);
    }
  }

  static trackRemoveFromWishlist(productId: string, productName: string) {
    this.init();
    
    const properties = {
      product_id: productId,
      product_name: productName,
    };

    track('remove_from_wishlist', properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track('Remove from Wishlist', properties);
    }
  }

  // Custom events
  static trackCustomEvent(eventName: string, properties?: Record<string, any>) {
    this.init();
    
    track(eventName, properties);
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track(eventName, properties);
    }
  }

  // User properties
  static setUserProperties(userId: string, properties: Record<string, any>) {
    this.init();
    
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.identify(userId);
      mixpanel.people.set(properties);
    }
  }

  // Reset on logout
  static reset() {
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.reset();
    }
  }
}

export default Analytics;
