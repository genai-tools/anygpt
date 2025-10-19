import { defineConfig } from '@anygpt/config';

/**
 * Example: Unified MCP Configuration
 * 
 * All MCP-related configuration is now under a single `mcp` section:
 * - mcp.servers: MCP server definitions
 * - mcp.discovery: Discovery settings
 * - mcp.serverRules: Rules for filtering/tagging MCP servers
 * - mcp.toolRules: Rules for filtering/tagging tools
 */

export default defineConfig({
  providers: {
    openai: {
      connector: '@anygpt/openai',
      config: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    },
  },

  // Unified MCP configuration
  mcp: {
    // Server definitions
    servers: {
      'github': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        },
      },
      'filesystem': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
      },
    },

    // Discovery configuration
    discovery: {
      enabled: true,
      cache: {
        enabled: true,
        ttl: 3600, // 1 hour
      },
    },

    // Server-level rules (filter/tag MCP servers)
    serverRules: [
      // Disable experimental servers
      {
        when: { name: { match: /experimental|beta/ } },
        set: { enabled: false },
        push: { tags: ['experimental'] }
      },

      // Tag production-ready servers
      {
        when: { name: { in: ['github', 'filesystem'] } },
        push: { tags: ['production', 'stable'] }
      },
    ],

    // Tool-level rules (filter/tag individual tools)
    toolRules: [
      // Disable dangerous operations
      {
        when: {
          name: { match: /(delete|remove|destroy|force)/ }
        },
        set: { enabled: false },
        push: { tags: ['dangerous', 'blocked'] }
      },

      // Enable read-only operations
      {
        when: {
          name: { match: /^(get|list|read|search)/ }
        },
        set: { enabled: true },
        push: { tags: ['safe', 'read-only'] }
      },

      // Tag GitHub tools
      {
        when: { server: 'github' },
        push: { tags: ['vcs', 'github'] }
      },

      // Server-specific tool rules
      {
        when: {
          and: [
            { server: 'github' },
            { name: { match: /issue/ } }
          ]
        },
        push: { tags: ['issues'] }
      },
    ],
  },
});
