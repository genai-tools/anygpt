import { ChatLoop } from '../chat-loop/index.js';
import { AIProvider } from '@anygpt/ai-provider';
import { MCPDiscoveryClient } from '../mcp-client/index.js';
import { parseToolCallName } from '../mcp-client/tool-converter.js';
import type { CLIContext } from '../utils/cli-context.js';
import type { Message } from '../chat-loop/types.js';
import type { Tool } from '@anygpt/ai-provider';

interface ChatAgenticOptions {
  model?: string;
  provider?: string;
  maxIterations?: number;
}

/**
 * Start an agentic chat session with MCP tool discovery and execution
 */
export async function chatAgenticCommand(
  context: CLIContext,
  message: string | undefined,
  options: ChatAgenticOptions
) {
  const chatLoop = new ChatLoop();
  const mcpClient = new MCPDiscoveryClient();

  // Determine provider and model
  let providerId = options.provider || context.defaults.provider || 'openai';
  let modelId: string;

  if (options.model) {
    modelId = options.model;
  } else {
    const defaultTag = context.defaults.providers?.[providerId]?.tag;
    const defaultModel = context.defaults.providers?.[providerId]?.model || context.defaults.model;

    if (defaultTag && context.tagRegistry) {
      const resolution = context.tagRegistry.resolve(defaultTag, providerId || undefined);
      if (resolution) {
        providerId = resolution.provider;
        modelId = resolution.model;
        context.logger.info(`🔗 Resolved tag '${defaultTag}' → ${modelId}`);
      } else {
        throw new Error(`Could not resolve tag '${defaultTag}' for provider '${providerId}'`);
      }
    } else if (defaultModel) {
      modelId = defaultModel;
    } else {
      throw new Error('No model specified. Use --model or configure a default model/tag.');
    }
  }

  console.log('🤖 Agentic AI Chat with MCP Tools');
  console.log(`Provider: ${providerId}`);
  console.log(`Model: ${modelId}`);
  console.log('Connecting to MCP Discovery...\n');

  // Connect to MCP
  try {
    await mcpClient.connect();
    console.log('✅ Connected to MCP Discovery Server');
    
    // List available servers
    const servers = await mcpClient.listServers();
    console.log(`📦 Found ${servers.length} MCP server(s)`);
    servers.forEach(s => {
      const statusIcon = s.status === 'connected' ? '✓' : s.status === 'error' ? '✗' : '○';
      console.log(`   ${statusIcon} ${s.name} (${s.toolCount} tools)`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Failed to connect to MCP:', error);
    console.log('Starting without MCP tools...\n');
  }

  console.log('Type /help for commands, /exit to quit.\n');

  // Create AI provider
  const aiProvider = new AIProvider(context.router, {
    provider: providerId,
    model: modelId,
  });

  const maxIterations = options.maxIterations || 10;

  // One-shot mode: process single message and exit
  if (message) {
    const oneShotResult = await processMessage(message, mcpClient, aiProvider, maxIterations, context);
    console.log('\n' + oneShotResult);
    
    // Cleanup
    if (mcpClient.isConnected()) {
      await mcpClient.disconnect();
    }
    return;
  }

  // Interactive mode
  await chatLoop.start({
    prompt: '💬 ',
    maxHistory: 50,
    onMessage: async (userMessage: string) => {
      return await processMessage(userMessage, mcpClient, aiProvider, maxIterations, context, chatLoop);
    },
  });

  // Cleanup
  if (mcpClient.isConnected()) {
    await mcpClient.disconnect();
  }

  console.log('\n👋 Chat ended. Goodbye!');
}

/**
 * Process a message with agentic tool discovery and execution
 */
async function processMessage(
  message: string,
  mcpClient: MCPDiscoveryClient,
  aiProvider: AIProvider,
  maxIterations: number,
  context: CLIContext,
  chatLoop?: ChatLoop
): Promise<string> {
  try {
    // Get conversation history (or start fresh for one-shot)
    const history = chatLoop ? chatLoop.getHistory() : [];
    const messages: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
      toolCallId?: string;
      tool_calls?: any[];
    }> = history.map((msg: Message) => ({
      role: msg.role as 'system' | 'user' | 'assistant' | 'tool',
      content: msg.content,
      ...(msg.toolCallId && { toolCallId: msg.toolCallId }),
      ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
    }));

    // Add system message for MCP Discovery if connected
    if (mcpClient.isConnected() && messages.length === 0) {
      messages.push({
        role: 'system',
        content: `You have access to MCP Discovery tools that let you find and execute tools on-demand:
- Use mcp_discovery__search_tools to find relevant tools for the user's request
- Use mcp_discovery__get_tool_details to learn how to use a tool
- Use mcp_discovery__execute_tool to run the tool with appropriate arguments

Always search for tools first before saying you can't do something.`,
      });
    }

    // For one-shot mode, add the user message
    if (!chatLoop) {
      messages.push({
        role: 'user',
        content: message,
      });
    }

    // Provide MCP Discovery meta-tools to AI for on-demand tool discovery
    const tools: Tool[] = [];
    if (mcpClient.isConnected()) {
      console.log('🔧 Providing MCP Discovery tools to AI for on-demand discovery\n');
      
      // Add the 4 discovery meta-tools
      tools.push(
        {
          type: 'function',
          function: {
            name: 'mcp_discovery__list_servers',
            description: 'List all available MCP servers and their tool counts',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'mcp_discovery__search_tools',
            description: 'Search for tools across all MCP servers using semantic search. Returns array of {server, tool, summary, relevance}. Use this first to find relevant tools.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to find relevant tools',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 10)',
                },
              },
              required: ['query'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'mcp_discovery__get_tool_details',
            description: 'Get detailed information about a specific tool. Use the server and tool values from search results.',
            parameters: {
              type: 'object',
              properties: {
                server: {
                  type: 'string',
                  description: 'Server name from search results (e.g., "atlassian")',
                },
                tool: {
                  type: 'string',
                  description: 'Tool name from search results (e.g., "atlassian:atlassianUserInfo")',
                },
              },
              required: ['server', 'tool'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'mcp_discovery__execute_tool',
            description: 'Execute a tool. Use the exact server and tool values from search results or tool details.',
            parameters: {
              type: 'object',
              properties: {
                server: {
                  type: 'string',
                  description: 'Server name (e.g., "atlassian")',
                },
                tool: {
                  type: 'string',
                  description: 'Tool name (e.g., "atlassian:atlassianUserInfo")',
                },
                arguments: {
                  type: 'object',
                  description: 'Tool arguments as JSON object (empty {} if no args needed)',
                },
              },
              required: ['server', 'tool'],
            },
          },
        }
      );
    }

    // Create tool executor for MCP tools
    const toolExecutor = async (call: { id: string; name: string; arguments: Record<string, unknown> }) => {
      try {
        // Handle MCP Discovery meta-tools
        if (call.name === 'mcp_discovery__list_servers') {
          const servers = await mcpClient.listServers();
          return JSON.stringify(servers, null, 2);
        } else if (call.name === 'mcp_discovery__search_tools') {
          const results = await mcpClient.searchTools(call.arguments.query as string, call.arguments.limit as number | undefined);
          return JSON.stringify(results, null, 2);
        } else if (call.name === 'mcp_discovery__get_tool_details') {
          const details = await mcpClient.getToolDetails(call.arguments.server as string, call.arguments.tool as string);
          return JSON.stringify(details, null, 2);
        } else if (call.name === 'mcp_discovery__execute_tool') {
          const result = await mcpClient.executeTool({
            server: call.arguments.server as string,
            tool: call.arguments.tool as string,
            arguments: (call.arguments.arguments as Record<string, unknown>) || {},
          });
          return result.content.map(c => c.text || JSON.stringify(c)).join('\n');
        }
        
        throw new Error(`Unknown tool: ${call.name}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `Error: ${errorMsg}`;
      }
    };
    
    // Call AI with tool executor - show progress while working
    process.stderr.write('\n💭 Working on it');
    const progressInterval = setInterval(() => {
      process.stderr.write('.');
    }, 500);
    
    const chatRequest = { 
      messages,
      ...(tools.length > 0 && { tools, tool_executor: toolExecutor }),
    };
    
    try {
      const aiResponse = await aiProvider.chat(chatRequest);
      clearInterval(progressInterval);
      process.stderr.write(' ✨\n\n');
      
      // Log token usage
      context.logger.info(
        `📊 Tokens: ${aiResponse.usage.promptTokens} input + ${aiResponse.usage.completionTokens} output = ${aiResponse.usage.totalTokens} total`
      );

      return aiResponse.message;
    } finally {
      clearInterval(progressInterval);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    context.logger.error(`AI Error: ${errorMsg}`);
    return `❌ Error: ${errorMsg}`;
  }
}
