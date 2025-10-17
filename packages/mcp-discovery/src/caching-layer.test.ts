import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CachingLayer } from './caching-layer.js';
import type { ServerMetadata, ToolMetadata } from './types.js';

describe('CachingLayer', () => {
  let cache: CachingLayer;

  beforeEach(() => {
    cache = new CachingLayer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Server List Cache', () => {
    it('should cache server list', () => {
      const servers: ServerMetadata[] = [
        {
          name: 'github',
          description: 'GitHub API',
          toolCount: 10,
          enabledCount: 10,
          status: 'connected',
          config: { command: 'npx', args: ['github-mcp'] }
        }
      ];

      cache.cacheServerList(servers, 3600);
      const cached = cache.getServerList();

      expect(cached).toEqual(servers);
    });

    it('should return null if server list not cached', () => {
      const cached = cache.getServerList();
      expect(cached).toBeNull();
    });

    it('should expire server list after TTL', () => {
      const servers: ServerMetadata[] = [
        {
          name: 'github',
          description: 'GitHub API',
          toolCount: 10,
          enabledCount: 10,
          status: 'connected',
          config: { command: 'npx', args: ['github-mcp'] }
        }
      ];

      cache.cacheServerList(servers, 3600); // 1 hour TTL
      
      // Advance time by 1 hour + 1 second
      vi.advanceTimersByTime(3601 * 1000);
      
      const cached = cache.getServerList();
      expect(cached).toBeNull();
    });

    it('should not expire server list before TTL', () => {
      const servers: ServerMetadata[] = [
        {
          name: 'github',
          description: 'GitHub API',
          toolCount: 10,
          enabledCount: 10,
          status: 'connected',
          config: { command: 'npx', args: ['github-mcp'] }
        }
      ];

      cache.cacheServerList(servers, 3600);
      
      // Advance time by 30 minutes
      vi.advanceTimersByTime(1800 * 1000);
      
      const cached = cache.getServerList();
      expect(cached).toEqual(servers);
    });
  });

  describe('Tool Summaries Cache', () => {
    it('should cache tool summaries per server', () => {
      const tools: ToolMetadata[] = [
        {
          server: 'github',
          name: 'create_issue',
          summary: 'Create issue',
          enabled: true,
          tags: []
        }
      ];

      cache.cacheToolSummaries('github', tools, 3600);
      const cached = cache.getToolSummaries('github');

      expect(cached).toEqual(tools);
    });

    it('should return null if tool summaries not cached', () => {
      const cached = cache.getToolSummaries('github');
      expect(cached).toBeNull();
    });

    it('should cache tool summaries separately per server', () => {
      const githubTools: ToolMetadata[] = [
        {
          server: 'github',
          name: 'create_issue',
          summary: 'Create issue',
          enabled: true,
          tags: []
        }
      ];

      const jiraTools: ToolMetadata[] = [
        {
          server: 'jira',
          name: 'create_ticket',
          summary: 'Create ticket',
          enabled: true,
          tags: []
        }
      ];

      cache.cacheToolSummaries('github', githubTools, 3600);
      cache.cacheToolSummaries('jira', jiraTools, 3600);

      expect(cache.getToolSummaries('github')).toEqual(githubTools);
      expect(cache.getToolSummaries('jira')).toEqual(jiraTools);
    });

    it('should expire tool summaries after TTL', () => {
      const tools: ToolMetadata[] = [
        {
          server: 'github',
          name: 'create_issue',
          summary: 'Create issue',
          enabled: true,
          tags: []
        }
      ];

      cache.cacheToolSummaries('github', tools, 3600);
      
      // Advance time by 1 hour + 1 second
      vi.advanceTimersByTime(3601 * 1000);
      
      const cached = cache.getToolSummaries('github');
      expect(cached).toBeNull();
    });
  });

  describe('Tool Details Cache', () => {
    it('should cache tool details indefinitely', () => {
      const tool: ToolMetadata = {
        server: 'github',
        name: 'create_issue',
        summary: 'Create issue',
        description: 'Create a new GitHub issue',
        enabled: true,
        tags: [],
        parameters: [
          {
            name: 'repo',
            type: 'string',
            description: 'Repository name',
            required: true
          }
        ]
      };

      cache.cacheToolDetails('github', 'create_issue', tool);
      const cached = cache.getToolDetails('github', 'create_issue');

      expect(cached).toEqual(tool);
    });

    it('should return null if tool details not cached', () => {
      const cached = cache.getToolDetails('github', 'create_issue');
      expect(cached).toBeNull();
    });

    it('should not expire tool details', () => {
      const tool: ToolMetadata = {
        server: 'github',
        name: 'create_issue',
        summary: 'Create issue',
        enabled: true,
        tags: []
      };

      cache.cacheToolDetails('github', 'create_issue', tool);
      
      // Advance time by 1 year
      vi.advanceTimersByTime(365 * 24 * 3600 * 1000);
      
      const cached = cache.getToolDetails('github', 'create_issue');
      expect(cached).toEqual(tool);
    });

    it('should cache tool details separately per server and tool', () => {
      const tool1: ToolMetadata = {
        server: 'github',
        name: 'create_issue',
        summary: 'Create issue',
        enabled: true,
        tags: []
      };

      const tool2: ToolMetadata = {
        server: 'github',
        name: 'update_issue',
        summary: 'Update issue',
        enabled: true,
        tags: []
      };

      cache.cacheToolDetails('github', 'create_issue', tool1);
      cache.cacheToolDetails('github', 'update_issue', tool2);

      expect(cache.getToolDetails('github', 'create_issue')).toEqual(tool1);
      expect(cache.getToolDetails('github', 'update_issue')).toEqual(tool2);
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(() => {
      const servers: ServerMetadata[] = [
        {
          name: 'github',
          description: 'GitHub API',
          toolCount: 10,
          enabledCount: 10,
          status: 'connected',
          config: { command: 'npx', args: ['github-mcp'] }
        }
      ];

      const tools: ToolMetadata[] = [
        {
          server: 'github',
          name: 'create_issue',
          summary: 'Create issue',
          enabled: true,
          tags: []
        }
      ];

      cache.cacheServerList(servers, 3600);
      cache.cacheToolSummaries('github', tools, 3600);
      cache.cacheToolDetails('github', 'create_issue', tools[0]);
    });

    it('should invalidate specific cache key', () => {
      cache.invalidate('servers');
      
      expect(cache.getServerList()).toBeNull();
      expect(cache.getToolSummaries('github')).not.toBeNull();
      expect(cache.getToolDetails('github', 'create_issue')).not.toBeNull();
    });

    it('should invalidate all caches', () => {
      cache.invalidateAll();
      
      expect(cache.getServerList()).toBeNull();
      expect(cache.getToolSummaries('github')).toBeNull();
      expect(cache.getToolDetails('github', 'create_issue')).toBeNull();
    });

    it('should invalidate server-specific tool summaries', () => {
      cache.cacheToolSummaries('jira', [], 3600);
      
      cache.invalidate('tools:github');
      
      expect(cache.getToolSummaries('github')).toBeNull();
      expect(cache.getToolSummaries('jira')).not.toBeNull();
    });
  });
});
