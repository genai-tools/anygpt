/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  type CallToolRequest,
  type Tool,
  type Prompt,
  type GetPromptRequest,
  type Resource,
  type ReadResourceRequest,
  type ResourceTemplate,
} from '@modelcontextprotocol/sdk/types.js';
import { DiscoveryEngine, type DiscoveryConfig } from '@anygpt/mcp-discovery';
import { createLogger, type MCPLogger } from '@anygpt/mcp-logger';

/**
 * MCP Discovery Server - PRIMARY interface for AI agents
 * Exposes 5 meta-tools for tool discovery and execution
 */
export class DiscoveryMCPServer {
  private server: Server;
  private engine: DiscoveryEngine;
  private tools: Tool[];
  private prompts: Prompt[];
  private resources: Resource[];
  private resourceTemplates: ResourceTemplate[];
  private logger: MCPLogger;

  constructor(config: DiscoveryConfig, mcpServers?: Record<string, any>) {
    // Initialize file-based logger
    this.logger = createLogger({
      logFile: process.env['MCP_DISCOVERY_LOG_FILE'] || './logs/mcp-discovery.log',
      level: (process.env['MCP_LOG_LEVEL'] as any) || 'info',
      serverName: 'mcp-discovery',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      enableStderr: process.env['MCP_LOG_STDERR'] === 'true',
    });

    this.logger.info('Initializing MCP Discovery Server');

    this.engine = new DiscoveryEngine(config, mcpServers);
    this.server = new Server(
      {
        name: 'mcp-discovery-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );

    this.tools = this.defineTools();
    this.prompts = this.definePrompts();
    this.resources = this.defineResources();
    this.resourceTemplates = this.defineResourceTemplates();
    this.setupHandlers();

    this.logger.info('MCP Discovery Server initialized', {
      toolCount: this.tools.length,
      promptCount: this.prompts.length,
      resourceCount: this.resources.length,
    });
  }

  /**
   * Define the 5 meta-tools
   */
  private defineTools(): Tool[] {
    return [
      {
        name: 'list_mcp_servers',
        description: `List all available MCP servers with their connection status and tool counts. Check the "status" field to see which servers are connected - only connected servers can execute tools. Use this to understand available capabilities or troubleshoot connectivity.`,
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'search_tools',
        description: `PRIMARY DISCOVERY METHOD: Search for tools across ALL MCP servers using natural language queries. Use this FIRST when you need to find a tool for any task. By default returns concise results (summary + howToExecute). Set includeSchema=true to get full parameter schemas for immediate execution without calling get_tool_details. Provide a natural language query describing what you need to do (e.g., "read file", "create github issue", "list docker containers"). This is your main discovery method - use it before assuming tools don't exist!`,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language search query describing what you need to do. Be specific: use action verbs + resource names (e.g., "create github issue", "read file content", "list docker containers")',
            },
            server: {
              type: 'string',
              description: 'Optional: Filter results to a specific server name (e.g., "github", "filesystem"). Only use if you already know which server you need.',
            },
            limit: {
              type: 'number',
              description: 'Optional: Maximum number of results to return (default: 1). Returns only the best match by default. Increase if you need to compare multiple options.',
            },
            includeSchema: {
              type: 'boolean',
              description: 'Optional: Include full inputSchema in results (default: false). Set to true only when you need to execute immediately without calling get_tool_details. Keep false for browsing/exploration to reduce token usage.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_tools',
        description: `List all tools from a specific MCP server. Use this when you already know the server name and want to browse its complete tool catalog. For finding tools by capability, use search_tools instead.`,
        inputSchema: {
          type: 'object',
          properties: {
            server: {
              type: 'string',
              description: 'Server name to list tools from (e.g., "github", "filesystem", "docker"). Must be exact server name from list_mcp_servers.',
            },
            includeDisabled: {
              type: 'boolean',
              description: 'Optional: Include disabled tools in results (default: false). Set to true to see all tools including those that are disabled.',
            },
          },
          required: ['server'],
        },
      },
      {
        name: 'get_tool_details',
        description: `OPTIONAL: Get complete documentation for a specific tool. Since search_tools now includes inputSchema, you can often execute directly without this call. Use get_tool_details only for: (1) complex schemas that need careful study, (2) tools with usage examples, or (3) detailed parameter descriptions. For simple tools, the schema in search results is sufficient.`,
        inputSchema: {
          type: 'object',
          properties: {
            server: {
              type: 'string',
              description: 'Server name where the tool is located (from search_tools or list_tools results)',
            },
            tool: {
              type: 'string',
              description: 'Tool name to get details for (from search_tools or list_tools results)',
            },
          },
          required: ['server', 'tool'],
        },
      },
      {
        name: 'execute_tool',
        description: `PRIMARY EXECUTION METHOD: Execute tools from ANY discovered MCP server through this gateway. This is the ONLY way to execute tools from discovered servers. ALWAYS call get_tool_details first to understand parameters. Can only execute from CONNECTED servers - check list_mcp_servers if you get "Server not configured" errors. Use the fully qualified tool name from search_tools results (e.g., "github:create_issue").`,
        inputSchema: {
          type: 'object',
          properties: {
            server: {
              type: 'string',
              description: 'Server name where the tool is located (from search_tools results)',
            },
            tool: {
              type: 'string',
              description: 'Tool name to execute (from search_tools results)',
            },
            arguments: {
              type: 'object',
              description: 'Optional: Tool arguments object matching the parameter schema from get_tool_details. Omit if tool has no parameters.',
            },
          },
          required: ['server', 'tool'],
        },
      },
      {
        name: 'refresh_cache',
        description: `Refresh the discovery cache by re-discovering tools from all MCP servers. Use this if servers were started after the discovery server, or if tools are not being found. This will reconnect to all servers and rebuild the tool index.`,
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ];
  }

  /**
   * Define prompts with comprehensive usage instructions
   */
  private definePrompts(): Prompt[] {
    return [
      {
        name: 'mcp-discovery-usage-guide',
        title: 'MCP Discovery Server - Complete Usage Guide',
        description: 'Comprehensive instructions for AI agents on how to effectively use the MCP Discovery Server for tool discovery and execution',
        arguments: [],
      },
    ];
  }

  /**
   * Define static resources for documentation and reference
   */
  private defineResources(): Resource[] {
    return [
      {
        uri: 'discovery://docs/usage-guide',
        name: 'MCP Discovery - Complete Usage Guide',
        description: 'Comprehensive guide on using the discovery server effectively. Read this to understand workflows, best practices, and common patterns.',
        mimeType: 'text/markdown',
      },
      {
        uri: 'discovery://docs/quick-reference',
        name: 'MCP Discovery - Quick Reference',
        description: 'Condensed cheat sheet with the 5 meta-tools, key workflows, and critical rules. Perfect for quick lookups.',
        mimeType: 'text/markdown',
      },
      {
        uri: 'discovery://docs/troubleshooting',
        name: 'MCP Discovery - Troubleshooting Guide',
        description: 'Common errors and their solutions. Read this when encountering issues with server connections or tool execution.',
        mimeType: 'text/markdown',
      },
    ];
  }

  /**
   * Define resource templates for dynamic server and tool information
   */
  private defineResourceTemplates(): ResourceTemplate[] {
    return [
      {
        uriTemplate: 'discovery://servers/{server}/info',
        name: 'Server Information',
        description: 'Get detailed information about a specific MCP server including description, tool count, connection status, and capabilities. Use this to learn about a server before using its tools.',
        mimeType: 'application/json',
      },
      {
        uriTemplate: 'discovery://servers/{server}/tools',
        name: 'Server Tools List',
        description: 'Get a complete list of all tools available from a specific MCP server. Alternative to the list_tools meta-tool.',
        mimeType: 'application/json',
      },
      {
        uriTemplate: 'discovery://servers/{server}/tools/{tool}',
        name: 'Tool Documentation',
        description: 'Get complete documentation for a specific tool including description, parameters, examples, and usage notes. Alternative to get_tool_details meta-tool.',
        mimeType: 'application/json',
      },
    ];
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    // Call tool handler
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        this.logger.info('Tool called', { tool: name, args });

        try {
          const result = await this.handleToolCall(name, args || {});
          this.logger.info('Tool executed successfully', { tool: name });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error('Tool execution failed', error as Error, {
            tool: name,
            args,
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: errorMessage,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }
    );

    // List prompts handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: this.prompts,
    }));

    // Get prompt handler
    this.server.setRequestHandler(
      GetPromptRequestSchema,
      async (request: GetPromptRequest) => {
        const { name } = request.params;

        if (name === 'mcp-discovery-usage-guide') {
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this.getUsageGuideContent(),
                },
              },
            ],
          };
        }

        throw new Error(`Unknown prompt: ${name}`);
      }
    );

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.resources,
    }));

    // List resource templates handler
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: this.resourceTemplates,
    }));

    // Read resource handler
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: ReadResourceRequest) => {
        const { uri } = request.params;

        // Static documentation resources
        switch (uri) {
          case 'discovery://docs/usage-guide':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/markdown',
                  text: this.getUsageGuideContent(),
                },
              ],
            };

          case 'discovery://docs/quick-reference':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/markdown',
                  text: this.getQuickReferenceContent(),
                },
              ],
            };

          case 'discovery://docs/troubleshooting':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/markdown',
                  text: this.getTroubleshootingContent(),
                },
              ],
            };
        }

        // Dynamic resource templates
        // Pattern: discovery://servers/{server}/info
        const serverInfoMatch = uri.match(/^discovery:\/\/servers\/([^/]+)\/info$/);
        if (serverInfoMatch) {
          const serverName = serverInfoMatch[1];
          return await this.handleServerInfoResource(uri, serverName);
        }

        // Pattern: discovery://servers/{server}/tools
        const serverToolsMatch = uri.match(/^discovery:\/\/servers\/([^/]+)\/tools$/);
        if (serverToolsMatch) {
          const serverName = serverToolsMatch[1];
          return await this.handleServerToolsResource(uri, serverName);
        }

        // Pattern: discovery://servers/{server}/tools/{tool}
        const toolDocMatch = uri.match(/^discovery:\/\/servers\/([^/]+)\/tools\/([^/]+)$/);
        if (toolDocMatch) {
          const serverName = toolDocMatch[1];
          const toolName = toolDocMatch[2];
          return await this.handleToolDocResource(uri, serverName, toolName);
        }

        throw new Error(`Unknown resource: ${uri}`);
      }
    );
  }

  /**
   * Handle tool call
   */

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

      case 'refresh_cache':
        return this.handleRefreshCache();

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Handle list_mcp_servers
   */
  private async handleListServers(): Promise<any> {
    const servers = await this.engine.listServers();
    
    if (!servers || servers.length === 0) {
      return {
        servers: [],
        message: 'No MCP servers are currently configured or connected. The discovery server is running but has no servers to discover tools from.',
        suggestion: 'Check your MCP configuration file (e.g., .kilocode/mcp.json, claude_desktop_config.json) to ensure servers are properly configured.'
      };
    }
    
    return { 
      servers,
      summary: `Found ${servers.length} server(s). ${servers.filter((s: any) => s.status === 'connected').length} connected, ${servers.filter((s: any) => s.status !== 'connected').length} disconnected.`
    };
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
      limit: args.limit !== undefined ? args.limit : 1, // Default to 1 for focused results
    });

    if (!results || results.length === 0) {
      return {
        results: [],
        message: `No tools found matching query: "${args.query}"`,
        suggestions: [
          'Try a broader search query (e.g., "file" instead of "read file content")',
          'Try different keywords or action verbs (create, read, update, delete, list, search)',
          'Use list_mcp_servers to see which servers are available',
          'Check if the server you need is connected'
        ]
      };
    }

    // Get server connection statuses
    const servers = await this.engine.listServers();
    const serverStatusMap = new Map(servers.map((s: any) => [s.name, s.status]));

    // Annotate results with connection status and execution instructions
    const includeSchema = args.includeSchema === true; // Default to false
    const annotatedResults = results.map((result: any) => {
      const isExecutable = serverStatusMap.get(result.server) === 'connected';
      const baseResult = {
        server: result.server,
        tool: result.tool,
        summary: result.summary,
        relevance: result.relevance,
        tags: result.tags,
        serverStatus: serverStatusMap.get(result.server) || 'unknown',
        executable: isExecutable,
        howToExecute: isExecutable 
          ? `Use discovery:execute_tool with server="${result.server}" and tool="${result.tool}"`
          : `Server "${result.server}" is not connected. Check list_mcp_servers for available servers.`
      };
      
      // Only include inputSchema if explicitly requested
      if (includeSchema && result.inputSchema) {
        return { ...baseResult, inputSchema: result.inputSchema };
      }
      
      return baseResult;
    });

    const executableCount = annotatedResults.filter((r: any) => r.executable).length;
    const nonExecutableCount = annotatedResults.length - executableCount;

    // Build helpful summary
    let summary = `Found ${annotatedResults.length} tool(s) matching "${args.query}"`;
    if (executableCount > 0 && nonExecutableCount > 0) {
      summary += ` (${executableCount} executable, ${nonExecutableCount} require server connection)`;
    } else if (nonExecutableCount === annotatedResults.length) {
      summary += ` - WARNING: None are from connected servers. Check list_mcp_servers for available servers.`;
    }

    return { 
      results: annotatedResults,
      summary
    };
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
    
    if (!tool) {
      return { 
        tool: null,
        error: `Tool "${args.tool}" not found on server "${args.server}". Use search_tools to find available tools.`
      };
    }

    // Add execution instruction directly in the response
    const servers = await this.engine.listServers();
    const server = servers.find((s: any) => s.name === args.server);
    const isConnected = server?.status === 'connected';
    
    return { 
      tool,
      howToExecute: isConnected
        ? `Use discovery:execute_tool with server="${args.server}" and tool="${args.tool}" and your arguments`
        : `WARNING: Server "${args.server}" is not connected. Cannot execute this tool. Check list_mcp_servers.`
    };
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

    // Default to empty object if arguments not provided (for tools with no parameters)
    const toolArguments = args.arguments !== undefined ? args.arguments : {};

    return await this.engine.executeTool(args.server, args.tool, toolArguments);
  }

  /**
   * Handle refresh_cache
   */
  private async handleRefreshCache(): Promise<any> {
    try {
      await this.engine.reload();
      const servers = await this.engine.listServers();
      const connectedCount = servers.filter((s: any) => s.status === 'connected').length;
      const totalTools = servers.reduce((sum: number, s: any) => sum + (s.toolCount || 0), 0);
      
      return {
        success: true,
        message: 'Cache refreshed successfully',
        serversConnected: connectedCount,
        totalServers: servers.length,
        totalTools,
        servers: servers.map((s: any) => ({
          name: s.name,
          status: s.status,
          toolCount: s.toolCount || 0
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Failed to refresh cache'
      };
    }
  }

  /**
   * Handle server info resource (discovery://servers/{server}/info)
   */
  private async handleServerInfoResource(uri: string, serverName: string): Promise<any> {
    const servers = await this.engine.listServers();
    const server = servers.find((s: any) => s.name === serverName);
    
    if (!server) {
      throw new Error(`Server '${serverName}' not found`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(server, null, 2),
        },
      ],
    };
  }

  /**
   * Handle server tools resource (discovery://servers/{server}/tools)
   */
  private async handleServerToolsResource(uri: string, serverName: string): Promise<any> {
    const tools = await this.engine.listTools(serverName, false);
    
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ server: serverName, tools }, null, 2),
        },
      ],
    };
  }

  /**
   * Handle tool documentation resource (discovery://servers/{server}/tools/{tool})
   */
  private async handleToolDocResource(uri: string, serverName: string, toolName: string): Promise<any> {
    const tool = await this.engine.getToolDetails(serverName, toolName);
    
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found on server '${serverName}'`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(tool, null, 2),
        },
      ],
    };
  }

  /**
   * Get comprehensive usage guide content
   */
  private getUsageGuideContent(): string {
    return `# MCP Discovery Server - Complete Usage Guide for AI Agents

## 🎯 PRIMARY PURPOSE

You are connected to an MCP Discovery Server that provides access to 100+ tools from multiple MCP servers WITHOUT loading them all into your context. This server acts as an intelligent gateway that saves 99%+ tokens by enabling on-demand tool discovery.

## 🚨 CRITICAL WORKFLOW RULES

### Rule #1: ALWAYS Use search_tools as Your Primary Discovery Method

⚠️ **CRITICAL**: \`search_tools\` is your PRIMARY tool discovery method, NOT \`list_mcp_servers\`!

**When the user asks you to do something:**
1. ✅ **FIRST**: Use \`search_tools\` with a natural language query describing what you need
   - search_tools directly maps natural language to tool capabilities across ALL servers
   - Use list_mcp_servers only for broader understanding or troubleshooting connectivity
2. ✅ **THEN**: Review the search results to find the right tool
3. ✅ **VERIFY**: Use \`list_mcp_servers\` to check if the server is "connected" (can execute tools)
4. ✅ **DETAILS**: Use \`get_tool_details\` to get full parameter information
5. ✅ **EXECUTE**: Use \`execute_tool\` - this is the ONLY way to execute tools from discovered servers

⚠️ **CRITICAL**: Discovery can find tools from configured but not running servers! Always verify server status before executing.

**Example Flow:**
\`\`\`
User: "Create a GitHub issue about the bug in README"

Step 1: search_tools({ query: "create github issue" })
  → Returns: github:create_issue, github:create_or_update_issue, etc.

Step 2: list_mcp_servers()
  → Verify github server status is "connected"

Step 3: get_tool_details({ server: "github", tool: "create_issue" })
  → Returns: Full parameter schema

Step 4: execute_tool({
    server: "github",
    tool: "create_issue",
    arguments: { repo: "owner/repo", title: "Bug in README", body: "..." }
  })
\`\`\`

### Rule #2: ALWAYS Use execute_tool as Your Execution Method

⚠️ **CRITICAL**: \`execute_tool\` is the ONLY way to execute tools from discovered servers!

**Execution Rules:**
1. ✅ **ALWAYS** use \`discovery:execute_tool\` to execute tools from discovered servers (github, filesystem, docker, etc.)
2. ❌ **NEVER** try to call other MCP servers directly using \`use_mcp_tool\` or similar
3. ✅ This discovery gateway is your intermediary for ALL tool execution
4. ✅ Split the fully qualified tool name from \`search_tools\` into server and tool parameters

**Tool Name Format (BOTH WORK):**
\`\`\`
// search_tools returns: "github:create_issue"

// Option 1: Use fully qualified name directly (easiest!)
execute_tool({
  server: "github",
  tool: "github:create_issue",  // Just copy from search results
  arguments: { ... }
})

// Option 2: Split format also works
execute_tool({
  server: "github",
  tool: "create_issue",  // Part after the colon
  arguments: { ... }
})
\`\`\`

### Rule #3: search_tools is Your Fallback for Unknown Tools

**If you don't know which tool to use:**
- ❌ DON'T guess or assume tools exist
- ❌ DON'T tell the user "I don't have access to that"
- ✅ DO search first: \`search_tools({ query: "your need" })\`

**Example:**
\`\`\`
User: "Read the package.json file"

❌ Bad: "I don't have file system access"
✅ Good: search_tools({ query: "read file" })
  → Finds: filesystem:read_file, file:read_file, etc.
\`\`\`

### Rule #4: Be Specific in Your Search Queries

**Good search queries:**
- ✅ "create github issue"
- ✅ "read file content"
- ✅ "list directory files"
- ✅ "search code repository"
- ✅ "execute shell command"

**Poor search queries:**
- ❌ "github" (too broad)
- ❌ "file" (too vague)
- ❌ "help" (not actionable)

### Rule #5: Use list_mcp_servers to Understand Available Capabilities

**When to use:**
- User asks "what can you do?"
- You want to understand available server categories
- You need to see which servers are connected
- For troubleshooting connectivity issues

⚠️ **NOTE**: Use this for broader understanding, NOT for initial tool discovery. Use \`search_tools\` first!

**Example:**
\`\`\`
list_mcp_servers()
→ Returns: github (25 tools), filesystem (15 tools), docker (30 tools), etc.
\`\`\`

### Rule #6: Use list_tools Only When You Know the Server

**When to use:**
- You want to see ALL tools from a specific server
- You're exploring capabilities of a known server
- User asks "what can the github server do?"

**Example:**
\`\`\`
list_tools({ server: "github" })
→ Returns: All 25 GitHub tools
\`\`\`

## 📋 THE 5 META-TOOLS

### 1. list_mcp_servers
**Purpose:** Get overview of available servers
**When:** User asks about capabilities, or you need server names
**Parameters:** None
**Returns:** Server list with tool counts

### 2. search_tools ⭐ PRIMARY TOOL
**Purpose:** Find tools using natural language
**When:** ALWAYS - This is your primary discovery method
**Parameters:**
  - query (required): Natural language description
  - server (optional): Filter by server name
  - limit (optional): Max results (default: 10)
**Returns:** Ranked list of matching tools with relevance scores

**Pro Tips:**
- Use action verbs: "create", "read", "update", "delete", "list", "search"
- Include the resource: "github issue", "file content", "docker container"
- Be specific but not overly technical
- Try broader searches if specific ones fail

### 3. list_tools
**Purpose:** List all tools from a specific server
**When:** You know the server name and want to see everything
**Parameters:**
  - server (required): Server name
  - includeDisabled (optional): Include disabled tools
**Returns:** Complete tool list for that server

### 4. get_tool_details
**Purpose:** Get full parameter schema for a tool
**When:** Before executing a tool (to understand parameters)
**Parameters:**
  - server (required): Server name
  - tool (required): Tool name
**Returns:** Complete tool documentation with parameter schemas

### 5. execute_tool
**Purpose:** Execute a tool from any MCP server
**When:** After you have the tool details and know the parameters
**Parameters:**
  - server (required): Server name
  - tool (required): Tool name
  - arguments (required): Tool arguments object
**Returns:** Tool execution result

## 🎓 BEST PRACTICES

### Discovery Pattern (Recommended)
\`\`\`
1. search_tools({ query: "what I need to do" })
2. Review results, pick the best match
3. list_mcp_servers() - Verify server "X" status is "connected"
4. get_tool_details({ server: "X", tool: "Y" })
5. execute_tool({ server: "X", tool: "Y", arguments: {...} })
\`\`\`

### Exploration Pattern (When Curious)
\`\`\`
1. list_mcp_servers()
2. list_tools({ server: "interesting-server" })
3. get_tool_details({ server: "X", tool: "interesting-tool" })
\`\`\`

### Error Recovery Pattern
\`\`\`
If execute_tool fails:
1. Check error message
2. If "Server 'X' is not configured":
   - Server is not running/connected
   - Use list_mcp_servers to see available servers
   - Search for alternative tools from connected servers
3. If parameter error:
   - Use get_tool_details again to verify parameters
   - Adjust arguments and retry
4. If still failing, search for alternative tools
\`\`\`

## 💡 COMMON SCENARIOS

### Scenario: User Wants File Operations
\`\`\`
search_tools({ query: "read file" })
search_tools({ query: "write file" })
search_tools({ query: "list directory" })
\`\`\`

### Scenario: User Wants GitHub Operations
\`\`\`
search_tools({ query: "create github issue" })
search_tools({ query: "list github repositories" })
search_tools({ query: "create pull request" })
\`\`\`

### Scenario: User Wants to Execute Commands
\`\`\`
search_tools({ query: "run shell command" })
search_tools({ query: "execute terminal" })
\`\`\`

### Scenario: User Asks "What Can You Do?"
\`\`\`
1. list_mcp_servers() - Show available servers
2. Explain: "I can search for specific tools using search_tools"
3. Offer: "What would you like to do? I can search for the right tool."
\`\`\`

## ⚠️ COMMON MISTAKES TO AVOID

❌ **DON'T** assume tools don't exist - search first!
❌ **DON'T** use list_tools as your primary discovery method
❌ **DON'T** execute tools without getting details first
❌ **DON'T** give up if first search fails - try different queries
❌ **DON'T** use overly broad searches like "github" or "file"

✅ **DO** use search_tools for every new task
✅ **DO** use specific, action-oriented search queries
✅ **DO** get tool details before execution
✅ **DO** try alternative search terms if needed
✅ **DO** explain to users what you're searching for

## 🎯 TOKEN EFFICIENCY

**Without Discovery Server:**
- Loading 150 tools = 100,000+ tokens per message
- Cost: $200+ per conversation thread

**With Discovery Server:**
- 5 meta-tools = 600 tokens
- On-demand loading = 1,000-2,000 tokens per task
- Savings: 99%+ token reduction

**Your Role:** Use search_tools intelligently to maintain this efficiency!

## 📝 SUMMARY

1. **Primary Tool:** \`search_tools\` - Use this for EVERYTHING
2. **Fallback:** If you don't know what tool to use, SEARCH
3. **Workflow:** Search → Details → Execute
4. **Be Specific:** Use action verbs + resource names
5. **Never Assume:** Always search before saying "I can't do that"

Remember: You have access to 100+ tools across multiple servers. The key is discovering the right tool through intelligent search, not loading everything into context!`;
  }

  /**
   * Get quick reference content
   */
  private getQuickReferenceContent(): string {
    return `# MCP Discovery Server - Quick Reference

## 🎯 The 5 Meta-Tools

### 1. list_mcp_servers
**Purpose:** See available servers and their connection status  
**Parameters:** None  
**Use:** Check which servers are connected before executing tools

### 2. search_tools ⭐ PRIMARY TOOL
**Purpose:** Find tools using natural language  
**Parameters:** query (required), server (optional), limit (optional)  
**Use:** ALWAYS use this first when looking for tools

**Good Queries:** "create github issue", "read file", "list docker containers"  
**Bad Queries:** "github", "file", "help"

### 3. list_tools
**Purpose:** List all tools from a specific server  
**Parameters:** server (required), includeDisabled (optional)  
**Use:** Only when you know the server name and want to browse

### 4. get_tool_details
**Purpose:** Get parameter schema for a tool  
**Parameters:** server (required), tool (required)  
**Use:** ALWAYS before executing to understand parameters

### 5. execute_tool
**Purpose:** Execute a tool from any connected server  
**Parameters:** server (required), tool (required), arguments (required)  
**Use:** Final step after search → verify → details

## 🔄 Standard Workflow

\`\`\`
1. search_tools({ query: "what I need" })
2. list_mcp_servers() - verify server is "connected"
3. get_tool_details({ server: "X", tool: "Y" })
4. execute_tool({ server: "X", tool: "Y", arguments: {...} })
\`\`\`

## ⚠️ Critical Rules

1. **ALWAYS** use search_tools first (PRIMARY discovery method, NOT list_mcp_servers)
2. **ALWAYS** use execute_tool to run discovered tools (NEVER call servers directly)
3. **VERIFY** server is connected before executing (use list_mcp_servers)
4. **GET** tool details before executing (use get_tool_details)
5. **NEVER** assume tools don't exist - search first!
6. **USE** exact server/tool names from search results (server: "github", tool: "create_issue")

## 🚨 Common Errors

**"Server 'X' is not configured"**  
→ Server not running. Check list_mcp_servers for connected servers.

**"Missing required parameter"**  
→ Use get_tool_details to see required parameters.

**No search results**  
→ Try broader query or different keywords.

## 💡 Quick Tips

- Use action verbs: create, read, update, delete, list, search
- Include resource names: file, issue, container, repository
- Check server status before executing
- Try alternative searches if first fails
- Explain your searches to users`;
  }

  /**
   * Get troubleshooting content
   */
  private getTroubleshootingContent(): string {
    return `# MCP Discovery Server - Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue: "Server 'X' is not configured"

**Cause:** The server you're trying to use is not running or connected.

**Solutions:**
1. Use \`list_mcp_servers()\` to see which servers are actually connected
2. Check the "status" field - only "connected" servers can execute tools
3. Search for alternative tools from connected servers
4. Verify the server is configured in the MCP config file

**Example:**
\`\`\`
// ❌ This will fail if atlassian server is not connected
execute_tool({ server: "atlassian", tool: "getUserInfo", arguments: {} })

// ✅ First check what's available
list_mcp_servers()
// → See that only "github" and "filesystem" are connected

// ✅ Search for alternatives from connected servers
search_tools({ query: "user info" })
// → Find tools from connected servers only
\`\`\`

---

### Issue: No Results from search_tools

**Cause:** Query is too specific, too broad, or no matching tools exist.

**Solutions:**
1. Try a broader query (e.g., "file" instead of "read file content")
2. Use different keywords or action verbs
3. Check \`list_mcp_servers()\` to see what's available
4. Try searching by category (e.g., "github", "docker", "file")

**Example:**
\`\`\`
// ❌ Too specific
search_tools({ query: "read package.json file from filesystem" })

// ✅ Better
search_tools({ query: "read file" })

// ✅ Alternative
search_tools({ query: "file operations" })
\`\`\`

---

### Issue: "Missing required parameter"

**Cause:** Trying to execute a tool without all required parameters.

**Solutions:**
1. Use \`get_tool_details()\` to see the parameter schema
2. Check which parameters are marked as "required: true"
3. Provide all required parameters in the arguments object

**Example:**
\`\`\`
// ❌ Missing required parameters
execute_tool({
  server: "github",
  tool: "create_issue",
  arguments: { title: "Bug" }  // Missing 'repo'!
})

// ✅ First get details
get_tool_details({ server: "github", tool: "create_issue" })
// → See that 'repo' and 'title' are required

// ✅ Provide all required parameters
execute_tool({
  server: "github",
  tool: "create_issue",
  arguments: { repo: "owner/repo", title: "Bug", body: "Description" }
})
\`\`\`

---

### Issue: Empty Response from list_mcp_servers

**Cause:** No MCP servers are configured or the discovery server hasn't initialized.

**Solutions:**
1. Check your MCP configuration file (e.g., \`.kilocode/mcp.json\`, \`claude_desktop_config.json\`)
2. Verify servers are properly configured with correct commands and arguments
3. Restart the discovery server
4. Check server logs for initialization errors

**Example Configuration:**
\`\`\`json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
\`\`\`

---

### Issue: Tool Execution Fails with Unexpected Error

**Cause:** Various - parameter type mismatch, server error, network issue, etc.

**Solutions:**
1. Check the error message carefully
2. Verify parameter types match the schema from \`get_tool_details()\`
3. Try executing the tool again (could be transient error)
4. Search for alternative tools that do the same thing
5. Check if the server is still connected via \`list_mcp_servers()\`

**Example:**
\`\`\`
// If execution fails:
1. Check error message
2. get_tool_details() - verify parameters
3. list_mcp_servers() - verify server still connected
4. Adjust and retry, or search for alternatives
\`\`\`

---

### Issue: Discovery Server Keeps Calling Same Tool Repeatedly

**Cause:** AI agent is stuck in a loop, usually due to unclear responses or errors.

**Solutions:**
1. Check if the tool is returning empty or malformed responses
2. Look for error messages in the response
3. The enhanced responses now include helpful messages and suggestions
4. If stuck, try a different approach or tool

**Prevention:**
- The server now returns informative messages when results are empty
- Suggestions are provided for next steps
- Summary fields help AI understand what happened

---

## 🎯 Best Practices for Avoiding Issues

1. **Always verify server status** before executing tools
2. **Always get tool details** before executing
3. **Use specific but not overly narrow** search queries
4. **Check error messages** - they now include helpful guidance
5. **Try alternative approaches** if first attempt fails
6. **Explain your actions** to the user for transparency

---

## 📞 Getting Help

If you encounter issues not covered here:

1. Check the **Complete Usage Guide** resource for detailed workflows
2. Check the **Quick Reference** for command syntax
3. Review tool descriptions - they include extensive guidance
4. Verify your MCP configuration is correct
5. Check server logs for detailed error information

Remember: The discovery server is designed to help you find and use tools efficiently. When in doubt, search first!`;
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
    this.logger.info('Starting MCP Discovery Server');
    
    // Initialize the discovery engine to connect to MCP servers
    await this.engine.initialize();
    this.logger.info('Discovery engine initialized');
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Server connected and ready');

    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.shutdown();
      process.exit(0);
    });
  }

  /**
   * Shutdown the server gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MCP Discovery Server');
    await this.logger.flush();
  }
}
