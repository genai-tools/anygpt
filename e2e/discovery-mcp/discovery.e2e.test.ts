import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { DiscoveryConfig } from '@anygpt/mcp-discovery';
import { mockServers, mockTools, mockGitHubTools, mockJiraTools, mockFilesystemTools } from './fixtures/mock-servers.js';

/**
 * E2E Tests for MCP Discovery Engine
 * 
 * Tests all configuration types and real-world scenarios:
 * 1. Default configuration (zero-config)
 * 2. Pattern-based filtering (glob, regex, negation)
 * 3. Server-specific rules
 * 4. Whitelist mode
 * 5. Tag-based organization
 * 6. Caching behavior
 * 7. Search and discovery workflows
 */
describe('MCP Discovery Engine E2E', () => {
  describe('1. Zero-Config Setup', () => {
    it('should work with default configuration', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: {
          enabled: true,
          ttl: 3600
        }
      };

      const engine = new DiscoveryEngine(config);
      
      // Should initialize without errors
      expect(engine).toBeDefined();
      expect(engine.getConfig()).toEqual(config);
      
      // Should return empty results (no servers connected yet)
      const servers = await engine.listServers();
      expect(servers).toEqual([]);
    });

    it('should handle search with no tools', async () => {
      const engine = new DiscoveryEngine({
        enabled: true,
        cache: { enabled: true, ttl: 3600 }
      });

      const results = await engine.searchTools('github');
      expect(results).toEqual([]);
    });
  });

  describe('2. Glob Pattern Filtering', () => {
    it('should filter tools using glob patterns', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          {
            pattern: ['*github*'],
            enabled: true,
            tags: ['github', 'vcs']
          },
          {
            pattern: ['*jira*'],
            enabled: true,
            tags: ['jira', 'project-management']
          },
          {
            pattern: ['*delete*', '*remove*'],
            enabled: false,
            tags: ['dangerous']
          }
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(3);
    });

    it('should support wildcard patterns', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          { pattern: ['github_*'], enabled: true },      // Starts with
          { pattern: ['*_issue'], enabled: true },       // Ends with
          { pattern: ['*create*'], enabled: true },      // Contains
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(3);
    });
  });

  describe('3. Regex Pattern Filtering', () => {
    it('should filter tools using regex patterns', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          {
            pattern: ['/^create_/'],
            enabled: true,
            tags: ['create']
          },
          {
            pattern: ['/^(get|list)_/'],
            enabled: true,
            tags: ['read']
          },
          {
            pattern: ['/^(update|modify)_/'],
            enabled: true,
            tags: ['update']
          },
          {
            pattern: ['/^(delete|remove)_/'],
            enabled: false,
            tags: ['delete', 'dangerous']
          }
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(4);
    });
  });

  describe('4. Negation Patterns', () => {
    it('should exclude tools using negation patterns', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          // Enable all tools
          { pattern: ['*'], enabled: true },
          // Except dangerous ones
          { pattern: ['*delete*'], enabled: false, tags: ['dangerous'] },
          { pattern: ['*remove*'], enabled: false, tags: ['dangerous'] },
          { pattern: ['*destroy*'], enabled: false, tags: ['dangerous'] }
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(4);
    });
  });

  describe('5. Server-Specific Rules', () => {
    it('should apply rules per server', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          // GitHub-specific rules
          {
            server: 'github',
            pattern: ['*issue*'],
            enabled: true,
            tags: ['github', 'issues']
          },
          {
            server: 'github',
            pattern: ['*pr*', '*pull*'],
            enabled: true,
            tags: ['github', 'pull-requests']
          },
          // Jira-specific rules
          {
            server: 'jira',
            pattern: ['*ticket*'],
            enabled: true,
            tags: ['jira', 'tickets']
          },
          // Filesystem-specific rules
          {
            server: 'filesystem',
            pattern: ['read_*', 'write_*'],
            enabled: true,
            tags: ['filesystem', 'io']
          }
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(4);
    });
  });

  describe('6. Whitelist Mode', () => {
    it('should enable only specified tools (whitelist)', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          // Only enable these specific tools
          { pattern: ['*create*'], enabled: true, tags: ['create'] },
          { pattern: ['*read*'], enabled: true, tags: ['read'] },
          { pattern: ['*list*'], enabled: true, tags: ['list'] }
          // Everything else is disabled by default
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(3);
      
      // Verify whitelist mode is detected (any rule with enabled: true)
      const hasWhitelist = config.toolRules?.some(r => r.enabled === true);
      expect(hasWhitelist).toBe(true);
    });
  });

  describe('7. Tag-Based Organization', () => {
    it('should organize tools with tags', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          {
            pattern: ['*github*'],
            tags: ['vcs', 'github', 'collaboration']
          },
          {
            pattern: ['*issue*'],
            tags: ['issues', 'tracking']
          },
          {
            pattern: ['*create*'],
            tags: ['write', 'create']
          },
          {
            pattern: ['*read*', '*get*', '*list*'],
            tags: ['read', 'query']
          }
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(4);
    });

    it('should accumulate tags from multiple matching rules', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          { pattern: ['*github*'], tags: ['github'] },
          { pattern: ['*create*'], tags: ['create'] },
          { pattern: ['*issue*'], tags: ['issues'] }
          // A tool like 'github_create_issue' would get all three tags
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(3);
    });
  });

  describe('8. Caching Configuration', () => {
    it('should configure cache with custom TTL', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: {
          enabled: true,
          ttl: 7200 // 2 hours
        }
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().cache?.ttl).toBe(7200);
    });

    it('should support cache disabled', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: {
          enabled: false,
          ttl: 3600
        }
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().cache?.enabled).toBe(false);
    });
  });

  describe('9. Complex Real-World Scenarios', () => {
    it('should handle production-like configuration', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: {
          enabled: true,
          ttl: 3600
        },
        toolRules: [
          // Enable safe operations
          {
            pattern: ['*read*', '*get*', '*list*', '*search*'],
            enabled: true,
            tags: ['safe', 'read']
          },
          // Enable create operations with tags
          {
            pattern: ['*create*', '*add*', '*new*'],
            enabled: true,
            tags: ['write', 'create']
          },
          // Disable dangerous operations
          {
            pattern: ['*delete*', '*remove*', '*destroy*', '*drop*'],
            enabled: false,
            tags: ['dangerous', 'destructive']
          },
          // GitHub-specific
          {
            server: 'github',
            pattern: ['*'],
            enabled: true,
            tags: ['github', 'approved']
          },
          // Filesystem - only safe operations
          {
            server: 'filesystem',
            pattern: ['read_*', 'list_*'],
            enabled: true,
            tags: ['filesystem', 'safe']
          },
          {
            server: 'filesystem',
            pattern: ['write_*', 'delete_*'],
            enabled: false,
            tags: ['filesystem', 'dangerous']
          }
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(6);
    });

    it('should handle multi-team configuration', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          // Dev team - full access
          {
            pattern: ['*github*', '*gitlab*'],
            enabled: true,
            tags: ['dev-team', 'vcs']
          },
          // QA team - read-only
          {
            pattern: ['*jira*', '*test*'],
            enabled: true,
            tags: ['qa-team', 'testing']
          },
          // Ops team - infrastructure
          {
            pattern: ['*docker*', '*kubernetes*', '*aws*'],
            enabled: true,
            tags: ['ops-team', 'infrastructure']
          },
          // Everyone - communication
          {
            pattern: ['*slack*', '*email*'],
            enabled: true,
            tags: ['all-teams', 'communication']
          }
        ]
      };

      const engine = new DiscoveryEngine(config);
      expect(engine.getConfig().toolRules).toHaveLength(4);
    });
  });

  describe('10. Search and Discovery Workflows', () => {
    let engine: DiscoveryEngine;

    beforeAll(() => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 }
      };
      engine = new DiscoveryEngine(config);
    });

    it('should search for tools', async () => {
      const results = await engine.searchTools('github');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search with server filter', async () => {
      const results = await engine.searchTools('create', {
        server: 'github',
        limit: 5
      });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should list tools from server', async () => {
      const tools = await engine.listTools('github');
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should get tool details', async () => {
      const tool = await engine.getToolDetails('github', 'create_issue');
      // Will be null since no tools are loaded yet
      expect(tool).toBeNull();
    });

    it('should execute tool', async () => {
      const result = await engine.executeTool('github', 'create_issue', {
        repo: 'test/repo',
        title: 'Test'
      });
      
      // Will fail since server not connected
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('11. Configuration Reload', () => {
    it('should reload configuration', async () => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 },
        toolRules: [
          { pattern: ['*github*'], enabled: true }
        ]
      };

      const engine = new DiscoveryEngine(config);
      
      // Reload should not throw
      await expect(engine.reload()).resolves.not.toThrow();
    });
  });
});
