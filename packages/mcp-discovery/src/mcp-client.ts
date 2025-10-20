/**
 * MCP Client wrapper for connecting to and managing MCP servers
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MCPServerConfig, ToolMetadata, ToolParameter } from './types.js';

/**
 * JSON Schema property definition
 */
interface JsonSchemaProperty {
  type?: string;
  description?: string;
  title?: string;
  default?: unknown;
  [key: string]: unknown;
}

/**
 * JSON Schema definition
 */
interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Convert JSON Schema to ToolParameter array
 */
function convertJsonSchemaToParameters(
  inputSchema: JsonSchema | undefined
): ToolParameter[] {
  if (!inputSchema || typeof inputSchema !== 'object') {
    return [];
  }

  const properties = inputSchema.properties || {};
  const required = inputSchema.required || [];
  const parameters: ToolParameter[] = [];

  for (const [name, schema] of Object.entries(properties)) {
    parameters.push({
      name,
      type: schema.type || 'string',
      description: schema.description || schema.title || '',
      required: required.includes(name),
      default: schema.default,
    });
  }

  return parameters;
}

export interface MCPConnection {
  client: Client;
  transport: StdioClientTransport;
  serverName: string;
  config: MCPServerConfig;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
}

/**
 * MCP Client Manager - handles connections to MCP servers
 */
export class MCPClientManager {
  private connections: Map<string, MCPConnection> = new Map();

  /**
   * Connect to an MCP server
   */
  async connect(
    serverName: string,
    config: MCPServerConfig
  ): Promise<MCPConnection> {
    let stderrOutput = '';

    try {
      // Create transport for stdio communication with stderr piped
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: config.env ? { ...process.env, ...config.env } : process.env,
        stderr: 'pipe', // Pipe stderr so we can capture it
      });

      // Capture stderr output
      const stderrStream = transport.stderr;
      if (stderrStream) {
        stderrStream.on('data', (chunk: Buffer) => {
          stderrOutput += chunk.toString();
        });
      }

      // Create MCP client
      const client = new Client(
        {
          name: 'anygpt-discovery',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect client to transport
      await client.connect(transport);

      const connection: MCPConnection = {
        client,
        transport,
        serverName,
        config,
        status: 'connected',
      };

      this.connections.set(serverName, connection);
      return connection;
    } catch (error) {
      // Use captured stderr if available, otherwise use error message
      let errorMessage = stderrOutput.trim();

      if (!errorMessage && error instanceof Error) {
        errorMessage = error.message;

        // Add helpful context based on error type
        if (errorMessage.includes('ENOENT')) {
          errorMessage = `Command not found: ${config.command}`;
        } else if (errorMessage.includes('EACCES')) {
          errorMessage = `Permission denied: ${config.command}`;
        } else if (errorMessage.includes('spawn')) {
          errorMessage = `Failed to spawn: ${config.command} ${
            config.args?.join(' ') || ''
          }`;
        }
      } else if (!errorMessage) {
        errorMessage = String(error);
      }

      const errorConnection: MCPConnection = {
        client: null as any,
        transport: null as any,
        serverName,
        config,
        status: 'error',
        error: errorMessage || 'Unknown error',
      };
      this.connections.set(serverName, errorConnection);
      return errorConnection;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName);
    if (connection) {
      try {
        // Close client first
        if (connection.status === 'connected' && connection.client) {
          await connection.client.close();
        }

        // Then close transport to kill child process
        if (connection.transport) {
          await connection.transport.close();
        }

        connection.status = 'disconnected';
      } catch (error) {
        // Ignore disconnect errors
      }
    }
    this.connections.delete(serverName);
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map((name) =>
      this.disconnect(name)
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Get connection for a server
   */
  getConnection(serverName: string): MCPConnection | undefined {
    return this.connections.get(serverName);
  }

  /**
   * List tools from a connected server
   */
  async listTools(serverName: string): Promise<ToolMetadata[]> {
    const connection = this.connections.get(serverName);
    if (!connection || connection.status !== 'connected') {
      return [];
    }

    try {
      const response = await connection.client.listTools();

      // Get server config to check for prefix
      const prefix = connection.config.prefix;

      return response.tools.map((tool) => ({
        name: prefix ? `${prefix}${tool.name}` : tool.name,
        summary: tool.description || '',
        description: tool.description,
        server: serverName,
        enabled: true, // Default to enabled, will be filtered by rules
        tags: [], // Initialize with empty tags array
        parameters: convertJsonSchemaToParameters(tool.inputSchema),
      }));
    } catch {
      // Silently return empty array on error
      return [];
    }
  }

  /**
   * Execute a tool on a connected server
   */
  async executeTool(
    serverName: string,
    toolName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any
  ): Promise<any> {
    const connection = this.connections.get(serverName);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`Server ${serverName} is not connected`);
    }

    try {
      const response = await connection.client.callTool({
        name: toolName,
        arguments: args,
      });

      return response;
    } catch (error) {
      throw new Error(
        `Failed to execute tool ${toolName} on ${serverName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check if a server is connected
   */
  isConnected(serverName: string): boolean {
    const connection = this.connections.get(serverName);
    return connection?.status === 'connected';
  }

  /**
   * Get all connection statuses
   */
  getConnectionStatuses(): Map<string, 'connected' | 'disconnected' | 'error'> {
    const statuses = new Map<string, 'connected' | 'disconnected' | 'error'>();
    for (const [name, conn] of this.connections.entries()) {
      statuses.set(name, conn.status);
    }
    return statuses;
  }
}
