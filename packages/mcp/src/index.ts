#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { setupRouterFromFactory } from "@anygpt/config";
import type { ChatCompletionRequest, ChatMessage, ModelInfo } from "@anygpt/types";

type ChatCompletionToolArgs = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
};

type ListModelsToolArgs = {
  provider?: string;
};

// Load router from config file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let router: any;
let defaultProvider: string | undefined;
let defaultModel: string | undefined;

async function initializeRouter() {
  try {
    // Try to load config from standard location
    const configPath = process.env.CONFIG_PATH || './.anygpt/anygpt.config.ts';
    const absoluteConfigPath = new URL(configPath, `file://${process.cwd()}/`).href;
    const module = await import(absoluteConfigPath);
    const config = module.default;
    
    const { router: r, config: c } = await setupRouterFromFactory(config);
    router = r;
    defaultProvider = c.defaults?.provider;
    defaultModel = c.defaults?.model;
    
    console.error(`✅ Loaded config from ${configPath}`);
    console.error(`   Default provider: ${defaultProvider || 'none'}`);
    console.error(`   Default model: ${defaultModel || 'none'}`);
  } catch (error) {
    console.error(`⚠️  Failed to load config: ${error}`);
    console.error('   MCP server will not work without a valid config file');
    throw error;
  }
}

// Create MCP server instance
const server = new Server(
  {
    name: "@anygpt/mcp",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the chat completion tool - schema will be built after config loads
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const modelDefault = defaultModel ? { default: defaultModel } : {};
  const providerDefault = defaultProvider ? { default: defaultProvider } : {};
  
  return {
    tools: [
      {
        name: "chat_completion",
        description: "Send a chat completion request to AI providers via the gateway",
        inputSchema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              description: "Array of chat messages",
              items: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["system", "user", "assistant"],
                    description: "The role of the message sender"
                  },
                  content: {
                    type: "string",
                    description: "The content of the message"
                  }
                },
                required: ["role", "content"]
              }
            },
            model: {
              type: "string",
              description: `The model to use for completion${defaultModel ? ` (default: ${defaultModel})` : ''}`,
              ...modelDefault
            },
            provider: {
              type: "string",
              description: `The AI provider to use${defaultProvider ? ` (default: ${defaultProvider})` : ''}`,
              ...providerDefault
            },
            temperature: {
              type: "number",
              description: "Sampling temperature (0-2)",
              minimum: 0,
              maximum: 2
            },
            max_tokens: {
              type: "number",
              description: "Maximum number of tokens to generate",
              minimum: 1
            }
          },
          required: ["messages"]
        }
      },
      {
        name: "list_models",
        description: "List available models from AI providers",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              description: `The AI provider to list models from${defaultProvider ? ` (default: ${defaultProvider})` : ''}`,
              ...providerDefault
            }
          }
        }
      }
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "chat_completion": {
        const toolArgs = (args ?? {}) as ChatCompletionToolArgs;
        const result = await handleChatCompletion(toolArgs);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_models": {
        const toolArgs = (args ?? {}) as ListModelsToolArgs;
        const models = await handleListModels(toolArgs);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(models, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Implementation using the router and connectors
async function handleChatCompletion(args: ChatCompletionToolArgs) {
  try {
    if (!Array.isArray(args.messages) || args.messages.length === 0) {
      throw new Error("messages array is required");
    }

    const messages: ChatMessage[] = args.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const providerId = args.provider || defaultProvider || 'openai';

    const request: ChatCompletionRequest = {
      messages,
      model: args.model || defaultModel || 'gpt-3.5-turbo',
      temperature: args.temperature,
      max_tokens: args.max_tokens,
      provider: providerId,
    };

    const response = await router.chatCompletion(request);
    return response;
  } catch (error) {
    throw new Error(`Chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleListModels(args: ListModelsToolArgs): Promise<{ provider: string; models: ModelInfo[] }> {
  try {
    const providerId = args.provider || defaultProvider || 'openai';
    const models = await router.listModels(providerId);
    return {
      models,
      provider: providerId,
    };
  } catch (error) {
    throw new Error(`Failed to list models: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Start the server
async function main() {
  try {
    // Initialize router from config first
    await initializeRouter();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log to stderr (not stdout which is used for MCP communication)
    console.error("GenAI Gateway MCP server started and listening on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
