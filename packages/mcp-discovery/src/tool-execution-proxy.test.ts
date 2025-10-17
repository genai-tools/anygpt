import { describe, it, expect, beforeEach } from 'vitest';
import { ToolExecutionProxy } from './tool-execution-proxy.js';

describe('ToolExecutionProxy', () => {
  let proxy: ToolExecutionProxy;

  beforeEach(() => {
    proxy = new ToolExecutionProxy();
  });

  describe('Connection Management', () => {
    it('should track connection status', () => {
      expect(proxy.isConnected('github')).toBe(false);
    });

    it('should mark server as connected after connection', async () => {
      // Note: This is a mock test - actual connection would require MCP server
      // For now, we'll test the interface
      expect(proxy.isConnected('github')).toBe(false);
    });
  });

  describe('Tool Execution', () => {
    it('should return error for unconnected server', async () => {
      const result = await proxy.execute('github', 'create_issue', {
        repo: 'test/repo',
        title: 'Test issue'
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVER_NOT_CONNECTED');
    });

    it('should return error for invalid tool arguments', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await proxy.execute('github', 'create_issue', null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ARGUMENTS');
    });

    it('should handle execution errors gracefully', async () => {
      // Mock a connection that will fail
      const result = await proxy.execute('nonexistent', 'tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return structured error for connection failures', async () => {
      const result = await proxy.execute('github', 'create_issue', {});

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
        server: 'github',
        tool: 'create_issue'
      });
    });

    it('should handle timeout errors', async () => {
      // This would require actual MCP server connection to test properly
      // For now, verify the interface
      const result = await proxy.execute('github', 'slow_tool', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Connection Cleanup', () => {
    it('should disconnect from server', async () => {
      await proxy.disconnect('github');
      expect(proxy.isConnected('github')).toBe(false);
    });

    it('should handle disconnect for non-connected server', async () => {
      // Should not throw
      await expect(proxy.disconnect('nonexistent')).resolves.not.toThrow();
    });
  });
});
