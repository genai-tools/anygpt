import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  IMCPDiscoveryClient,
  ToolSearchResult,
  ToolSummary,
  ToolDetails,
  ToolExecutionParams,
  ToolExecutionResult,
  ServerInfo,
} from './types.js';

/**
 * MCP Discovery Client
 * Connects to @anygpt/mcp-discovery server for on-demand tool discovery
 */
export class MCPDiscoveryClient implements IMCPDiscoveryClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected = false;

  /**
   * Connect to the discovery server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    // Create transport - spawn discovery server as child process
    // npx will use local workspace version in development, published package in production
    this.transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@anygpt/mcp-discovery-server'],
      env: {
        ...process.env,
        // Pass config path via environment variable
        ANYGPT_CONFIG_PATH: process.cwd(),
      },
    });

    // Create client
    this.client = new Client(
      {
        name: 'anygpt-cli',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect
    await this.client.connect(this.transport);
    this.connected = true;
  }

  /**
   * Disconnect from the discovery server
   */
  async disconnect(): Promise<void> {
    if (!this.connected || !this.client) {
      return;
    }

    await this.client.close();
    this.client = null;
    this.transport = null;
    this.connected = false;
  }

  /**
   * Search for tools across all servers
   */
  async searchTools(
    query: string,
    server?: string
  ): Promise<ToolSearchResult[]> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const result = await this.client.callTool({
      name: 'search_tools',
      arguments: {
        query,
        ...(server && { server }),
      },
    });

    // Parse result - MCP tools return content array
    if (result.content && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent.type === 'text' && firstContent.text) {
        try {
          const data = JSON.parse(firstContent.text);
          // Server returns { results: [...] }
          if (data.results && Array.isArray(data.results)) {
            return data.results;
          }
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      }
    }

    return [];
  }

  /**
   * List all tools from a specific server
   */
  async listTools(server: string): Promise<ToolSummary[]> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const result = await this.client.callTool({
      name: 'list_tools',
      arguments: { server },
    });

    // Parse result
    if (result.content && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent.type === 'text' && firstContent.text) {
        try {
          const data = JSON.parse(firstContent.text);
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      }
    }

    return [];
  }

  /**
   * Get detailed information about a tool
   */
  async getToolDetails(server: string, tool: string): Promise<ToolDetails> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const result = await this.client.callTool({
      name: 'get_tool_details',
      arguments: { server, tool },
    });

    // Parse result
    if (result.content && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent.type === 'text' && firstContent.text) {
        try {
          const data = JSON.parse(firstContent.text);
          // Server returns { tool: {...} }
          return data.tool || data;
        } catch {
          throw new Error('Failed to parse tool details');
        }
      }
    }

    throw new Error('Failed to get tool details');
  }

  /**
   * Execute a tool
   */
  async executeTool(
    params: ToolExecutionParams
  ): Promise<ToolExecutionResult> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const result = await this.client.callTool({
      name: 'execute_tool',
      arguments: {
        server: params.server,
        tool: params.tool,
        arguments: params.arguments,
      },
    });

    return {
      content: result.content,
      isError: result.isError,
    };
  }

  /**
   * List all available MCP servers
   */
  async listServers(): Promise<ServerInfo[]> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const result = await this.client.callTool({
      name: 'list_mcp_servers',
      arguments: {},
    });

    // Parse result
    if (result.content && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent.type === 'text' && firstContent.text) {
        try {
          const data = JSON.parse(firstContent.text);
          // Server returns { servers: [...] }
          if (data.servers && Array.isArray(data.servers)) {
            return data.servers;
          }
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      }
    }

    return [];
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Ensure client is connected
   */
  private ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new Error('MCP client not connected. Call connect() first.');
    }
  }
}
