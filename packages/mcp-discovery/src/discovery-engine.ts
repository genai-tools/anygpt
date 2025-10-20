import type {
  DiscoveryConfig,
  ServerMetadata,
  SearchOptions,
  SearchResult,
  ToolMetadata,
  ExecutionResult,
  MCPServerConfig,
} from './types.js';
import { SearchEngine } from './search-engine.js';
import { SemanticSearchEngine } from './semantic-search-engine.js';
import { ToolMetadataManager } from './tool-metadata-manager.js';
import { CachingLayer } from './caching-layer.js';
import { MCPClientManager } from './mcp-client.js';

/**
 * Main discovery engine facade that coordinates all components
 */
export class DiscoveryEngine {
  private config: DiscoveryConfig;
  private mcp: Record<string, MCPServerConfig>;
  private searchEngine: SearchEngine;
  private semanticSearchEngine: SemanticSearchEngine | null = null;
  private metadataManager: ToolMetadataManager;
  private cache: CachingLayer;
  private clientManager: MCPClientManager;
  private initialized = false;

  constructor(config: DiscoveryConfig, mcp?: Record<string, MCPServerConfig>) {
    this.config = config;
    this.mcp = mcp || {};
    this.searchEngine = new SearchEngine();
    
    // Initialize semantic search if configured
    if (config.searchMode === 'semantic') {
      this.semanticSearchEngine = new SemanticSearchEngine();
    }
    
    this.metadataManager = new ToolMetadataManager();
    this.cache = new CachingLayer();
    this.clientManager = new MCPClientManager();

    // Apply initial configuration
    this.applyConfiguration();
  }

  /**
   * Initialize connections and discover tools from all servers
   *
   * @param onProgress - Optional callback for progress updates
   */
  async initialize(
    onProgress?: (progress: import('./types.js').ServerProgress) => void
  ): Promise<void> {
    if (this.initialized) {
      return;
    }

    const { Readable } = await import('node:stream');

    // Get all server entries
    const serverEntries = Object.entries(this.mcp);

    // Process servers with concurrency control (max 5 at a time)
    const MAX_CONCURRENT = 5;

    await Readable.from(serverEntries)
      .map(
        async ([name, config]) => {
          // Skip disabled servers
          if (config.enabled === false) {
            onProgress?.({
              server: name,
              status: 'error',
              error: 'Server is disabled',
            });
            return;
          }

          try {
            // Notify: connecting
            onProgress?.({
              server: name,
              status: 'connecting',
              message: 'Connecting to server...',
            });

            // Connect to server
            const connection = await this.clientManager.connect(name, config);

            if (connection.status === 'connected') {
              // Notify: discovering tools
              onProgress?.({
                server: name,
                status: 'discovering',
                message: 'Discovering tools...',
              });

              // Discover tools from this server
              const tools = await this.clientManager.listTools(name);

              // Add tools to metadata manager
              this.metadataManager.addTools(tools);

              // Notify: connected
              onProgress?.({
                server: name,
                status: 'connected',
                toolCount: tools.length,
              });
            } else {
              // Notify: error
              onProgress?.({
                server: name,
                status: 'error',
                error: connection.error || 'Failed to connect',
              });
            }
          } catch (error) {
            // Notify: error
            onProgress?.({
              server: name,
              status: 'error',
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
        { concurrency: MAX_CONCURRENT }
      )
      .toArray(); // Consume the stream

    // Apply filtering rules after all tools are discovered
    if (this.config.toolRules && this.config.toolRules.length > 0) {
      this.metadataManager.applyRules(this.config.toolRules);
    }

    // Index tools for semantic search if enabled
    if (this.semanticSearchEngine) {
      const allTools = this.metadataManager.getAllTools();
      await this.semanticSearchEngine.index(allTools);
    }

    this.initialized = true;
  }

  /**
   * List all available MCP servers
   *
   * @returns Array of server metadata
   */
  async listServers(): Promise<ServerMetadata[]> {
    // Ensure we're initialized
    await this.initialize();

    // Check cache first if enabled
    if (this.config.cache?.enabled) {
      const cached = this.cache.getServerList();
      if (cached) {
        return cached;
      }
    }

    // Get connection statuses
    const statuses = this.clientManager.getConnectionStatuses();

    // Convert MCP server configs to ServerMetadata
    const servers: ServerMetadata[] = Object.entries(this.mcp).map(
      ([name, config]) => {
        // Get tools for this server from metadata manager
        const tools = this.metadataManager.getToolsByServer(name, true);
        const enabledTools = tools.filter((t) => t.enabled);

        return {
          name,
          description: config.description || `MCP server: ${name}`,
          toolCount: tools.length,
          enabledCount: enabledTools.length,
          status: statuses.get(name) || 'disconnected',
          config: {
            command: config.command,
            args: config.args || [],
            env: config.env,
          },
        };
      }
    );

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
  async searchTools(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    // Ensure we're initialized
    await this.initialize();

    // Use semantic search if enabled, otherwise use fuzzy search
    if (this.semanticSearchEngine) {
      return await this.semanticSearchEngine.search(query, options);
    }

    // Fallback to fuzzy search
    const tools = this.metadataManager.getAllTools(options?.includeDisabled);
    this.searchEngine.index(tools);
    return this.searchEngine.search(query, options);
  }

  /**
   * List tools from a specific server
   *
   * @param server - Server name
   * @param includeDisabled - Include disabled tools
   * @returns Array of tool metadata
   */
  async listTools(
    server: string,
    includeDisabled = false
  ): Promise<ToolMetadata[]> {
    // Ensure we're initialized
    await this.initialize();

    // Check cache first if enabled
    if (this.config.cache?.enabled && !includeDisabled) {
      const cached = this.cache.getToolSummaries(server);
      if (cached) {
        return cached;
      }
    }

    // Get tools from metadata manager
    const tools = this.metadataManager.getToolsByServer(
      server,
      includeDisabled
    );

    // Cache if enabled
    if (
      this.config.cache?.enabled &&
      this.config.cache.ttl &&
      !includeDisabled
    ) {
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
  async getToolDetails(
    server: string,
    tool: string
  ): Promise<ToolMetadata | null> {
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
    // Ensure we're initialized
    await this.initialize();

    // Check if tool is enabled
    const toolMetadata = this.metadataManager.getTool(server, tool);
    if (!toolMetadata) {
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool ${tool} not found on server ${server}`,
          server,
          tool,
        },
      };
    }

    if (!toolMetadata.enabled) {
      return {
        success: false,
        error: {
          code: 'TOOL_DISABLED',
          message: `Tool ${tool} is disabled`,
          server,
          tool,
        },
      };
    }

    // Execute tool via MCP client
    try {
      const result = await this.clientManager.executeTool(server, tool, args);
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          server,
          tool,
        },
      };
    }
  }

  /**
   * Reload configuration
   */
  async reload(): Promise<void> {
    // Disconnect from all servers
    await this.clientManager.disconnectAll();

    // Clear all cached data
    this.cache.invalidateAll();
    this.metadataManager.clearAll();

    // Mark as uninitialized
    this.initialized = false;

    // Reinitialize
    await this.initialize();
  }

  /**
   * Cleanup and disconnect from all servers
   */
  async dispose(): Promise<void> {
    await this.clientManager.disconnectAll();
    this.initialized = false;
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
