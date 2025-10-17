import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoveryMCPServer } from './server.js';
import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

describe('DiscoveryMCPServer', () => {
  let server: DiscoveryMCPServer;
  let config: DiscoveryConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      cache: {
        enabled: true,
        ttl: 3600
      }
    };
    server = new DiscoveryMCPServer(config);
  });

  describe('Initialization', () => {
    it('should initialize with config', () => {
      expect(server).toBeDefined();
    });

    it('should register all meta-tools', () => {
      const tools = server.getTools();
      expect(tools).toHaveLength(5);
      
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('list_mcp_servers');
      expect(toolNames).toContain('search_tools');
      expect(toolNames).toContain('list_tools');
      expect(toolNames).toContain('get_tool_details');
      expect(toolNames).toContain('execute_tool');
    });
  });

  describe('list_mcp_servers', () => {
    it('should list all servers', async () => {
      const result = await server.handleToolCall('list_mcp_servers', {});
      
      expect(result).toHaveProperty('servers');
      expect(Array.isArray(result.servers)).toBe(true);
    });
  });

  describe('search_tools', () => {
    it('should search tools with query', async () => {
      const result = await server.handleToolCall('search_tools', {
        query: 'github'
      });
      
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should require query parameter', async () => {
      await expect(
        server.handleToolCall('search_tools', {})
      ).rejects.toThrow();
    });

    it('should support optional server filter', async () => {
      const result = await server.handleToolCall('search_tools', {
        query: 'create',
        server: 'github'
      });
      
      expect(result).toHaveProperty('results');
    });

    it('should support optional limit', async () => {
      const result = await server.handleToolCall('search_tools', {
        query: 'create',
        limit: 5
      });
      
      expect(result).toHaveProperty('results');
    });
  });

  describe('list_tools', () => {
    it('should list tools from server', async () => {
      const result = await server.handleToolCall('list_tools', {
        server: 'github'
      });
      
      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
    });

    it('should require server parameter', async () => {
      await expect(
        server.handleToolCall('list_tools', {})
      ).rejects.toThrow();
    });

    it('should support includeDisabled option', async () => {
      const result = await server.handleToolCall('list_tools', {
        server: 'github',
        includeDisabled: true
      });
      
      expect(result).toHaveProperty('tools');
    });
  });

  describe('get_tool_details', () => {
    it('should get tool details', async () => {
      const result = await server.handleToolCall('get_tool_details', {
        server: 'github',
        tool: 'create_issue'
      });
      
      expect(result).toHaveProperty('tool');
    });

    it('should require server parameter', async () => {
      await expect(
        server.handleToolCall('get_tool_details', { tool: 'create_issue' })
      ).rejects.toThrow();
    });

    it('should require tool parameter', async () => {
      await expect(
        server.handleToolCall('get_tool_details', { server: 'github' })
      ).rejects.toThrow();
    });

    it('should return null for non-existent tool', async () => {
      const result = await server.handleToolCall('get_tool_details', {
        server: 'github',
        tool: 'nonexistent'
      });
      
      expect(result.tool).toBeNull();
    });
  });

  describe('execute_tool', () => {
    it('should execute tool', async () => {
      const result = await server.handleToolCall('execute_tool', {
        server: 'github',
        tool: 'create_issue',
        arguments: {
          repo: 'test/repo',
          title: 'Test'
        }
      });
      
      expect(result).toHaveProperty('success');
    });

    it('should require server parameter', async () => {
      await expect(
        server.handleToolCall('execute_tool', {
          tool: 'create_issue',
          arguments: {}
        })
      ).rejects.toThrow();
    });

    it('should require tool parameter', async () => {
      await expect(
        server.handleToolCall('execute_tool', {
          server: 'github',
          arguments: {}
        })
      ).rejects.toThrow();
    });

    it('should require arguments parameter', async () => {
      await expect(
        server.handleToolCall('execute_tool', {
          server: 'github',
          tool: 'create_issue'
        })
      ).rejects.toThrow();
    });

    it('should return error for failed execution', async () => {
      const result = await server.handleToolCall('execute_tool', {
        server: 'nonexistent',
        tool: 'tool',
        arguments: {}
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
