/**
 * MCP Discovery Client types
 */

/**
 * Tool search result from discovery server
 */
export interface ToolSearchResult {
  server: string;
  tool: string;
  summary: string;
  relevance: number;
}

/**
 * Tool summary from list_tools
 */
export interface ToolSummary {
  name: string;
  description?: string;
}

/**
 * Tool details from get_tool_details
 */
export interface ToolDetails {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Tool execution parameters
 */
export interface ToolExecutionParams {
  server: string;
  tool: string;
  arguments: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  content: Array<{
    type: string;
    text?: string;
    [key: string]: unknown;
  }>;
  isError?: boolean;
}

/**
 * Server information
 */
export interface ServerInfo {
  name: string;
  enabled: boolean;
  toolCount?: number;
}

/**
 * MCP Discovery Client interface
 */
export interface IMCPDiscoveryClient {
  /**
   * Connect to discovery server
   */
  connect(): Promise<void>;

  /**
   * Disconnect from discovery server
   */
  disconnect(): Promise<void>;

  /**
   * Search for tools across all servers
   */
  searchTools(query: string, server?: string): Promise<ToolSearchResult[]>;

  /**
   * List all tools from a specific server
   */
  listTools(server: string): Promise<ToolSummary[]>;

  /**
   * Get detailed information about a tool
   */
  getToolDetails(server: string, tool: string): Promise<ToolDetails>;

  /**
   * Execute a tool
   */
  executeTool(params: ToolExecutionParams): Promise<ToolExecutionResult>;

  /**
   * List all available MCP servers
   */
  listServers(): Promise<ServerInfo[]>;

  /**
   * Check if client is connected
   */
  isConnected(): boolean;
}
