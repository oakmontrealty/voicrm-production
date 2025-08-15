// Server-side caching configuration for dynamic content
// This provides caching strategies for API routes and dynamic pages

class CacheManager {
  constructor() {
    // In-memory cache for development
    // In production, use Redis or similar
    this.cache = new Map();
    this.ttlMap = new Map();
  }

  // Set cache with TTL (time to live in seconds)
  set(key, value, ttl = 300) {
    this.cache.set(key, value);
    
    // Set expiration
    const expirationTime = Date.now() + (ttl * 1000);
    this.ttlMap.set(key, expirationTime);
    
    // Auto-cleanup
    setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);
    
    return value;
  }

  // Get from cache
  get(key) {
    // Check if expired
    const expiration = this.ttlMap.get(key);
    if (expiration && Date.now() > expiration) {
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key) || null;
  }

  // Delete from cache
  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  // Clear entire cache
  clear() {
    this.cache.clear();
    this.ttlMap.clear();
  }

  // Get cache stats
  getStats() {
    const validEntries = Array.from(this.ttlMap.entries())
      .filter(([key, expiration]) => Date.now() <= expiration);
    
    return {
      size: validEntries.length,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: this.getOldestEntry(),
      keys: Array.from(this.cache.keys())
    };
  }

  estimateMemoryUsage() {
    let totalSize = 0;
    for (const value of this.cache.values()) {
      totalSize += JSON.stringify(value).length;
    }
    return `~${(totalSize / 1024).toFixed(2)} KB`;
  }

  getOldestEntry() {
    let oldest = null;
    let oldestTime = Infinity;
    
    for (const [key, expiration] of this.ttlMap.entries()) {
      if (expiration < oldestTime) {
        oldestTime = expiration;
        oldest = key;
      }
    }
    
    return oldest;
  }
}

// Cache strategies
export const CacheStrategies = {
  // Cache for short duration (5 minutes)
  SHORT: 300,
  
  // Cache for medium duration (30 minutes)
  MEDIUM: 1800,
  
  // Cache for long duration (1 hour)
  LONG: 3600,
  
  // Cache for very long duration (24 hours)
  VERY_LONG: 86400
};

// Create singleton instance
const cacheManager = new CacheManager();

// Cache middleware for API routes
export function withCache(handler, options = {}) {
  const {
    ttl = CacheStrategies.SHORT,
    keyGenerator = (req) => `${req.method}:${req.url}`,
    shouldCache = () => true
  } = options;

  return async (req, res) => {
    // Check if caching should be applied
    if (!shouldCache(req, res)) {
      return handler(req, res);
    }

    // Generate cache key
    const cacheKey = keyGenerator(req);
    
    // Try to get from cache
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      // Add cache headers
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttl}`);
      
      return res.status(200).json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = (data) => {
      // Cache the successful response
      if (res.statusCode === 200) {
        cacheManager.set(cacheKey, data, ttl);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);
      }
      
      return originalJson(data);
    };

    // Call the original handler
    return handler(req, res);
  };
}

// Cache specific data types
export const DataCache = {
  // Cache contact data
  contacts: {
    set: (userId, contacts) => {
      return cacheManager.set(`contacts:${userId}`, contacts, CacheStrategies.MEDIUM);
    },
    get: (userId) => {
      return cacheManager.get(`contacts:${userId}`);
    },
    invalidate: (userId) => {
      cacheManager.delete(`contacts:${userId}`);
    }
  },

  // Cache call logs
  callLogs: {
    set: (userId, logs) => {
      return cacheManager.set(`calls:${userId}`, logs, CacheStrategies.SHORT);
    },
    get: (userId) => {
      return cacheManager.get(`calls:${userId}`);
    },
    invalidate: (userId) => {
      cacheManager.delete(`calls:${userId}`);
    }
  },

  // Cache analytics data
  analytics: {
    set: (key, data) => {
      return cacheManager.set(`analytics:${key}`, data, CacheStrategies.LONG);
    },
    get: (key) => {
      return cacheManager.get(`analytics:${key}`);
    },
    invalidate: (key) => {
      cacheManager.delete(`analytics:${key}`);
    }
  },

  // Cache user settings
  settings: {
    set: (userId, settings) => {
      return cacheManager.set(`settings:${userId}`, settings, CacheStrategies.VERY_LONG);
    },
    get: (userId) => {
      return cacheManager.get(`settings:${userId}`);
    },
    invalidate: (userId) => {
      cacheManager.delete(`settings:${userId}`);
    }
  }
};

// HTTP cache headers helper
export function setCacheHeaders(res, options = {}) {
  const {
    maxAge = 300, // 5 minutes default
    sMaxAge = 600, // 10 minutes for CDN
    staleWhileRevalidate = 86400, // 24 hours
    isPublic = true
  } = options;

  const directives = [];
  
  if (isPublic) {
    directives.push('public');
  } else {
    directives.push('private');
  }
  
  directives.push(`max-age=${maxAge}`);
  directives.push(`s-maxage=${sMaxAge}`);
  directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  
  res.setHeader('Cache-Control', directives.join(', '));
}

// Edge caching configuration for Vercel
export const edgeConfig = {
  // Static assets
  static: {
    '/_next/static/': {
      maxAge: 31536000, // 1 year
      immutable: true
    },
    '/images/': {
      maxAge: 86400, // 24 hours
      sMaxAge: 604800 // 7 days for CDN
    },
    '/fonts/': {
      maxAge: 31536000, // 1 year
      immutable: true
    }
  },
  
  // API routes
  api: {
    '/api/contacts': {
      maxAge: 300, // 5 minutes
      sMaxAge: 600, // 10 minutes
      staleWhileRevalidate: 3600 // 1 hour
    },
    '/api/analytics': {
      maxAge: 1800, // 30 minutes
      sMaxAge: 3600, // 1 hour
      staleWhileRevalidate: 86400 // 24 hours
    },
    '/api/settings': {
      maxAge: 3600, // 1 hour
      sMaxAge: 7200, // 2 hours
      staleWhileRevalidate: 604800 // 7 days
    }
  },
  
  // Pages
  pages: {
    '/': {
      maxAge: 0,
      sMaxAge: 60, // 1 minute
      staleWhileRevalidate: 300 // 5 minutes
    },
    '/dashboard': {
      maxAge: 0,
      sMaxAge: 120, // 2 minutes
      staleWhileRevalidate: 600 // 10 minutes
    },
    '/contacts': {
      maxAge: 0,
      sMaxAge: 300, // 5 minutes
      staleWhileRevalidate: 1800 // 30 minutes
    }
  }
};

// Export cache manager instance
export default cacheManager;