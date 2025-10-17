import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

/**
 * CLI E2E Tests for MCP Discovery Commands
 * 
 * These tests execute the actual CLI commands and verify their output.
 */
describe('MCP Discovery CLI E2E', () => {
  const CLI = 'npx anygpt';

  /**
   * Helper to execute CLI command and return output
   */
  function runCommand(args: string): { stdout: string; stderr: string; exitCode: number } {
    try {
      const stdout = execSync(`${CLI} ${args}`, {
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || '',
        exitCode: error.status || 1
      };
    }
  }

  describe('1. Help Commands', () => {
    it('should show mcp help', () => {
      const { stdout, exitCode } = runCommand('mcp --help');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Manage MCP servers and tools');
      expect(stdout).toContain('list');
      expect(stdout).toContain('search');
      expect(stdout).toContain('tools');
      expect(stdout).toContain('inspect');
      expect(stdout).toContain('execute');
      expect(stdout).toContain('config');
    });

    it('should show mcp list help', () => {
      const { stdout, exitCode } = runCommand('mcp list --help');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('List all configured MCP servers');
      expect(stdout).toContain('--status');
      expect(stdout).toContain('--tools');
      expect(stdout).toContain('--json');
    });

    it('should show mcp search help', () => {
      const { stdout, exitCode } = runCommand('mcp search --help');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Search for tools across all MCP servers');
      expect(stdout).toContain('--server');
      expect(stdout).toContain('--limit');
      expect(stdout).toContain('--json');
    });

    it('should show mcp tools help', () => {
      const { stdout, exitCode } = runCommand('mcp tools --help');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('List tools from a specific MCP server');
      expect(stdout).toContain('--all');
      expect(stdout).toContain('--tags');
      expect(stdout).toContain('--json');
    });

    it('should show mcp inspect help', () => {
      const { stdout, exitCode } = runCommand('mcp inspect --help');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Get detailed information about a specific tool');
      expect(stdout).toContain('--examples');
      expect(stdout).toContain('--json');
    });

    it('should show mcp execute help', () => {
      const { stdout, exitCode } = runCommand('mcp execute --help');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Execute a tool from any discovered MCP server');
      expect(stdout).toContain('--args');
      expect(stdout).toContain('--json');
      expect(stdout).toContain('--stream');
    });

    it('should show mcp config help', () => {
      const { stdout, exitCode } = runCommand('mcp config --help');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Manage MCP discovery configuration');
      expect(stdout).toContain('show');
      expect(stdout).toContain('validate');
      expect(stdout).toContain('reload');
    });
  });

  describe('2. MCP List Command', () => {
    it('should list MCP servers (no servers configured)', () => {
      const { stdout, exitCode } = runCommand('mcp list');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('No MCP servers configured');
    });

    it('should list MCP servers with JSON output', () => {
      const { stdout, exitCode } = runCommand('mcp list --json');
      
      expect(exitCode).toBe(0);
      
      // Should be valid JSON
      const data = JSON.parse(stdout);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should list MCP servers with status', () => {
      const { stdout, exitCode } = runCommand('mcp list --status');
      
      expect(exitCode).toBe(0);
      // Output should mention status or no servers
      expect(stdout.length).toBeGreaterThan(0);
    });

    it('should list MCP servers with tool counts', () => {
      const { stdout, exitCode } = runCommand('mcp list --tools');
      
      expect(exitCode).toBe(0);
      // Output should mention tools or no servers
      expect(stdout.length).toBeGreaterThan(0);
    });
  });

  describe('3. MCP Search Command', () => {
    it('should search for tools', () => {
      const { stdout, exitCode } = runCommand('mcp search "github"');
      
      expect(exitCode).toBe(0);
      // Should either show results or "No tools found"
      expect(stdout.length).toBeGreaterThan(0);
    });

    it('should search with JSON output', () => {
      const { stdout, exitCode } = runCommand('mcp search "github" --json');
      
      expect(exitCode).toBe(0);
      
      // Should be valid JSON
      const data = JSON.parse(stdout);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should search with server filter', () => {
      const { stdout, exitCode } = runCommand('mcp search "create" --server github');
      
      expect(exitCode).toBe(0);
      expect(stdout.length).toBeGreaterThan(0);
    });

    it('should search with limit', () => {
      const { stdout, exitCode } = runCommand('mcp search "tool" --limit 5');
      
      expect(exitCode).toBe(0);
      expect(stdout.length).toBeGreaterThan(0);
    });
  });

  describe('4. MCP Tools Command', () => {
    it('should list tools from server', () => {
      const { stdout, exitCode } = runCommand('mcp tools github');
      
      expect(exitCode).toBe(0);
      // Should either show tools or error about server not found
      expect(stdout.length).toBeGreaterThan(0);
    });

    it('should list tools with JSON output', () => {
      const { stdout, exitCode } = runCommand('mcp tools github --json');
      
      expect(exitCode).toBe(0);
      
      // Should be valid JSON
      const data = JSON.parse(stdout);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should list all tools including disabled', () => {
      const { stdout, exitCode } = runCommand('mcp tools github --all');
      
      expect(exitCode).toBe(0);
      expect(stdout.length).toBeGreaterThan(0);
    });

    it('should list tools with tags', () => {
      const { stdout, exitCode } = runCommand('mcp tools github --tags');
      
      expect(exitCode).toBe(0);
      expect(stdout.length).toBeGreaterThan(0);
    });
  });

  describe('5. MCP Inspect Command', () => {
    it('should inspect a tool', () => {
      const { stdout, exitCode } = runCommand('mcp inspect github create_issue');
      
      expect(exitCode).toBe(0);
      // Should either show tool details or "not found"
      expect(stdout.length).toBeGreaterThan(0);
    });

    it('should inspect with JSON output', () => {
      const { stdout, exitCode } = runCommand('mcp inspect github create_issue --json');
      
      expect(exitCode).toBe(0);
      
      // Should be valid JSON (or null if not found)
      // If tool not found, output might be a message, so check if it's valid JSON first
      try {
        const data = JSON.parse(stdout);
        expect(data === null || typeof data === 'object').toBe(true);
      } catch {
        // If not valid JSON, it's likely a "not found" message which is acceptable
        expect(stdout.length).toBeGreaterThan(0);
      }
    });

    it('should inspect with examples', () => {
      const { stdout, exitCode } = runCommand('mcp inspect github create_issue --examples');
      
      expect(exitCode).toBe(0);
      expect(stdout.length).toBeGreaterThan(0);
    });
  });

  describe('6. MCP Execute Command', () => {
    it('should execute a tool (will fail without server)', () => {
      const { stdout, exitCode } = runCommand('mcp execute github create_issue --args=\'{"repo":"test/test","title":"Test"}\'');
      
      // Command should run but execution will fail (no server)
      expect(exitCode).toBe(0);
      expect(stdout.length).toBeGreaterThan(0);
    });

    it('should execute with JSON output', () => {
      const { stdout, exitCode } = runCommand('mcp execute github create_issue --args=\'{"repo":"test/test","title":"Test"}\' --json');
      
      expect(exitCode).toBe(0);
      
      // Should be valid JSON
      const data = JSON.parse(stdout);
      expect(typeof data === 'object').toBe(true);
    });

    it('should handle invalid JSON args', () => {
      const { stdout, stderr, exitCode } = runCommand('mcp execute github create_issue --args=\'{invalid}\'');
      
      // Should fail with error about invalid JSON
      expect(exitCode).toBe(1);
      expect(stderr.length > 0 || stdout.includes('Invalid JSON')).toBe(true);
    });
  });

  describe('7. MCP Config Commands', () => {
    it('should show config', () => {
      const { stdout, exitCode } = runCommand('mcp config show');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('MCP Discovery Configuration');
    });

    it('should show config with JSON output', () => {
      const { stdout, exitCode } = runCommand('mcp config show --json');
      
      expect(exitCode).toBe(0);
      
      // Should be valid JSON
      const data = JSON.parse(stdout);
      expect(typeof data === 'object').toBe(true);
      expect(data.enabled).toBeDefined();
      expect(data.cache).toBeDefined();
    });

    it('should validate config', () => {
      const { stdout, exitCode } = runCommand('mcp config validate');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Configuration is valid');
    });

    it('should validate config with JSON output', () => {
      const { stdout, exitCode } = runCommand('mcp config validate --json');
      
      expect(exitCode).toBe(0);
      
      // Should be valid JSON
      const data = JSON.parse(stdout);
      expect(data.valid).toBe(true);
    });

    it('should reload config', () => {
      const { stdout, exitCode } = runCommand('mcp config reload');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Configuration reloaded successfully');
    });

    it('should reload config with JSON output', () => {
      const { stdout, exitCode } = runCommand('mcp config reload --json');
      
      expect(exitCode).toBe(0);
      
      // Should be valid JSON
      const data = JSON.parse(stdout);
      expect(data.reloaded).toBe(true);
    });
  });

  describe('8. Error Handling', () => {
    it('should handle missing required arguments', () => {
      const { stderr, exitCode } = runCommand('mcp search');
      
      // Should fail - missing query argument
      expect(exitCode).toBe(1);
      expect(stderr.length > 0 || stderr.includes('error')).toBe(true);
    });

    it('should handle invalid command', () => {
      const { stderr, exitCode } = runCommand('mcp invalid-command');
      
      // Should fail - invalid command
      expect(exitCode).toBe(1);
      expect(stderr.length).toBeGreaterThan(0);
    });

    it('should handle invalid options', () => {
      const { stderr, exitCode } = runCommand('mcp list --invalid-option');
      
      // Should fail - invalid option
      expect(exitCode).toBe(1);
      expect(stderr.length).toBeGreaterThan(0);
    });
  });

  describe('9. JSON Output Validation', () => {
    it('should produce valid JSON for list command', () => {
      const { stdout, exitCode } = runCommand('mcp list --json');
      
      expect(exitCode).toBe(0);
      expect(() => JSON.parse(stdout)).not.toThrow();
    });

    it('should produce valid JSON for search command', () => {
      const { stdout, exitCode } = runCommand('mcp search "test" --json');
      
      expect(exitCode).toBe(0);
      expect(() => JSON.parse(stdout)).not.toThrow();
    });

    it('should produce valid JSON for config show', () => {
      const { stdout, exitCode } = runCommand('mcp config show --json');
      
      expect(exitCode).toBe(0);
      expect(() => JSON.parse(stdout)).not.toThrow();
    });
  });

  describe('10. Integration Tests', () => {
    it('should run full workflow: list -> search -> config', () => {
      // List servers
      const list = runCommand('mcp list');
      expect(list.exitCode).toBe(0);
      
      // Search for tools
      const search = runCommand('mcp search "github"');
      expect(search.exitCode).toBe(0);
      
      // Show config
      const config = runCommand('mcp config show');
      expect(config.exitCode).toBe(0);
    });

    it('should handle chained commands with JSON output', () => {
      const list = runCommand('mcp list --json');
      expect(list.exitCode).toBe(0);
      const listData = JSON.parse(list.stdout);
      expect(Array.isArray(listData)).toBe(true);
      
      const config = runCommand('mcp config show --json');
      expect(config.exitCode).toBe(0);
      const configData = JSON.parse(config.stdout);
      expect(typeof configData).toBe('object');
    });
  });
});
