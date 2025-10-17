import { describe, it, expect } from 'vitest';
import { PatternMatcher } from './pattern-matcher.js';
import type { ToolRule } from './types.js';

describe('PatternMatcher', () => {
  describe('matchTool', () => {
    it('should match glob patterns', () => {
      const matcher = new PatternMatcher();
      
      expect(matcher.matchTool('github_create_issue', ['*github*'])).toBe(true);
      expect(matcher.matchTool('create_issue', ['*issue*'])).toBe(true);
      expect(matcher.matchTool('github_create_issue', ['github_*'])).toBe(true);
      expect(matcher.matchTool('create_issue', ['*_issue'])).toBe(true);
    });

    it('should match regex patterns', () => {
      const matcher = new PatternMatcher();
      
      expect(matcher.matchTool('create_issue', ['/^create_/'])).toBe(true);
      expect(matcher.matchTool('update_issue', ['/^(create|update)_/'])).toBe(true);
      expect(matcher.matchTool('read_file', ['/(read|write)/'])).toBe(true);
    });

    it('should handle negation patterns', () => {
      const matcher = new PatternMatcher();
      
      expect(matcher.matchTool('delete_repo', ['!*delete*'])).toBe(false);
      expect(matcher.matchTool('create_repo', ['!*delete*'])).toBe(true);
      expect(matcher.matchTool('dangerous_action', ['!*dangerous*'])).toBe(false);
    });

    it('should handle mixed patterns', () => {
      const matcher = new PatternMatcher();
      
      // Match github tools but not delete
      expect(matcher.matchTool('github_create_issue', ['*github*', '!*delete*'])).toBe(true);
      expect(matcher.matchTool('github_delete_repo', ['*github*', '!*delete*'])).toBe(false);
    });

    it('should return true for empty patterns', () => {
      const matcher = new PatternMatcher();
      
      expect(matcher.matchTool('any_tool', [])).toBe(true);
    });
  });

  describe('matchRule', () => {
    it('should match tool against rule without server filter', () => {
      const matcher = new PatternMatcher();
      const rule: ToolRule = {
        pattern: ['*github*'],
        enabled: true
      };
      
      expect(matcher.matchRule('github_create_issue', 'github', rule)).toBe(true);
      expect(matcher.matchRule('create_issue', 'jira', rule)).toBe(false);
    });

    it('should match tool against rule with server filter', () => {
      const matcher = new PatternMatcher();
      const rule: ToolRule = {
        server: 'github',
        pattern: ['*issue*'],
        enabled: true
      };
      
      // Should match: correct server and pattern
      expect(matcher.matchRule('create_issue', 'github', rule)).toBe(true);
      
      // Should not match: wrong server even though pattern matches
      expect(matcher.matchRule('create_issue', 'jira', rule)).toBe(false);
      
      // Should not match: correct server but pattern doesn't match
      expect(matcher.matchRule('list_repos', 'github', rule)).toBe(false);
    });

    it('should handle rule without server filter', () => {
      const matcher = new PatternMatcher();
      const rule: ToolRule = {
        pattern: ['*create*'],
        enabled: true
      };
      
      // Should match any server if pattern matches
      expect(matcher.matchRule('create_issue', 'github', rule)).toBe(true);
      expect(matcher.matchRule('create_ticket', 'jira', rule)).toBe(true);
      expect(matcher.matchRule('list_repos', 'github', rule)).toBe(false);
    });
  });

  describe('findMatchingRules', () => {
    it('should find all matching rules', () => {
      const matcher = new PatternMatcher();
      const rules: ToolRule[] = [
        { pattern: ['*github*'], enabled: true, tags: ['github'] },
        { pattern: ['*issue*'], enabled: true, tags: ['issues'] },
        { pattern: ['*delete*'], enabled: false, tags: ['dangerous'] }
      ];
      
      const matches = matcher.findMatchingRules('github_create_issue', 'github', rules);
      
      expect(matches).toHaveLength(2);
      expect(matches[0].tags).toContain('github');
      expect(matches[1].tags).toContain('issues');
    });

    it('should respect server-specific rules', () => {
      const matcher = new PatternMatcher();
      const rules: ToolRule[] = [
        { server: 'github', pattern: ['*issue*'], enabled: true, tags: ['github-issues'] },
        { server: 'jira', pattern: ['*issue*'], enabled: true, tags: ['jira-issues'] }
      ];
      
      const githubMatches = matcher.findMatchingRules('create_issue', 'github', rules);
      expect(githubMatches).toHaveLength(1);
      expect(githubMatches[0].tags).toContain('github-issues');
      
      const jiraMatches = matcher.findMatchingRules('create_issue', 'jira', rules);
      expect(jiraMatches).toHaveLength(1);
      expect(jiraMatches[0].tags).toContain('jira-issues');
    });

    it('should return empty array if no rules match', () => {
      const matcher = new PatternMatcher();
      const rules: ToolRule[] = [
        { pattern: ['*github*'], enabled: true }
      ];
      
      const matches = matcher.findMatchingRules('jira_create_ticket', 'jira', rules);
      expect(matches).toHaveLength(0);
    });
  });
});
