import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * Production Configuration
 * 
 * A real-world production configuration with:
 * - Safety-first approach
 * - Server-specific rules
 * - Tag-based organization
 * - Whitelist mode for critical operations
 */
export const productionConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 7200 // 2 hours for production
  },
  toolRules: [
    // 1. Enable all safe read operations
    {
      pattern: ['*read*', '*get*', '*list*', '*search*', '*find*', '*query*'],
      enabled: true,
      tags: ['safe', 'read', 'approved']
    },
    
    // 2. Enable specific write operations
    {
      pattern: ['create_issue', 'create_ticket', 'create_comment', 'update_issue'],
      enabled: true,
      tags: ['write', 'approved', 'collaboration']
    },
    
    // 3. Disable all dangerous operations
    {
      pattern: ['*delete*', '*remove*', '*destroy*', '*drop*', '*truncate*'],
      enabled: false,
      tags: ['dangerous', 'destructive', 'blocked']
    },
    
    // 4. GitHub - enable collaboration tools
    {
      server: 'github',
      pattern: ['*issue*', '*pr*', '*pull*', '*comment*', '*review*'],
      enabled: true,
      tags: ['github', 'collaboration', 'approved']
    },
    {
      server: 'github',
      pattern: ['*delete*', '*force*'],
      enabled: false,
      tags: ['github', 'dangerous', 'blocked']
    },
    
    // 5. Jira - enable project management
    {
      server: 'jira',
      pattern: ['*ticket*', '*sprint*', '*board*', '*comment*'],
      enabled: true,
      tags: ['jira', 'project-management', 'approved']
    },
    
    // 6. Filesystem - read-only
    {
      server: 'filesystem',
      pattern: ['read_*', 'list_*', 'stat_*', 'exists_*'],
      enabled: true,
      tags: ['filesystem', 'read', 'safe', 'approved']
    },
    {
      server: 'filesystem',
      pattern: ['write_*', 'delete_*', 'move_*', 'rename_*'],
      enabled: false,
      tags: ['filesystem', 'write', 'dangerous', 'blocked']
    },
    
    // 7. Docker - monitoring only
    {
      server: 'docker',
      pattern: ['list_*', 'inspect_*', 'logs_*', 'stats_*'],
      enabled: true,
      tags: ['docker', 'monitoring', 'read', 'approved']
    },
    {
      server: 'docker',
      pattern: ['*stop*', '*kill*', '*remove*', '*prune*'],
      enabled: false,
      tags: ['docker', 'dangerous', 'blocked']
    },
    
    // 8. Communication tools - always enabled
    {
      pattern: ['*slack*', '*email*', '*notify*'],
      enabled: true,
      tags: ['communication', 'messaging', 'approved']
    },
    
    // 9. Database - read-only
    {
      pattern: ['*select*', '*query*', '*find*'],
      enabled: true,
      tags: ['database', 'read', 'approved']
    },
    {
      pattern: ['*insert*', '*update*', '*delete*', '*drop*', '*alter*'],
      enabled: false,
      tags: ['database', 'write', 'dangerous', 'blocked']
    }
  ]
};

/**
 * Development Configuration
 * 
 * More permissive for development environments.
 */
export const developmentConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 1800 // 30 minutes for dev
  },
  toolRules: [
    // Enable most operations in dev
    {
      pattern: ['*'],
      enabled: true,
      tags: ['dev', 'all']
    },
    
    // But still block truly dangerous operations
    {
      pattern: ['*drop_database*', '*truncate_all*', '*destroy_all*'],
      enabled: false,
      tags: ['extremely-dangerous', 'blocked']
    }
  ]
};

/**
 * Testing Configuration
 * 
 * For automated testing environments.
 */
export const testingConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: false, // Disable cache in tests
    ttl: 0
  },
  toolRules: [
    // Enable all tools for comprehensive testing
    {
      pattern: ['*'],
      enabled: true,
      tags: ['test', 'all']
    }
  ]
};
