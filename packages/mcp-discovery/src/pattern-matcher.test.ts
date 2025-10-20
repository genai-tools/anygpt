import { describe, it, expect } from 'vitest';
import { PatternMatcher } from './pattern-matcher.js';

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
      expect(matcher.matchTool('update_issue', ['/^(create|update)_/'])).toBe(
        true
      );
      expect(matcher.matchTool('read_file', ['/(read|write)/'])).toBe(true);
    });

    it('should handle negation patterns', () => {
      const matcher = new PatternMatcher();

      expect(matcher.matchTool('delete_repo', ['!*delete*'])).toBe(false);
      expect(matcher.matchTool('create_repo', ['!*delete*'])).toBe(true);
      expect(matcher.matchTool('dangerous_action', ['!*dangerous*'])).toBe(
        false
      );
    });

    it('should handle mixed patterns', () => {
      const matcher = new PatternMatcher();

      // Match github tools but not delete
      expect(
        matcher.matchTool('github_create_issue', ['*github*', '!*delete*'])
      ).toBe(true);
      expect(
        matcher.matchTool('github_delete_repo', ['*github*', '!*delete*'])
      ).toBe(false);
    });

    it('should return true for empty patterns', () => {
      const matcher = new PatternMatcher();

      expect(matcher.matchTool('any_tool', [])).toBe(true);
    });
  });

  // Note: matchRule and findMatchingRules tests removed
  // These methods are deprecated - use @anygpt/rules RuleEngine instead
});
