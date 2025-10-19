import type { ToolMetadata } from './types.js';
import type { Rule } from '@anygpt/rules';
import type { ToolRuleTarget } from '@anygpt/types';
import { RuleEngine } from '@anygpt/rules';

/**
 * Tool metadata manager for storing and filtering tools
 */
export class ToolMetadataManager {
  private tools: Map<string, ToolMetadata> = new Map();

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
   * Add multiple tools at once
   * 
   * @param tools - Array of tool metadata to add
   */
  addTools(tools: ToolMetadata[]): void {
    for (const tool of tools) {
      this.addTool(tool);
    }
  }

  /**
   * Clear all tools for a specific server
   * 
   * @param server - Server name
   */
  clearServerTools(server: string): void {
    const keysToDelete: string[] = [];
    for (const [key, tool] of this.tools.entries()) {
      if (tool.server === server) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.tools.delete(key);
    }
  }

  /**
   * Clear all tools
   */
  clearAll(): void {
    this.tools.clear();
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
   * Apply filtering rules to all tools using rule engine
   * 
   * @param rules - Array of rules from @anygpt/rules
   */
  applyRules(rules: Rule<ToolRuleTarget>[]): void {
    if (!rules || rules.length === 0) {
      return;
    }

    const engine = new RuleEngine(rules);

    // Apply rules to each tool
    for (const tool of this.tools.values()) {
      // Convert ToolMetadata to ToolRuleTarget
      const target: ToolRuleTarget = {
        server: tool.server,
        name: tool.name,
        enabled: tool.enabled,
        tags: [...tool.tags]
      };

      // Apply rules
      const result = engine.apply(target);

      // Update tool with results
      tool.enabled = result.enabled;
      tool.tags = [...new Set(result.tags)]; // Deduplicate tags
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
