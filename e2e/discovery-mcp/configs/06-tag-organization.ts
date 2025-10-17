import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * Tag-Based Organization
 * 
 * Use tags to organize and categorize tools.
 * Tags accumulate from all matching rules.
 * Perfect for filtering and discovery.
 */
export const tagOrganizationConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600
  },
  toolRules: [
    // Categorize by operation type
    {
      pattern: ['*create*', '*add*', '*new*'],
      tags: ['operation:create', 'write']
    },
    {
      pattern: ['*read*', '*get*', '*list*', '*search*'],
      tags: ['operation:read', 'read', 'safe']
    },
    {
      pattern: ['*update*', '*modify*', '*edit*', '*change*'],
      tags: ['operation:update', 'write']
    },
    {
      pattern: ['*delete*', '*remove*', '*destroy*'],
      tags: ['operation:delete', 'write', 'dangerous']
    },
    
    // Categorize by service
    {
      pattern: ['*github*'],
      tags: ['service:github', 'vcs', 'collaboration']
    },
    {
      pattern: ['*jira*'],
      tags: ['service:jira', 'project-management', 'tracking']
    },
    {
      pattern: ['*slack*'],
      tags: ['service:slack', 'communication', 'messaging']
    },
    {
      pattern: ['*docker*'],
      tags: ['service:docker', 'containers', 'infrastructure']
    },
    
    // Categorize by resource type
    {
      pattern: ['*issue*'],
      tags: ['resource:issue', 'tracking']
    },
    {
      pattern: ['*pr*', '*pull*'],
      tags: ['resource:pull-request', 'code-review']
    },
    {
      pattern: ['*file*'],
      tags: ['resource:file', 'filesystem']
    },
    {
      pattern: ['*container*'],
      tags: ['resource:container', 'docker']
    },
    
    // Categorize by team
    {
      pattern: ['*github*', '*gitlab*', '*bitbucket*'],
      tags: ['team:dev', 'team:engineering']
    },
    {
      pattern: ['*jira*', '*asana*', '*trello*'],
      tags: ['team:product', 'team:pm']
    },
    {
      pattern: ['*docker*', '*kubernetes*', '*aws*'],
      tags: ['team:ops', 'team:devops']
    },
    
    // Categorize by safety level
    {
      pattern: ['*read*', '*get*', '*list*'],
      tags: ['safety:safe', 'safety:read-only']
    },
    {
      pattern: ['*create*', '*update*'],
      tags: ['safety:moderate', 'safety:write']
    },
    {
      pattern: ['*delete*', '*destroy*', '*drop*'],
      tags: ['safety:dangerous', 'safety:destructive']
    }
  ]
};
