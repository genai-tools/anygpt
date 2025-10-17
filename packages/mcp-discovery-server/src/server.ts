/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type Tool
} from '@modelcontextprotocol/sdk/types.js';
import { DiscoveryEngine, type DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * MCP Discovery Server - PRIMARY interface for AI agents
 * Exposes 5 meta-tools for tool discovery and execution
 */
export class DiscoveryMCPServer {
  private server: Server;
  private engine: DiscoveryEngine;
  private tools: Tool[];

  constructor(config: DiscoveryConfig) {
    this.engine = new DiscoveryEngine(config);
    this.server = new Server(
      {
        name: 'mcp-discovery-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tools = this.defineTools();
    this.setupHandlers();
  }

  /**
   * Define the 5 meta-tools
   */
  private defineTools(): Tool[] {
    return [
      {
        name: 'list_mcp_servers',
        description: 'List all available MCP servers that can be discovered',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'search_tools',
        description: 'Search for tools across all MCP servers using free-text query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "github issue", "read file")'
            },
            server: {
              type: 'string',
              description: 'Optional: Filter by server name'
            },
            limit: {
              type: 'number',
              description: 'Optional: Maximum number of results (default: 10)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'list_tools',
        description: 'List all tools from a specific MCP server',
        inputSchema: {
          type: 'object',
          properties: {
            server: {
              type: 'string',
              description: 'Server name (e.g., "github", "filesystem")'
            },
            includeDisabled: {
              type: 'boolean',
              description: 'Include disabled tools (default: false)'
            }
          },
          required: ['server']
        }
      },
      {
        name: 'get_tool_details',
        description: 'Get detailed information about a specific tool',
        inputSchema: {
          type: 'object',
          properties: {
            server: {
              type: 'string',
              description: 'Server name'
            },
            tool: {
              type: 'string',
              description: 'Tool name'
            }
          },
          required: ['server', 'tool']
        }
      },
      {
        name: 'execute_tool',
        description: 'Execute a tool from any MCP server (gateway capability)',
        inputSchema: {
          type: 'object',
          properties: {
            server: {
              type: 'string',
              description: 'Server name'
            },
            tool: {
              type: 'string',
              description: 'Tool name'
            },
            arguments: {
              type: 'object',
              description: 'Tool arguments'
            }
          },
          required: ['server', 'tool', 'arguments']
        }
      }
    ];
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools
    }));

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.handleToolCall(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: errorMessage
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Handle tool call
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'list_mcp_servers':
        return this.handleListServers();
      
      case 'search_tools':
        return this.handleSearchTools(args);
      
      case 'list_tools':
        return this.handleListTools(args);
      
      case 'get_tool_details':
        return this.handleGetToolDetails(args);
      
      case 'execute_tool':
        return this.handleExecuteTool(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Handle list_mcp_servers
   */
  private async handleListServers(): Promise<any> {
    const servers = await this.engine.listServers();
    return { servers };
  }

  /**
   * Handle search_tools
   */
  private async handleSearchTools(args: any): Promise<any> {
    if (!args.query) {
      throw new Error('Missing required parameter: query');
    }

    const results = await this.engine.searchTools(args.query, {
      server: args.server,
      limit: args.limit || 10
    });

    return { results };
  }

  /**
   * Handle list_tools
   */
  private async handleListTools(args: any): Promise<any> {
    if (!args.server) {
      throw new Error('Missing required parameter: server');
    }

    const tools = await this.engine.listTools(
      args.server,
      args.includeDisabled || false
    );

    return { tools };
  }

  /**
   * Handle get_tool_details
   */
  private async handleGetToolDetails(args: any): Promise<any> {
    if (!args.server) {
      throw new Error('Missing required parameter: server');
    }
    if (!args.tool) {
      throw new Error('Missing required parameter: tool');
    }

    const tool = await this.engine.getToolDetails(args.server, args.tool);
    return { tool };
  }

  /**
   * Handle execute_tool
   */
  private async handleExecuteTool(args: any): Promise<any> {
    if (!args.server) {
      throw new Error('Missing required parameter: server');
    }
    if (!args.tool) {
      throw new Error('Missing required parameter: tool');
    }
    if (args.arguments === undefined) {
      throw new Error('Missing required parameter: arguments');
    }

    return await this.engine.executeTool(
      args.server,
      args.tool,
      args.arguments
    );
  }

  /**
   * Get registered tools
   */
  getTools(): Tool[] {
    return this.tools;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
