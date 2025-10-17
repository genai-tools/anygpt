import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * Server-Specific Rules
 * 
 * Apply different rules to different MCP servers.
 * Use the 'server' field to target specific servers.
 */
export const serverSpecificConfig: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600
  },
  toolRules: [
    // GitHub - enable issue and PR tools
    {
      server: 'github',
      pattern: ['*issue*', '*pr*', '*pull*'],
      enabled: true,
      tags: ['github', 'collaboration']
    },
    
    // Jira - enable ticket management
    {
      server: 'jira',
      pattern: ['*ticket*', '*sprint*', '*board*'],
      enabled: true,
      tags: ['jira', 'project-management']
    },
    
    // Filesystem - only safe read operations
    {
      server: 'filesystem',
      pattern: ['read_*', 'list_*', 'stat_*'],
      enabled: true,
      tags: ['filesystem', 'safe', 'read']
    },
    
    // Filesystem - disable write operations
    {
      server: 'filesystem',
      pattern: ['write_*', 'delete_*', 'move_*'],
      enabled: false,
      tags: ['filesystem', 'dangerous', 'write']
    },
    
    // Docker - enable container management
    {
      server: 'docker',
      pattern: ['*container*', '*image*'],
      enabled: true,
      tags: ['docker', 'containers']
    },
    
    // AWS - enable specific services
    {
      server: 'aws',
      pattern: ['*s3*', '*lambda*', '*ec2*'],
      enabled: true,
      tags: ['aws', 'cloud']
    }
  ]
};
