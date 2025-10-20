import { matchesGlobPatterns } from '@anygpt/config';

/**
 * Pattern matcher for tool filtering
 * Reuses glob-matcher from @anygpt/config
 *
 * @deprecated Use @anygpt/rules RuleEngine instead
 */
export class PatternMatcher {
  /**
   * Check if a tool name matches any of the patterns
   *
   * @param toolName - Tool name to match
   * @param patterns - Array of glob or regex patterns
   * @returns true if tool matches any pattern
   */
  matchTool(toolName: string, patterns: string[]): boolean {
    return matchesGlobPatterns(toolName, patterns);
  }

  // Note: matchRule and findMatchingRules methods removed
  // Use @anygpt/rules RuleEngine instead for rule-based filtering
}
