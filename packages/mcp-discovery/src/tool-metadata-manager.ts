import type { ToolMetadata, ToolRule } from './types.js';
import { PatternMatcher } from './pattern-matcher.js';

/**
 * Tool metadata manager for storing and filtering tools
 */
export class ToolMetadataManager {
  private tools: Map<string, ToolMetadata> = new Map();
  private patternMatcher: PatternMatcher = new PatternMatcher();

  /**
   * Add or update a tool
   * 
   * @param tool - Tool metadata to add
   */
  addTool(tool: ToolMetadata): void {
    const key = this.getToolKey(tool.server, tool.name);
    this.tools.set(key, tool);
  }

  /**
   * Get a specific tool
   * 
   * @param server - Server name
   * @param tool - Tool name
   * @returns Tool metadata or null if not found
   */
  getTool(server: string, tool: string): ToolMetadata | null {
    const key = this.getToolKey(server, tool);
    return this.tools.get(key) || null;
  }

  /**
   * Get all tools from a specific server
   * 
   * @param server - Server name
   * @param includeDisabled - Include disabled tools
   * @returns Array of tool metadata
   */
  getToolsByServer(server: string, includeDisabled = false): ToolMetadata[] {
    const tools: ToolMetadata[] = [];
    
    for (const tool of this.tools.values()) {
      if (tool.server === server) {
        if (includeDisabled || tool.enabled) {
          tools.push(tool);
        }
      }
    }
    
    return tools;
  }

  /**
   * Get all tools from all servers
   * 
   * @param includeDisabled - Include disabled tools
   * @returns Array of tool metadata
   */
  getAllTools(includeDisabled = false): ToolMetadata[] {
    const tools: ToolMetadata[] = [];
    
    for (const tool of this.tools.values()) {
      if (includeDisabled || tool.enabled) {
        tools.push(tool);
      }
    }
    
    return tools;
  }

  /**
   * Apply filtering rules to all tools
   * 
   * @param rules - Array of tool rules
   */
  applyRules(rules: ToolRule[]): void {
    // Check if whitelist mode (any rule has enabled: true)
    const hasWhitelist = rules.some(r => r.enabled === true);

    // Apply rules to each tool
    for (const tool of this.tools.values()) {
      // Start with default enabled status
      let enabled = !hasWhitelist; // In whitelist mode, default is disabled
      const tags: string[] = [...tool.tags];

      // Process rules in order
      for (const rule of rules) {
        // Check if rule matches this tool
        if (!this.patternMatcher.matchRule(tool.name, tool.server, rule)) {
          continue;
        }

        // First matching rule with enabled field sets the status
        if (rule.enabled !== undefined) {
          enabled = rule.enabled;
        }

        // Accumulate tags from all matching rules
        if (rule.tags) {
          tags.push(...rule.tags);
        }
      }

      // Update tool with new enabled status and tags
      tool.enabled = enabled;
      tool.tags = [...new Set(tags)]; // Deduplicate tags
    }
  }

  /**
   * Get total tool count for a server
   * 
   * @param server - Server name
   * @returns Total tool count
   */
  getToolCount(server: string): number {
    let count = 0;
    for (const tool of this.tools.values()) {
      if (tool.server === server) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get enabled tool count for a server
   * 
   * @param server - Server name
   * @returns Enabled tool count
   */
  getEnabledCount(server: string): number {
    let count = 0;
    for (const tool of this.tools.values()) {
      if (tool.server === server && tool.enabled) {
        count++;
      }
    }
    return count;
  }

  /**
   * Generate a unique key for a tool
   * 
   * @param server - Server name
   * @param tool - Tool name
   * @returns Unique key
   */
  private getToolKey(server: string, tool: string): string {
    return `${server}:${tool}`;
  }
}
