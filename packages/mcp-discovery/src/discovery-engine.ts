import type {
  DiscoveryConfig,
  ServerMetadata,
  SearchOptions,
  SearchResult,
  ToolMetadata,
  ExecutionResult,
  MCPServerConfig
} from './types.js';
import { SearchEngine } from './search-engine.js';
import { ToolMetadataManager } from './tool-metadata-manager.js';
import { CachingLayer } from './caching-layer.js';
import { ToolExecutionProxy } from './tool-execution-proxy.js';

/**
 * Main discovery engine facade that coordinates all components
 */
export class DiscoveryEngine {
  private config: DiscoveryConfig;
  private mcpServers: Record<string, MCPServerConfig>;
  private searchEngine: SearchEngine;
  private metadataManager: ToolMetadataManager;
  private cache: CachingLayer;
  private executionProxy: ToolExecutionProxy;

  constructor(config: DiscoveryConfig, mcpServers?: Record<string, MCPServerConfig>) {
    this.config = config;
    this.mcpServers = mcpServers || {};
    this.searchEngine = new SearchEngine();
    this.metadataManager = new ToolMetadataManager();
    this.cache = new CachingLayer();
    this.executionProxy = new ToolExecutionProxy();

    // Apply initial configuration
    this.applyConfiguration();
  }

  /**
   * List all available MCP servers
   * 
   * @returns Array of server metadata
   */
  async listServers(): Promise<ServerMetadata[]> {
    // Check cache first if enabled
    if (this.config.cache?.enabled) {
      const cached = this.cache.getServerList();
      if (cached) {
        return cached;
      }
    }

    // Convert MCP server configs to ServerMetadata
    const servers: ServerMetadata[] = Object.entries(this.mcpServers).map(([name, config]) => {
      // Get tools for this server from metadata manager
      const tools = this.metadataManager.getToolsByServer(name, true);
      const enabledTools = tools.filter(t => t.enabled);

      return {
        name,
        description: config.description || `MCP server: ${name}`,
        toolCount: tools.length,
        enabledCount: enabledTools.length,
        status: 'connected', // TODO: Actually check connection status
        config: {
          command: config.command,
          args: config.args || [],
          env: config.env
        }
      };
    });

    // Cache if enabled
    if (this.config.cache?.enabled && this.config.cache.ttl) {
      this.cache.cacheServerList(servers, this.config.cache.ttl);
    }

    return servers;
  }

  /**
   * Search for tools across all servers
   * 
   * @param query - Search query
   * @param options - Search options
   * @returns Array of search results
   */
  async searchTools(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // Get all tools from metadata manager
    const tools = this.metadataManager.getAllTools(options?.includeDisabled);

    // Index tools in search engine
    this.searchEngine.index(tools);

    // Perform search
    return this.searchEngine.search(query, options);
  }

  /**
   * List tools from a specific server
   * 
   * @param server - Server name
   * @param includeDisabled - Include disabled tools
   * @returns Array of tool metadata
   */
  async listTools(server: string, includeDisabled = false): Promise<ToolMetadata[]> {
    // Check cache first if enabled
    if (this.config.cache?.enabled && !includeDisabled) {
      const cached = this.cache.getToolSummaries(server);
      if (cached) {
        return cached;
      }
    }

    // Get tools from metadata manager
    const tools = this.metadataManager.getToolsByServer(server, includeDisabled);

    // Cache if enabled
    if (this.config.cache?.enabled && this.config.cache.ttl && !includeDisabled) {
      this.cache.cacheToolSummaries(server, tools, this.config.cache.ttl);
    }

    return tools;
  }

  /**
   * Get detailed information about a specific tool
   * 
   * @param server - Server name
   * @param tool - Tool name
   * @returns Tool metadata or null if not found
   */
  async getToolDetails(server: string, tool: string): Promise<ToolMetadata | null> {
    // Check cache first if enabled
    if (this.config.cache?.enabled) {
      const cached = this.cache.getToolDetails(server, tool);
      if (cached) {
        return cached;
      }
    }

    // Get tool from metadata manager
    const toolMetadata = this.metadataManager.getTool(server, tool);

    // Cache if enabled and found
    if (this.config.cache?.enabled && toolMetadata) {
      this.cache.cacheToolDetails(server, tool, toolMetadata);
    }

    return toolMetadata;
  }

  /**
   * Execute a tool from any discovered MCP server
   * 
   * @param server - Server name
   * @param tool - Tool name
   * @param args - Tool arguments
   * @returns Execution result
   */
  async executeTool(
    server: string,
    tool: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any
  ): Promise<ExecutionResult> {
    // Check if tool is enabled
    const toolMetadata = this.metadataManager.getTool(server, tool);
    if (!toolMetadata) {
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool ${tool} not found on server ${server}`,
          server,
          tool
        }
      };
    }

    if (!toolMetadata.enabled) {
      return {
        success: false,
        error: {
          code: 'TOOL_DISABLED',
          message: `Tool ${tool} is disabled`,
          server,
          tool
        }
      };
    }

    // Execute tool via proxy
    return this.executionProxy.execute(server, tool, args);
  }

  /**
   * Reload configuration
   */
  async reload(): Promise<void> {
    // Invalidate all caches
    this.cache.invalidateAll();

    // Reapply configuration
    this.applyConfiguration();
  }

  /**
   * Get current configuration
   * 
   * @returns Current discovery configuration
   */
  getConfig(): DiscoveryConfig {
    return this.config;
  }

  /**
   * Apply configuration to components
   */
  private applyConfiguration(): void {
    // Apply tool rules to metadata manager
    if (this.config.toolRules && this.config.toolRules.length > 0) {
      this.metadataManager.applyRules(this.config.toolRules);
    }
  }
}
