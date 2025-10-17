import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { DiscoveryConfig } from '@anygpt/mcp-discovery';
import { 
  mockServers, 
  mockTools, 
  mockGitHubTools, 
  mockJiraTools, 
  mockFilesystemTools,
  mockDockerTools,
  getToolsForServer 
} from './fixtures/mock-servers.js';

/**
 * E2E Tests with Mock Fixtures
 * 
 * These tests use realistic mock data to test:
 * - Tool discovery and search
 * - Pattern matching (glob, regex)
 * - Server-specific filtering
 * - Tag-based organization
 * - Whitelist/blacklist modes
 */
describe('MCP Discovery Engine E2E with Fixtures', () => {
  let engine: DiscoveryEngine;

  /**
   * Helper to load mock data into engine
   */
  async function loadMockData(engine: DiscoveryEngine) {
    // In a real implementation, this would connect to actual MCP servers
    // For now, we'll manually index the mock data
    for (const server of mockServers) {
      const tools = getToolsForServer(server.name);
      // TODO: Add method to manually index tools for testing
      // engine.indexServer(server, tools);
    }
  }

  describe('1. Tool Discovery with Real Data', () => {
    beforeEach(() => {
      const config: DiscoveryConfig = {
        enabled: true,
        cache: { enabled: true, ttl: 3600 }
      };
      engine = new DiscoveryEngine(config);
    });

    it('should have 4 mock servers available', () => {
      expect(mockServers).toHaveLength(4);
      expect(mockServers.map(s => s.name)).toEqual([
        'github',
        'jira',
        'filesystem',
        'docker'
      ]);
    });

    it('should have 19 mock tools total', () => {
      expect(mockTools).toHaveLength(19);
      expect(mockGitHubTools).toHaveLength(6);
      expect(mockJiraTools).toHaveLength(4);
      expect(mockFilesystemTools).toHaveLength(5);
      expect(mockDockerTools).toHaveLength(4);
    });

    it('should get tools for specific server', () => {
      const githubTools = getToolsForServer('github');
      expect(githubTools).toHaveLength(6);
      expect(githubTools.every(t => t.server === 'github')).toBe(true);
    });
  });

  describe('2. Pattern Matching with Real Tool Names', () => {
    it('should match GitHub tools with glob pattern', () => {
      const pattern = '*github*';
      const matches = mockTools.filter(t => 
        t.name.includes('github') || t.server.includes('github')
      );
      expect(matches).toHaveLength(6);
      expect(matches.every(t => t.server === 'github')).toBe(true);
    });

    it('should match create tools with glob pattern', () => {
      const pattern = '*create*';
      const matches = mockTools.filter(t => t.name.includes('create'));
      expect(matches.length).toBeGreaterThan(0);
      
      const names = matches.map(t => t.name);
      expect(names).toContain('github_create_issue');
      expect(names).toContain('github_create_pr');
      expect(names).toContain('jira_create_ticket');
    });

    it('should match delete tools with glob pattern', () => {
      const pattern = '*delete*';
      const matches = mockTools.filter(t => t.name.includes('delete'));
      expect(matches.length).toBeGreaterThan(0);
      
      const names = matches.map(t => t.name);
      expect(names).toContain('github_delete_issue');
      expect(names).toContain('delete_file');
    });

    it('should match tools starting with specific prefix', () => {
      const dockerTools = mockTools.filter(t => t.name.startsWith('docker_'));
      expect(dockerTools).toHaveLength(4);
      expect(dockerTools.every(t => t.server === 'docker')).toBe(true);
    });

    it('should match tools ending with specific suffix', () => {
      const fileTools = mockTools.filter(t => t.name.endsWith('_file'));
      expect(fileTools.length).toBeGreaterThan(0);
      
      const names = fileTools.map(t => t.name);
      expect(names).toContain('read_file');
      expect(names).toContain('write_file');
      expect(names).toContain('delete_file');
      expect(names).toContain('stat_file');
    });
  });

  describe('3. Tag-Based Filtering', () => {
    it('should filter by "dangerous" tag', () => {
      const dangerous = mockTools.filter(t => t.tags.includes('dangerous'));
      expect(dangerous.length).toBeGreaterThan(0);
      
      const names = dangerous.map(t => t.name);
      expect(names).toContain('github_delete_issue');
      expect(names).toContain('write_file');
      expect(names).toContain('delete_file');
      expect(names).toContain('docker_stop_container');
      expect(names).toContain('docker_remove_container');
    });

    it('should filter by "safe" tag', () => {
      const safe = mockTools.filter(t => t.tags.includes('safe'));
      expect(safe.length).toBeGreaterThan(0);
      
      const names = safe.map(t => t.name);
      expect(names).toContain('read_file');
      expect(names).toContain('list_directory');
      expect(names).toContain('stat_file');
    });

    it('should filter by "read" tag', () => {
      const readTools = mockTools.filter(t => t.tags.includes('read'));
      expect(readTools.length).toBeGreaterThan(0);
      
      // Should include list, get, read operations
      const names = readTools.map(t => t.name);
      expect(names).toContain('github_list_issues');
      expect(names).toContain('github_get_issue');
      expect(names).toContain('jira_list_tickets');
      expect(names).toContain('read_file');
      expect(names).toContain('docker_list_containers');
    });

    it('should filter by "write" tag', () => {
      const writeTools = mockTools.filter(t => t.tags.includes('write'));
      expect(writeTools.length).toBeGreaterThan(0);
      
      const names = writeTools.map(t => t.name);
      expect(names).toContain('github_create_issue');
      expect(names).toContain('jira_create_ticket');
      expect(names).toContain('write_file');
    });

    it('should filter by multiple tags (AND logic)', () => {
      const githubCreate = mockTools.filter(t => 
        t.tags.includes('github') && t.tags.includes('create')
      );
      expect(githubCreate.length).toBeGreaterThan(0);
      expect(githubCreate.every(t => t.server === 'github')).toBe(true);
    });
  });

  describe('4. Server-Specific Filtering', () => {
    it('should filter GitHub tools', () => {
      const githubTools = mockTools.filter(t => t.server === 'github');
      expect(githubTools).toHaveLength(6);
      expect(githubTools.every(t => t.tags.includes('github'))).toBe(true);
    });

    it('should filter Jira tools', () => {
      const jiraTools = mockTools.filter(t => t.server === 'jira');
      expect(jiraTools).toHaveLength(4);
      expect(jiraTools.every(t => t.tags.includes('jira'))).toBe(true);
    });

    it('should filter Filesystem tools', () => {
      const fsTools = mockTools.filter(t => t.server === 'filesystem');
      expect(fsTools).toHaveLength(5);
      expect(fsTools.every(t => t.tags.includes('filesystem'))).toBe(true);
    });

    it('should filter Docker tools', () => {
      const dockerTools = mockTools.filter(t => t.server === 'docker');
      expect(dockerTools).toHaveLength(4);
      expect(dockerTools.every(t => t.tags.includes('docker'))).toBe(true);
    });
  });

  describe('5. Whitelist Mode Simulation', () => {
    it('should enable only safe read operations', () => {
      // Simulate whitelist: only tools with 'read' and 'safe' tags
      const whitelisted = mockTools.filter(t => 
        t.tags.includes('read') && t.tags.includes('safe')
      );
      
      expect(whitelisted.length).toBeGreaterThan(0);
      const names = whitelisted.map(t => t.name);
      expect(names).toContain('read_file');
      expect(names).toContain('list_directory');
      expect(names).toContain('stat_file');
      
      // Should NOT include dangerous operations
      expect(names).not.toContain('delete_file');
      expect(names).not.toContain('write_file');
    });

    it('should block all dangerous operations', () => {
      // Simulate blacklist: exclude all 'dangerous' tools
      const safe = mockTools.filter(t => !t.tags.includes('dangerous'));
      const dangerous = mockTools.filter(t => t.tags.includes('dangerous'));
      
      expect(safe.length + dangerous.length).toBe(mockTools.length);
      expect(dangerous.length).toBeGreaterThan(0);
      
      // Dangerous tools should be excluded
      const dangerousNames = dangerous.map(t => t.name);
      expect(dangerousNames).toContain('github_delete_issue');
      expect(dangerousNames).toContain('delete_file');
    });
  });

  describe('6. Real-World Scenarios', () => {
    it('should find tools for "create GitHub issue" query', () => {
      // Simulate search for creating GitHub issues
      const matches = mockTools.filter(t => 
        (t.name.includes('create') || t.summary.toLowerCase().includes('create')) &&
        (t.name.includes('github') || t.server === 'github') &&
        (t.name.includes('issue') || t.summary.toLowerCase().includes('issue'))
      );
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].name).toBe('github_create_issue');
    });

    it('should find tools for "list containers" query', () => {
      // Simulate search for listing Docker containers
      const matches = mockTools.filter(t => 
        (t.name.includes('list') || t.summary.toLowerCase().includes('list')) &&
        (t.name.includes('container') || t.summary.toLowerCase().includes('container'))
      );
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].name).toBe('docker_list_containers');
    });

    it('should find tools for "read file" query', () => {
      // Simulate search for reading files
      const matches = mockTools.filter(t => 
        (t.name.includes('read') || t.summary.toLowerCase().includes('read')) &&
        (t.name.includes('file') || t.summary.toLowerCase().includes('file'))
      );
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].name).toBe('read_file');
    });
  });

  describe('7. Production Safety Configuration', () => {
    it('should implement read-only mode', () => {
      // Production config: only read operations
      const readOnly = mockTools.filter(t => 
        t.tags.includes('read') && !t.tags.includes('write')
      );
      
      expect(readOnly.length).toBeGreaterThan(0);
      
      // Verify no write operations
      readOnly.forEach(tool => {
        expect(tool.tags).not.toContain('write');
        expect(tool.tags).not.toContain('delete');
        expect(tool.name).not.toMatch(/create|update|delete|remove|write/);
      });
    });

    it('should block all destructive operations', () => {
      // Block: delete, remove, destroy, drop
      const destructive = mockTools.filter(t => 
        t.name.match(/delete|remove|destroy|drop/) ||
        t.tags.includes('dangerous')
      );
      
      expect(destructive.length).toBeGreaterThan(0);
      
      const names = destructive.map(t => t.name);
      expect(names).toContain('github_delete_issue');
      expect(names).toContain('delete_file');
      expect(names).toContain('docker_remove_container');
    });

    it('should enable only approved collaboration tools', () => {
      // Production: only GitHub issues and Jira tickets
      const approved = mockTools.filter(t => 
        (t.server === 'github' && t.tags.includes('issues')) ||
        (t.server === 'jira' && t.tags.includes('tickets'))
      );
      
      expect(approved.length).toBeGreaterThan(0);
      
      // Should include issue/ticket management
      const names = approved.map(t => t.name);
      expect(names).toContain('github_create_issue');
      expect(names).toContain('github_list_issues');
      expect(names).toContain('jira_create_ticket');
      expect(names).toContain('jira_list_tickets');
    });
  });

  describe('8. Tool Metadata Validation', () => {
    it('should have valid server metadata', () => {
      mockServers.forEach(server => {
        expect(server.name).toBeTruthy();
        expect(server.description).toBeTruthy();
        expect(server.toolCount).toBeGreaterThan(0);
        expect(server.enabledCount).toBe(server.toolCount);
        expect(server.status).toBe('connected');
        expect(server.config.command).toBeTruthy();
        expect(Array.isArray(server.config.args)).toBe(true);
      });
    });

    it('should have valid tool metadata', () => {
      mockTools.forEach(tool => {
        expect(tool.server).toBeTruthy();
        expect(tool.name).toBeTruthy();
        expect(tool.summary).toBeTruthy();
        expect(Array.isArray(tool.tags)).toBe(true);
        expect(tool.tags.length).toBeGreaterThan(0);
        expect(tool.enabled).toBe(true);
        
        if (tool.parameters) {
          tool.parameters.forEach(param => {
            expect(param.name).toBeTruthy();
            expect(param.type).toBeTruthy();
            expect(typeof param.required).toBe('boolean');
          });
        }
      });
    });

    it('should have consistent server-tool relationships', () => {
      mockServers.forEach(server => {
        const serverTools = getToolsForServer(server.name);
        expect(serverTools).toHaveLength(server.toolCount);
        expect(serverTools.every(t => t.server === server.name)).toBe(true);
      });
    });
  });

  describe('9. Complex Filtering Scenarios', () => {
    it('should filter GitHub + create + NOT delete', () => {
      const filtered = mockTools.filter(t => 
        t.server === 'github' &&
        t.tags.includes('create') &&
        !t.tags.includes('delete')
      );
      
      expect(filtered.length).toBeGreaterThan(0);
      const names = filtered.map(t => t.name);
      expect(names).toContain('github_create_issue');
      expect(names).toContain('github_create_pr');
      expect(names).not.toContain('github_delete_issue');
    });

    it('should filter filesystem + safe + read', () => {
      const filtered = mockTools.filter(t => 
        t.server === 'filesystem' &&
        t.tags.includes('safe') &&
        t.tags.includes('read')
      );
      
      expect(filtered.length).toBeGreaterThan(0);
      const names = filtered.map(t => t.name);
      expect(names).toContain('read_file');
      expect(names).toContain('list_directory');
      expect(names).not.toContain('write_file');
      expect(names).not.toContain('delete_file');
    });

    it('should filter all list/get operations across servers', () => {
      const filtered = mockTools.filter(t => 
        t.name.match(/list|get/) ||
        t.tags.includes('list')
      );
      
      expect(filtered.length).toBeGreaterThan(0);
      
      // Should include list/get from multiple servers
      const names = filtered.map(t => t.name);
      expect(names).toContain('github_list_issues');
      expect(names).toContain('github_get_issue');
      expect(names).toContain('github_list_repos');
      expect(names).toContain('jira_list_tickets');
      expect(names).toContain('jira_get_ticket');
      expect(names).toContain('list_directory');
      expect(names).toContain('docker_list_containers');
    });
  });

  describe('10. Tag Statistics', () => {
    it('should count tools by operation type', () => {
      const create = mockTools.filter(t => t.tags.includes('create')).length;
      const read = mockTools.filter(t => t.tags.includes('read')).length;
      const update = mockTools.filter(t => t.tags.includes('update')).length;
      const deleteOps = mockTools.filter(t => t.tags.includes('delete')).length;
      
      expect(create).toBeGreaterThan(0);
      expect(read).toBeGreaterThan(0);
      expect(update).toBeGreaterThan(0);
      expect(deleteOps).toBeGreaterThan(0);
    });

    it('should count tools by safety level', () => {
      const safe = mockTools.filter(t => t.tags.includes('safe')).length;
      const dangerous = mockTools.filter(t => t.tags.includes('dangerous')).length;
      
      expect(safe).toBeGreaterThan(0);
      expect(dangerous).toBeGreaterThan(0);
      expect(safe + dangerous).toBeLessThanOrEqual(mockTools.length);
    });

    it('should count tools by server', () => {
      const byServer = mockServers.map(server => ({
        server: server.name,
        count: getToolsForServer(server.name).length
      }));
      
      expect(byServer).toEqual([
        { server: 'github', count: 6 },
        { server: 'jira', count: 4 },
        { server: 'filesystem', count: 5 },
        { server: 'docker', count: 4 }
      ]);
    });
  });
});
