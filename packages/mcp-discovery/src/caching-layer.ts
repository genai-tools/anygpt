import type { ServerMetadata, ToolMetadata } from './types.js';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number | null; // null = never expires
}

/**
 * Caching layer for discovery engine
 * Supports TTL-based caching for servers and tool summaries
 * Indefinite caching for tool details
 */
export class CachingLayer {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Cache server list with TTL
   * 
   * @param servers - Array of server metadata
   * @param ttl - Time-to-live in seconds
   */
  cacheServerList(servers: ServerMetadata[], ttl: number): void {
    this.cache.set('servers', {
      data: servers,
      expiresAt: Date.now() + ttl * 1000
    });
  }

  /**
   * Get cached server list
   * 
   * @returns Cached server list or null if not cached/expired
   */
  getServerList(): ServerMetadata[] | null {
    return this.get<ServerMetadata[]>('servers');
  }

  /**
   * Cache tool summaries for a specific server with TTL
   * 
   * @param server - Server name
   * @param tools - Array of tool metadata
   * @param ttl - Time-to-live in seconds
   */
  cacheToolSummaries(server: string, tools: ToolMetadata[], ttl: number): void {
    const key = `tools:${server}`;
    this.cache.set(key, {
      data: tools,
      expiresAt: Date.now() + ttl * 1000
    });
  }

  /**
   * Get cached tool summaries for a specific server
   * 
   * @param server - Server name
   * @returns Cached tool summaries or null if not cached/expired
   */
  getToolSummaries(server: string): ToolMetadata[] | null {
    const key = `tools:${server}`;
    return this.get<ToolMetadata[]>(key);
  }

  /**
   * Cache tool details indefinitely
   * 
   * @param server - Server name
   * @param tool - Tool name
   * @param details - Tool metadata with full details
   */
  cacheToolDetails(server: string, tool: string, details: ToolMetadata): void {
    const key = `tool:${server}:${tool}`;
    this.cache.set(key, {
      data: details,
      expiresAt: null // Never expires
    });
  }

  /**
   * Get cached tool details
   * 
   * @param server - Server name
   * @param tool - Tool name
   * @returns Cached tool details or null if not cached
   */
  getToolDetails(server: string, tool: string): ToolMetadata | null {
    const key = `tool:${server}:${tool}`;
    return this.get<ToolMetadata>(key);
  }

  /**
   * Invalidate a specific cache key
   * 
   * @param key - Cache key to invalidate (e.g., 'servers', 'tools:github')
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all caches
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Get cached value if not expired
   * 
   * @param key - Cache key
   * @returns Cached value or null if not cached/expired
   */
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired (null expiresAt means never expires)
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }
}
