/**
 * Request deduplication and caching utility
 * Prevents multiple identical requests from being sent simultaneously
 */

interface CacheEntry<T> {
  promise: Promise<T>
  timestamp: number
  key: string
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 30000 // 30 seconds
  private readonly MAX_CACHE_SIZE = 100

  /**
   * Generate a cache key from request parameters
   */
  private generateKey(params: Record<string, any>): string {
    return JSON.stringify(params, Object.keys(params).sort())
  }

  /**
   * Clean expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.DEFAULT_TTL) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Ensure cache doesn't exceed maximum size
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return

    // Remove oldest entries
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE)
    toRemove.forEach(([key]) => this.cache.delete(key))
  }

  /**
   * Get or create a request with deduplication
   */
  async deduplicate<T>(
    key: string | Record<string, any>,
    requestFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key)
    const now = Date.now()

    // Check if we have a fresh request in progress
    const existing = this.cache.get(cacheKey)
    if (existing && (now - existing.timestamp) < ttl) {
      console.log(`Request deduplication hit for key: ${cacheKey}`)
      return existing.promise
    }

    // Create new request
    console.log(`Creating new request for key: ${cacheKey}`)
    const promise = requestFn().finally(() => {
      // Remove from cache when promise resolves/rejects
      setTimeout(() => {
        this.cache.delete(cacheKey)
      }, 1000) // Small delay to allow multiple concurrent requests to benefit
    })

    // Store in cache
    this.cache.set(cacheKey, {
      promise,
      timestamp: now,
      key: cacheKey
    })

    // Cleanup old entries
    this.cleanup()
    this.enforceMaxSize()

    return promise
  }

  /**
   * Manually clear specific cache entries
   */
  invalidate(key: string | Record<string, any>): void {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key)
    this.cache.delete(cacheKey)
    console.log(`Cache invalidated for key: ${cacheKey}`)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    console.log('Request cache cleared')
  }

  /**
   * Cleanup expired entries periodically
   */
  startPeriodicCleanup(intervalMs: number = 60000): () => void {
    const interval = setInterval(() => {
      this.cleanup()
    }, intervalMs)

    // Return cleanup function
    return () => {
      clearInterval(interval)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Global instance
export const requestCache = new RequestCache()

// Helper hook for React components
export function useRequestDeduplication() {
  return {
    deduplicate: requestCache.deduplicate.bind(requestCache),
    invalidate: requestCache.invalidate.bind(requestCache),
    clear: requestCache.clear.bind(requestCache),
    getStats: requestCache.getStats.bind(requestCache)
  }
}