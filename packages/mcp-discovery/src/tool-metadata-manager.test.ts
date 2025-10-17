import { describe, it, expect, beforeEach } from 'vitest';
import { ToolMetadataManager } from './tool-metadata-manager.js';
import type { ToolMetadata, ToolRule } from './types.js';

describe('ToolMetadataManager', () => {
  let manager: ToolMetadataManager;

  beforeEach(() => {
    manager = new ToolMetadataManager();
  });

  describe('addTool', () => {
    it('should add a tool', () => {
      const tool: ToolMetadata = {
        server: 'github',
        name: 'create_issue',
        summary: 'Create a GitHub issue',
        enabled: true,
        tags: []
      };

      manager.addTool(tool);
      const retrieved = manager.getTool('github', 'create_issue');
      
      expect(retrieved).toEqual(tool);
    });

    it('should update existing tool', () => {
      const tool: ToolMetadata = {
        server: 'github',
        name: 'create_issue',
        summary: 'Create a GitHub issue',
        enabled: true,
        tags: []
      };

      manager.addTool(tool);
      
      const updated = { ...tool, summary: 'Updated summary' };
      manager.addTool(updated);
      
      const retrieved = manager.getTool('github', 'create_issue');
      expect(retrieved?.summary).toBe('Updated summary');
    });
  });

  describe('getTool', () => {
    it('should return tool if exists', () => {
      const tool: ToolMetadata = {
        server: 'github',
        name: 'create_issue',
        summary: 'Create a GitHub issue',
        enabled: true,
        tags: []
      };

      manager.addTool(tool);
      const retrieved = manager.getTool('github', 'create_issue');
      
      expect(retrieved).toEqual(tool);
    });

    it('should return null if tool does not exist', () => {
      const retrieved = manager.getTool('github', 'nonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getToolsByServer', () => {
    beforeEach(() => {
      manager.addTool({
        server: 'github',
        name: 'create_issue',
        summary: 'Create issue',
        enabled: true,
        tags: []
      });
      manager.addTool({
        server: 'github',
        name: 'delete_repo',
        summary: 'Delete repo',
        enabled: false,
        tags: []
      });
      manager.addTool({
        server: 'jira',
        name: 'create_ticket',
        summary: 'Create ticket',
        enabled: true,
        tags: []
      });
    });

    it('should return all tools from a server', () => {
      const tools = manager.getToolsByServer('github');
      expect(tools).toHaveLength(1); // Only enabled by default
    });

    it('should include disabled tools when requested', () => {
      const tools = manager.getToolsByServer('github', true);
      expect(tools).toHaveLength(2);
    });

    it('should return empty array for unknown server', () => {
      const tools = manager.getToolsByServer('unknown');
      expect(tools).toEqual([]);
    });
  });

  describe('getAllTools', () => {
    beforeEach(() => {
      manager.addTool({
        server: 'github',
        name: 'create_issue',
        summary: 'Create issue',
        enabled: true,
        tags: []
      });
      manager.addTool({
        server: 'github',
        name: 'delete_repo',
        summary: 'Delete repo',
        enabled: false,
        tags: []
      });
      manager.addTool({
        server: 'jira',
        name: 'create_ticket',
        summary: 'Create ticket',
        enabled: true,
        tags: []
      });
    });

    it('should return all enabled tools', () => {
      const tools = manager.getAllTools();
      expect(tools).toHaveLength(2);
    });

    it('should include disabled tools when requested', () => {
      const tools = manager.getAllTools(true);
      expect(tools).toHaveLength(3);
    });
  });

  describe('applyRules', () => {
    beforeEach(() => {
      manager.addTool({
        server: 'github',
        name: 'create_issue',
        summary: 'Create issue',
        enabled: true,
        tags: []
      });
      manager.addTool({
        server: 'github',
        name: 'delete_repo',
        summary: 'Delete repo',
        enabled: true,
        tags: []
      });
      manager.addTool({
        server: 'jira',
        name: 'create_ticket',
        summary: 'Create ticket',
        enabled: true,
        tags: []
      });
    });

    it('should disable tools matching negation pattern', () => {
      const rules: ToolRule[] = [
        { pattern: ['*'], enabled: true }, // Enable all
        { pattern: ['*delete*'], enabled: false } // Disable delete tools
      ];

      manager.applyRules(rules);
      
      const deleteTool = manager.getTool('github', 'delete_repo');
      const createTool = manager.getTool('github', 'create_issue');
      expect(deleteTool?.enabled).toBe(false);
      expect(createTool?.enabled).toBe(true);
    });

    it('should add tags to matching tools', () => {
      const rules: ToolRule[] = [
        { pattern: ['*issue*'], tags: ['issues'] }
      ];

      manager.applyRules(rules);
      
      const tool = manager.getTool('github', 'create_issue');
      expect(tool?.tags).toContain('issues');
    });

    it('should apply server-specific rules', () => {
      const rules: ToolRule[] = [
        { server: 'github', pattern: ['*create*'], tags: ['github-create'] },
        { server: 'jira', pattern: ['*create*'], tags: ['jira-create'] }
      ];

      manager.applyRules(rules);
      
      const githubTool = manager.getTool('github', 'create_issue');
      const jiraTool = manager.getTool('jira', 'create_ticket');
      
      expect(githubTool?.tags).toContain('github-create');
      expect(jiraTool?.tags).toContain('jira-create');
    });

    it('should accumulate tags from multiple matching rules', () => {
      const rules: ToolRule[] = [
        { pattern: ['*create*'], tags: ['create'] },
        { pattern: ['*issue*'], tags: ['issues'] },
        { server: 'github', pattern: ['*'], tags: ['github'] }
      ];

      manager.applyRules(rules);
      
      const tool = manager.getTool('github', 'create_issue');
      expect(tool?.tags).toContain('create');
      expect(tool?.tags).toContain('issues');
      expect(tool?.tags).toContain('github');
    });

    it('should handle whitelist mode (enabled: true)', () => {
      const rules: ToolRule[] = [
        { pattern: ['*create*'], enabled: true } // Only enable tools with "create"
      ];

      manager.applyRules(rules);
      
      const githubCreateTool = manager.getTool('github', 'create_issue');
      const githubDeleteTool = manager.getTool('github', 'delete_repo');
      const jiraCreateTool = manager.getTool('jira', 'create_ticket');
      
      expect(githubCreateTool?.enabled).toBe(true);
      expect(githubDeleteTool?.enabled).toBe(false); // Disabled in whitelist mode
      expect(jiraCreateTool?.enabled).toBe(true);
    });
  });

  describe('getToolCount', () => {
    beforeEach(() => {
      manager.addTool({
        server: 'github',
        name: 'create_issue',
        summary: 'Create issue',
        enabled: true,
        tags: []
      });
      manager.addTool({
        server: 'github',
        name: 'delete_repo',
        summary: 'Delete repo',
        enabled: false,
        tags: []
      });
    });

    it('should return total tool count for server', () => {
      expect(manager.getToolCount('github')).toBe(2);
    });

    it('should return 0 for unknown server', () => {
      expect(manager.getToolCount('unknown')).toBe(0);
    });
  });

  describe('getEnabledCount', () => {
    beforeEach(() => {
      manager.addTool({
        server: 'github',
        name: 'create_issue',
        summary: 'Create issue',
        enabled: true,
        tags: []
      });
      manager.addTool({
        server: 'github',
        name: 'delete_repo',
        summary: 'Delete repo',
        enabled: false,
        tags: []
      });
    });

    it('should return enabled tool count for server', () => {
      expect(manager.getEnabledCount('github')).toBe(1);
    });

    it('should return 0 for unknown server', () => {
      expect(manager.getEnabledCount('unknown')).toBe(0);
    });
  });
});
