/**
 * E2E Tests for Docker MCP Plugin
 * 
 * These tests run against actual Docker MCP commands.
 * Requires: docker mcp to be installed and available
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import DockerMCP from '@anygpt/docker-mcp-plugin';
import type { PluginContext } from '@anygpt/types';

// Check if Docker MCP is available
function isDockerMCPAvailable(): boolean {
  try {
    execSync('docker mcp server ls', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

describe('Docker MCP Plugin E2E', () => {
  let dockerMCPAvailable: boolean;

  beforeAll(() => {
    dockerMCPAvailable = isDockerMCPAvailable();
    if (!dockerMCPAvailable) {
      console.warn('⚠️  Docker MCP not available - tests will be skipped');
    }
  });

  const mockContext: PluginContext = {
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
    config: {},
  };

  it('should create plugin instance', () => {
    const plugin = DockerMCP();
    
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('docker-mcp');
    expect(plugin.config).toBeDefined();
  });

  it('should handle missing docker mcp gracefully', async () => {
    if (dockerMCPAvailable) {
      console.log('✓ Docker MCP is available - skipping negative test');
      return;
    }

    const plugin = DockerMCP();
    const result = await plugin.config!(mockContext);

    expect(result).toEqual({});
  });

  it('should discover docker mcp servers', async () => {
    if (!dockerMCPAvailable) {
      console.log('⊘ Skipped - Docker MCP not available');
      return;
    }

    const plugin = DockerMCP({ debug: true });
    const result = await plugin.config!(mockContext);

    expect(result).toBeDefined();
    expect(result.mcpServers).toBeDefined();
    
    console.log(`✓ Discovered ${Object.keys(result.mcpServers || {}).length} servers`);
  });

  it('should generate valid MCP server configs', async () => {
    if (!dockerMCPAvailable) {
      console.log('⊘ Skipped - Docker MCP not available');
      return;
    }

    const plugin = DockerMCP();
    const result = await plugin.config!(mockContext);

    if (result.mcpServers && Object.keys(result.mcpServers).length > 0) {
      const firstServer = Object.values(result.mcpServers)[0];
      
      expect(firstServer).toMatchObject({
        command: 'docker',
        args: expect.arrayContaining(['mcp', 'gateway', 'run']),
      });
      
      expect(firstServer.args).toContain('--transport');
      expect(firstServer.description).toBeDefined();
      
      console.log(`✓ Server config: ${firstServer.command} ${firstServer.args?.join(' ')}`);
    }
  });

  it('should apply custom prefix', async () => {
    if (!dockerMCPAvailable) {
      console.log('⊘ Skipped - Docker MCP not available');
      return;
    }

    const plugin = DockerMCP({ prefix: 'test-' });
    const result = await plugin.config!(mockContext);

    if (result.mcpServers) {
      const serverNames = Object.keys(result.mcpServers);
      
      if (serverNames.length > 0) {
        expect(serverNames[0]).toMatch(/^test-/);
        console.log(`✓ Custom prefix applied: ${serverNames[0]}`);
      }
    }
  });

  it('should inject environment variables', async () => {
    if (!dockerMCPAvailable) {
      console.log('⊘ Skipped - Docker MCP not available');
      return;
    }

    // Get first available server
    const listOutput = execSync('docker mcp server ls', { encoding: 'utf-8' });
    const servers = listOutput.trim().split(',').map(s => s.trim()).filter(Boolean);
    
    if (servers.length === 0) {
      console.log('⊘ No servers available for env test');
      return;
    }

    const testServer = servers[0];
    const plugin = DockerMCP({
      env: {
        [testServer]: {
          TEST_VAR: 'test-value',
        },
      },
    });
    
    const result = await plugin.config!(mockContext);
    const serverKey = `docker-${testServer}`;
    
    if (result.mcpServers?.[serverKey]) {
      expect(result.mcpServers[serverKey].env).toMatchObject({
        TEST_VAR: 'test-value',
      });
      console.log(`✓ Environment variables injected for ${testServer}`);
    }
  });

  it('should apply docker mcp flags', async () => {
    if (!dockerMCPAvailable) {
      console.log('⊘ Skipped - Docker MCP not available');
      return;
    }

    const plugin = DockerMCP({
      flags: {
        transport: 'sse',
        cpus: 2,
        memory: '512m',
        longLived: true,
      },
    });
    
    const result = await plugin.config!(mockContext);

    if (result.mcpServers && Object.keys(result.mcpServers).length > 0) {
      const firstServer = Object.values(result.mcpServers)[0];
      
      expect(firstServer.args).toContain('--transport');
      expect(firstServer.args).toContain('sse');
      expect(firstServer.args).toContain('--cpus');
      expect(firstServer.args).toContain('2');
      expect(firstServer.args).toContain('--memory');
      expect(firstServer.args).toContain('512m');
      expect(firstServer.args).toContain('--long-lived');
      
      console.log('✓ Docker MCP flags applied correctly');
    }
  });
});
