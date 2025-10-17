import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * Glob Pattern Filtering
 * 
 * Use glob patterns to filter tools by name.
 * Supports wildcards: *, ?, [abc], [!abc]
 */
export const globPatternsConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600
  },
  toolRules: [
    // Enable all GitHub tools
    {
      pattern: ['*github*'],
      enabled: true,
      tags: ['github', 'vcs']
    },
    
    // Enable tools that start with 'create_'
    {
      pattern: ['create_*'],
      enabled: true,
      tags: ['create', 'write']
    },
    
    // Enable tools that end with '_issue'
    {
      pattern: ['*_issue'],
      enabled: true,
      tags: ['issues']
    },
    
    // Disable dangerous tools
    {
      pattern: ['*delete*', '*remove*', '*destroy*'],
      enabled: false,
      tags: ['dangerous']
    }
  ]
};
