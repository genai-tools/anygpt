import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * Zero-Config Setup
 * 
 * The simplest configuration - just enable discovery with defaults.
 * Perfect for getting started quickly.
 */
export const zeroConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600 // 1 hour
  }
};
