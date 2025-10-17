import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DiscoveryConfig, DiscoveryConfig as DiscoveryConfig$1, ExecutionResult, SearchOptions, SearchResult, ServerMetadata, ToolMetadata } from "@anygpt/mcp-discovery";

//#region src/server.d.ts

/**
 * MCP Discovery Server - PRIMARY interface for AI agents
 * Exposes 5 meta-tools for tool discovery and execution
 */
declare class DiscoveryMCPServer {
  private server;
  private engine;
  private tools;
  constructor(config: DiscoveryConfig$1);
  /**
   * Define the 5 meta-tools
   */
  private defineTools;
  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers;
  /**
   * Handle tool call
   */
  handleToolCall(name: string, args: any): Promise<any>;
  /**
   * Handle list_mcp_servers
   */
  private handleListServers;
  /**
   * Handle search_tools
   */
  private handleSearchTools;
  /**
   * Handle list_tools
   */
  private handleListTools;
  /**
   * Handle get_tool_details
   */
  private handleGetToolDetails;
  /**
   * Handle execute_tool
   */
  private handleExecuteTool;
  /**
   * Get registered tools
   */
  getTools(): Tool[];
  /**
   * Start the server
   */
  start(): Promise<void>;
}
//#endregion
export { type DiscoveryConfig, DiscoveryMCPServer, type ExecutionResult, type SearchOptions, type SearchResult, type ServerMetadata, type ToolMetadata };
//# sourceMappingURL=index.d.ts.map