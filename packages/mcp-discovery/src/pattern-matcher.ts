import { matchesGlobPatterns } from '@anygpt/config';
import type { ToolRule } from './types.js';

/**
 * Pattern matcher for tool filtering
 * Reuses glob-matcher from @anygpt/config
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

  /**
   * Check if a tool matches a specific rule
   * 
   * @param toolName - Tool name to match
   * @param serverName - Server name
   * @param rule - Tool rule to check
   * @returns true if tool matches the rule
   */
  matchRule(toolName: string, serverName: string, rule: ToolRule): boolean {
    // If rule has server filter, check server name first
    if (rule.server && rule.server !== serverName) {
      return false;
    }

    // Check if tool name matches pattern
    return this.matchTool(toolName, rule.pattern);
  }

  /**
   * Find all rules that match a tool
   * 
   * @param toolName - Tool name to match
   * @param serverName - Server name
   * @param rules - Array of tool rules
   * @returns Array of matching rules
   */
  findMatchingRules(toolName: string, serverName: string, rules: ToolRule[]): ToolRule[] {
    return rules.filter(rule => this.matchRule(toolName, serverName, rule));
  }
}
