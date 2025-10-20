import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPDiscoveryClient } from './mcp-discovery-client.js';

describe('MCPDiscoveryClient', () => {
  let client: MCPDiscoveryClient;

  beforeEach(() => {
    client = new MCPDiscoveryClient();
  });

  afterEach(async () => {
    if (client.isConnected()) {
      await client.disconnect();
    }
  });

  describe('connection', () => {
    it('should start disconnected', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should throw when calling methods before connect', async () => {
      await expect(client.searchTools('test')).rejects.toThrow(
        'MCP client not connected'
      );
    });

    it('should connect successfully', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
    }, 10000); // 10s timeout for connection

    it('should disconnect successfully', async () => {
      await client.connect();
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    }, 10000);

    it('should handle multiple connect calls', async () => {
      await client.connect();
      await client.connect(); // Should not throw
      expect(client.isConnected()).toBe(true);
    }, 10000);
  });

  describe('searchTools', () => {
    beforeEach(async () => {
      await client.connect();
    }, 10000);

    it('should search for tools', async () => {
      const results = await client.searchTools('file');
      console.log('Search results:', results);
      expect(Array.isArray(results)).toBe(true);
      // Results may be empty if no servers configured
    }, 10000);

    it('should search with server filter', async () => {
      const results = await client.searchTools('test', 'filesystem');
      expect(Array.isArray(results)).toBe(true);
    }, 10000);
  });

  describe('listServers', () => {
    beforeEach(async () => {
      await client.connect();
    }, 10000);

    it('should list available servers', async () => {
      const servers = await client.listServers();
      expect(Array.isArray(servers)).toBe(true);
    }, 10000);
  });

  describe('listTools', () => {
    beforeEach(async () => {
      await client.connect();
    }, 10000);

    it('should list tools from a server', async () => {
      // First get available servers
      const servers = await client.listServers();
      if (servers.length > 0) {
        const tools = await client.listTools(servers[0].name);
        expect(Array.isArray(tools)).toBe(true);
      }
    }, 10000);
  });
});
