import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * Regex Pattern Filtering
 * 
 * Use regular expressions for advanced pattern matching.
 * Wrap regex in forward slashes: '/pattern/'
 */
export const regexPatternsConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600
  },
  toolRules: [
    // Tools that start with 'create_'
    {
      pattern: ['/^create_/'],
      enabled: true,
      tags: ['create', 'write']
    },
    
    // Tools that start with 'get_' or 'list_'
    {
      pattern: ['/^(get|list)_/'],
      enabled: true,
      tags: ['read', 'query']
    },
    
    // Tools that start with 'update_' or 'modify_'
    {
      pattern: ['/^(update|modify)_/'],
      enabled: true,
      tags: ['update', 'write']
    },
    
    // Tools that start with 'delete_' or 'remove_'
    {
      pattern: ['/^(delete|remove)_/'],
      enabled: false,
      tags: ['delete', 'dangerous']
    },
    
    // Tools with CRUD operations
    {
      pattern: ['/(create|read|update|delete)/i'],
      tags: ['crud']
    }
  ]
};
