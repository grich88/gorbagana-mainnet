// RPC utility functions for rate limiting and caching
import { Connection } from '@solana/web3.js';

class RateLimitedConnection {
  constructor(endpoint, options = {}) {
    this.connection = new Connection(endpoint, options.commitment || 'confirmed');
    this.cache = new Map();
    this.rateLimiter = {
      requests: [],
      maxRequestsPerSecond: options.maxRequestsPerSecond || 5, // Conservative limit
      windowMs: 1000
    };
    this.cacheTTL = options.cacheTTL || 30000; // 30 seconds cache
  }

  // Rate limiting wrapper
  async makeRequest(requestFn, cacheKey = null) {
    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        console.log(`Cache hit for ${cacheKey}`);
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // Rate limiting
    await this.enforceRateLimit();

    try {
      const result = await requestFn();
      
      // Cache the result
      if (cacheKey) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      if (error.message && error.message.includes('429')) {
        console.warn('Rate limit hit, backing off...');
        await this.exponentialBackoff();
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      throw error;
    }
  }

  async enforceRateLimit() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      timestamp => now - timestamp < this.rateLimiter.windowMs
    );

    // If we're at the limit, wait
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequestsPerSecond) {
      const oldestRequest = this.rateLimiter.requests[0];
      const waitTime = this.rateLimiter.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        console.log(`Rate limiting: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.rateLimiter.requests.push(now);
  }

  async exponentialBackoff(attempt = 1) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
    console.log(`Backing off for ${delay}ms (attempt ${attempt})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Wrapped getAccountInfo with caching and rate limiting
  async getAccountInfo(publicKey, commitment) {
    const cacheKey = `account_${publicKey.toString()}_${commitment || 'confirmed'}`;
    return this.makeRequest(
      () => this.connection.getAccountInfo(publicKey, commitment),
      cacheKey
    );
  }

  // Batch multiple account info requests
  async getMultipleAccountsInfo(publicKeys, commitment) {
    const cacheKey = `multiple_${publicKeys.map(pk => pk.toString()).join('_')}_${commitment || 'confirmed'}`;
    return this.makeRequest(
      () => this.connection.getMultipleAccountsInfo(publicKeys, commitment),
      cacheKey
    );
  }

  // Other connection methods (pass through without rate limiting for non-RPC calls)
  async sendTransaction(...args) {
    return this.connection.sendTransaction(...args);
  }

  async confirmTransaction(...args) {
    return this.connection.confirmTransaction(...args);
  }

  async getLatestBlockhash(...args) {
    const cacheKey = `blockhash_${Date.now().toString().slice(0, -4)}`; // Cache for ~10 seconds
    return this.makeRequest(
      () => this.connection.getLatestBlockhash(...args),
      cacheKey
    );
  }

  // Clear cache manually if needed
  clearCache() {
    this.cache.clear();
    console.log('RPC cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
let rateLimitedConnection = null;

export const createRateLimitedConnection = (endpoint, options = {}) => {
  if (!rateLimitedConnection) {
    rateLimitedConnection = new RateLimitedConnection(endpoint, {
      maxRequestsPerSecond: 3, // Very conservative for devnet
      cacheTTL: 15000, // 15 seconds cache for frequent updates
      commitment: 'confirmed',
      ...options
    });
  }
  return rateLimitedConnection;
};

export const getRateLimitedConnection = () => {
  if (!rateLimitedConnection) {
    throw new Error('Rate limited connection not initialized');
  }
  return rateLimitedConnection;
};

// Utility function to batch account requests efficiently
export const batchAccountRequests = async (connection, requests) => {
  const publicKeys = requests.map(req => req.publicKey);
  const commitment = requests[0]?.commitment || 'confirmed';
  
  try {
    const results = await connection.getMultipleAccountsInfo(publicKeys, commitment);
    return results.map((result, index) => ({
      publicKey: publicKeys[index],
      accountInfo: result
    }));
  } catch (error) {
    console.warn('Batch request failed, falling back to individual requests', error);
    // Fallback to individual requests with delay
    const results = [];
    for (const req of requests) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between requests
        const accountInfo = await connection.getAccountInfo(req.publicKey, req.commitment);
        results.push({ publicKey: req.publicKey, accountInfo });
      } catch (err) {
        console.error(`Failed to fetch account ${req.publicKey.toString()}:`, err);
        results.push({ publicKey: req.publicKey, accountInfo: null, error: err });
      }
    }
    return results;
  }
};

export default RateLimitedConnection; 