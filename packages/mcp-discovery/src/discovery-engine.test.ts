import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoveryEngine } from './discovery-engine.js';
import type { DiscoveryConfig } from './types.js';

describe('DiscoveryEngine', () => {
  let engine: DiscoveryEngine;
  let config: DiscoveryConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      cache: {
        enabled: true,
        ttl: 3600
      },
      rules: []
    };
    engine = new DiscoveryEngine(config);
  });

  describe('Configuration', () => {
    it('should initialize with config', () => {
      const retrievedConfig = engine.getConfig();
      expect(retrievedConfig).toEqual(config);
    });

    it('should reload configuration', async () => {
      await expect(engine.reload()).resolves.not.toThrow();
    });
  });

  describe('Server Operations', () => {
    it('should list servers', async () => {
      const servers = await engine.listServers();
      expect(Array.isArray(servers)).toBe(true);
    });
  });

  describe('Tool Discovery', () => {
    it('should search tools', async () => {
      const results = await engine.searchTools('test');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search tools with options', async () => {
      const results = await engine.searchTools('test', {
        server: 'github',
        limit: 5
      });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should list tools from server', async () => {
      const tools = await engine.listTools('github');
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should list tools including disabled', async () => {
      const tools = await engine.listTools('github', true);
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should get tool details', async () => {
      const tool = await engine.getToolDetails('github', 'create_issue');
      // Will be null since we haven't added any tools yet
      expect(tool).toBeNull();
    });
  });

  describe('Tool Execution', () => {
    it('should execute tool', async () => {
      const result = await engine.executeTool('github', 'create_issue', {
        repo: 'test/repo',
        title: 'Test'
      });
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false); // Will fail since not connected
    });

    it('should handle execution errors', async () => {
      const result = await engine.executeTool('nonexistent', 'tool', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
