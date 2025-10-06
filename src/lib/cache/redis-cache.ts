import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Cache durations in seconds
export const CACHE_DURATIONS = {
  PRODUCTS: 300, // 5 minutes
  CATEGORIES: 600, // 10 minutes  
  PRODUCT_DETAIL: 1800, // 30 minutes
  SEARCH_RESULTS: 180, // 3 minutes
  USER_DATA: 60, // 1 minute
  STATIC_DATA: 3600, // 1 hour
} as const;

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, { data: any; expiry: number }>();

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Get from cache (Redis first, then in-memory fallback)
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if available
      if (redis) {
        const data = await redis.get(key);
        if (data) {
          return data as T;
        }
      }

      // Fallback to in-memory cache
      const cached = this.cache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
      }

      // Remove expired entries
      if (cached && cached.expiry <= Date.now()) {
        this.cache.delete(key);
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cache (Redis and in-memory)
  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    try {
      // Serialize data to ensure it's JSON-safe
      const serializedData = JSON.parse(JSON.stringify(data));
      
      // Set in Redis if available
      if (redis) {
        await redis.setex(key, ttlSeconds, JSON.stringify(serializedData));
      }

      // Always set in in-memory cache as fallback
      this.cache.set(key, {
        data: serializedData,
        expiry: Date.now() + (ttlSeconds * 1000),
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete from cache
  async delete(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
      }
      this.cache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      if (redis) {
        await redis.flushall();
      }
      this.cache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Generate cache key
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

// Helper functions for common caching patterns
export const cache = CacheService.getInstance();

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  await cache.set(key, data, ttlSeconds);
  
  return data;
}
