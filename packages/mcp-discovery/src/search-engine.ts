import type { ToolMetadata, SearchOptions, SearchResult } from './types.js';

/**
 * Search engine for tool discovery with relevance scoring
 */
export class SearchEngine {
  private tools: ToolMetadata[] = [];

  /**
   * Index tools for search
   * 
   * @param tools - Array of tool metadata to index
   */
  index(tools: ToolMetadata[]): void {
    this.tools = tools;
  }

  /**
   * Search for tools with relevance scoring
   * 
   * @param query - Search query
   * @param options - Search options
   * @returns Array of search results sorted by relevance
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 0);

    // Filter tools
    let filteredTools = this.tools;

    // Filter by server if specified
    if (options?.server) {
      filteredTools = filteredTools.filter(t => t.server === options.server);
    }

    // Filter by enabled status (exclude disabled by default)
    if (!options?.includeDisabled) {
      filteredTools = filteredTools.filter(t => t.enabled);
    }

    // Calculate relevance scores
    const results: SearchResult[] = [];

    for (const tool of filteredTools) {
      const relevance = this.calculateRelevance(tool, queryLower, queryTokens);
      
      if (relevance > 0) {
        results.push({
          server: tool.server,
          tool: tool.name,
          summary: tool.summary,
          relevance,
          tags: tool.tags
        });
      }
    }

    // Sort by relevance (descending)
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply limit if specified
    if (options?.limit && options.limit > 0) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Calculate relevance score for a tool
   * 
   * @param tool - Tool metadata
   * @param query - Lowercase query string
   * @param queryTokens - Query split into tokens
   * @returns Relevance score (0-1)
   */
  private calculateRelevance(
    tool: ToolMetadata,
    query: string,
    queryTokens: string[]
  ): number {
    const toolNameLower = tool.name.toLowerCase();
    const summaryLower = tool.summary.toLowerCase();
    const serverLower = tool.server.toLowerCase();
    const tagsLower = tool.tags.map(t => t.toLowerCase());

    let score = 0;

    // Server name match (MASSIVE weight - if user mentions server, heavily prioritize its tools)
    // This ensures that "who am I on atlassian?" finds atlassian tools, not others
    if (query.includes(serverLower) || serverLower.includes(query)) {
      score += 5.0; // Very high boost
    }
    for (const token of queryTokens) {
      if (serverLower === token) {
        score += 5.0; // Exact server name match
      } else if (serverLower.includes(token) || token.includes(serverLower)) {
        score += 3.0; // Partial server name match
      }
    }

    // Exact match in tool name (highest weight)
    if (toolNameLower === query) {
      score += 1.0;
    } else if (toolNameLower.includes(query)) {
      score += 0.8;
    }

    // Exact match in summary
    if (summaryLower.includes(query)) {
      score += 0.6;
    }

    // Partial match (tokenized)
    for (const token of queryTokens) {
      if (toolNameLower.includes(token)) {
        score += 0.4;
      }
      if (summaryLower.includes(token)) {
        score += 0.2;
      }
    }

    // Tag match
    for (const tag of tagsLower) {
      if (query.includes(tag) || tag.includes(query)) {
        score += 0.3;
      }
      for (const token of queryTokens) {
        if (tag.includes(token)) {
          score += 0.15;
        }
      }
    }

    // Normalize score to [0, 1]
    return Math.min(score, 1.0);
  }
}
