import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * Whitelist Mode
 * 
 * When any rule has enabled: true, whitelist mode is activated.
 * Only explicitly enabled tools are available.
 * All other tools are disabled by default.
 */
export const whitelistConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600
  },
  toolRules: [
    // Only enable safe read operations
    {
      pattern: ['*read*', '*get*', '*list*', '*search*', '*find*'],
      enabled: true,
      tags: ['safe', 'read', 'approved']
    },
    
    // Only enable specific create operations
    {
      pattern: ['create_issue', 'create_ticket', 'create_comment'],
      enabled: true,
      tags: ['create', 'approved']
    },
    
    // Everything else is disabled by default
    // No need to explicitly disable - whitelist mode handles it
  ]
};

/**
 * Strict Whitelist - Only Specific Tools
 * 
 * Enable only a handful of specific tools.
 * Perfect for restricted environments.
 */
export const strictWhitelistConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600
  },
  toolRules: [
    {
      pattern: [
        'github_list_repos',
        'github_get_issue',
        'github_create_issue',
        'jira_list_tickets',
        'jira_get_ticket',
        'slack_send_message'
      ],
      enabled: true,
      tags: ['approved', 'production']
    }
  ]
};
