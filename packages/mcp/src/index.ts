#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GenAIRouter } from "@anygpt/router";
import { OpenAIConnectorFactory } from "@anygpt/openai";
import type { ChatCompletionRequest } from "@anygpt/types";

// Initialize the router with OpenAI connector
const router = new GenAIRouter();
router.registerConnector(new OpenAIConnectorFactory());

// Create OpenAI connector instance
const connector = router.createConnector('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  timeout: parseInt(process.env.TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
});

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

// Define the chat completion tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
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
              description: "The model to use for completion (use list_models tool to see available options)",
              default: "gpt-3.5-turbo"
            },
            provider: {
              type: "string",
              description: "The AI provider to use",
              enum: ["openai", "mock"],
              default: "openai"
            },
            temperature: {
              type: "number",
              description: "Sampling temperature",
              minimum: 0,
              maximum: 2,
              default: 1
            },
            max_tokens: {
              type: "number",
              description: "Maximum number of tokens to generate",
              minimum: 1,
              default: 1000
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
              description: "The AI provider to list models from",
              enum: ["openai", "mock"],
              default: "openai"
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
        // TODO: Implement gateway client call
        const result = await handleChatCompletion(args);
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
        // TODO: Implement gateway client call
        const models = await handleListModels(args);
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
async function handleChatCompletion(args: { messages: Array<{ role: string; content: string }>; model?: string; provider?: string; temperature?: number; max_tokens?: number }) {
  try {
    const request: ChatCompletionRequest = {
      messages: args.messages,
      model: args.model || process.env.DEFAULT_MODEL || 'gpt-3.5-turbo',
      temperature: args.temperature,
      max_tokens: args.max_tokens,
    };

    const response = await connector.chatCompletion(request);
    return response;
  } catch (error) {
    throw new Error(`Chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleListModels() {
  try {
    const models = await connector.listModels();
    return {
      models,
      provider: 'openai',
    };
  } catch (error) {
    throw new Error(`Failed to list models: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Start the server
async function main() {
  try {
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
