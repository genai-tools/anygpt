/**
 * Configuration with MCP Servers
 * 
 * This config demonstrates how to configure actual MCP servers
 * for the discovery engine to connect to and discover tools from.
 */

import type { AnyGPTConfig } from '@anygpt/types';

export const withMCPServersConfig: AnyGPTConfig = {
  version: '1.0',
  
  // MCP Server Configuration
  mcpServers: {
    // Sequential Thinking MCP Server
    'sequential-thinking': {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      description: 'Advanced reasoning through sequential thought processes'
    },
    
    // Git MCP Server
    'git': {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-git'],
      description: 'Git repository operations'
    },
    
    // Filesystem MCP Server
    'filesystem': {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
      description: 'Read and write files on the local filesystem'
    },
    
    // GitHub MCP Server
    'github': {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || ''
      },
      description: 'GitHub repository and issue management'
    }
  },
  
  // MCP Discovery Configuration
  discovery: {
    enabled: true,
    cache: {
      enabled: true,
      ttl: 3600 // 1 hour
    },
    // Tool filtering rules
    toolRules: [
      // Enable all sequential thinking tools
      { pattern: ['sequential*'], enabled: true },
      // Enable all git tools
      { pattern: ['git_*'], enabled: true },
      // Enable filesystem read operations
      { pattern: ['filesystem_read*'], enabled: true },
      // Disable filesystem write operations (safety)
      { pattern: ['filesystem_write*'], enabled: false }
    ]
  },
  
  providers: {},
  
  settings: {
    timeout: 30000,
    maxRetries: 3,
    logging: {
      level: 'info'
    }
  }
};

export default withMCPServersConfig;
