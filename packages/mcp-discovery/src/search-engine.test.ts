import { describe, it, expect, beforeEach } from 'vitest';
import { SearchEngine } from './search-engine.js';
import type { ToolMetadata, SearchOptions } from './types.js';

describe('SearchEngine', () => {
  let engine: SearchEngine;
  let tools: ToolMetadata[];

  beforeEach(() => {
    engine = new SearchEngine();
    tools = [
      {
        server: 'github',
        name: 'create_issue',
        summary: 'Create a new GitHub issue',
        enabled: true,
        tags: ['github', 'issues']
      },
      {
        server: 'github',
        name: 'update_issue',
        summary: 'Update an existing GitHub issue',
        enabled: true,
        tags: ['github', 'issues']
      },
      {
        server: 'github',
        name: 'list_repos',
        summary: 'List GitHub repositories',
        enabled: true,
        tags: ['github', 'repos']
      },
      {
        server: 'jira',
        name: 'create_ticket',
        summary: 'Create a new Jira ticket',
        enabled: true,
        tags: ['jira', 'tickets']
      },
      {
        server: 'filesystem',
        name: 'read_file',
        summary: 'Read file contents from disk',
        enabled: true,
        tags: ['filesystem', 'read']
      }
    ];
  });

  describe('index', () => {
    it('should index tools for search', () => {
      expect(() => engine.index(tools)).not.toThrow();
    });

    it('should handle empty tool list', () => {
      expect(() => engine.index([])).not.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      engine.index(tools);
    });

    it('should find tools by exact name match', () => {
      const results = engine.search('create_issue');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tool).toBe('create_issue');
      expect(results[0].server).toBe('github');
      expect(results[0].relevance).toBeGreaterThan(0.8);
    });

    it('should find tools by partial name match', () => {
      const results = engine.search('issue');
      
      expect(results.length).toBeGreaterThan(0);
      const toolNames = results.map(r => r.tool);
      expect(toolNames).toContain('create_issue');
      expect(toolNames).toContain('update_issue');
    });

    it('should find tools by summary match', () => {
      const results = engine.search('GitHub repositories');
      
      expect(results.length).toBeGreaterThan(0);
      const toolNames = results.map(r => r.tool);
      expect(toolNames).toContain('list_repos');
    });

    it('should find tools by tag match', () => {
      const results = engine.search('filesystem');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tool).toBe('read_file');
    });

    it('should rank results by relevance', () => {
      const results = engine.search('github');
      
      expect(results.length).toBeGreaterThan(1);
      // Results should be sorted by relevance (descending)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].relevance).toBeGreaterThanOrEqual(results[i + 1].relevance);
      }
    });

    it('should handle case-insensitive search', () => {
      const lowerResults = engine.search('github');
      const upperResults = engine.search('GITHUB');
      const mixedResults = engine.search('GitHub');
      
      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });

    it('should return empty array for no matches', () => {
      const results = engine.search('nonexistent');
      
      expect(results).toEqual([]);
    });

    it('should filter by server', () => {
      const options: SearchOptions = { server: 'github' };
      const results = engine.search('create', options);
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.server).toBe('github');
      });
    });

    it('should limit results', () => {
      const options: SearchOptions = { limit: 2 };
      const results = engine.search('github', options);
      
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should exclude disabled tools by default', () => {
      const disabledTool: ToolMetadata = {
        server: 'github',
        name: 'delete_repo',
        summary: 'Delete a GitHub repository',
        enabled: false,
        tags: ['github', 'dangerous']
      };
      
      engine.index([...tools, disabledTool]);
      const results = engine.search('delete');
      
      expect(results).toEqual([]);
    });

    it('should include disabled tools when requested', () => {
      const disabledTool: ToolMetadata = {
        server: 'github',
        name: 'delete_repo',
        summary: 'Delete a GitHub repository',
        enabled: false,
        tags: ['github', 'dangerous']
      };
      
      engine.index([...tools, disabledTool]);
      const options: SearchOptions = { includeDisabled: true };
      const results = engine.search('delete', options);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tool).toBe('delete_repo');
    });

    it('should handle multi-word queries', () => {
      const results = engine.search('create github issue');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tool).toBe('create_issue');
    });

    it('should calculate relevance scores correctly', () => {
      const results = engine.search('github issue');
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.relevance).toBeGreaterThan(0);
        expect(result.relevance).toBeLessThanOrEqual(1);
      });
    });
  });
});
