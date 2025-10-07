#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { setupRouterFromFactory, type FactoryProviderConfig, type ModelAlias } from "@anygpt/config";
import {
  listTools,
  handleChatCompletion,
  handleListModels,
  handleListProviders,
  type ChatCompletionToolArgs,
  type ListModelsToolArgs,
} from "./lib/tools.js";
import { listResources, listResourceTemplates, readResource } from "./lib/resources.js";
import { listPrompts, getPrompt } from "./lib/prompts.js";
import { logger } from "./lib/logger.js";

// Application state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let router: any;
let defaultProvider: string | undefined;
let defaultModel: string | undefined;
let configuredProviders: Record<string, FactoryProviderConfig> = {};
let aliases: Record<string, ModelAlias[]> | undefined;

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
    configuredProviders = c.providers || {};
    aliases = c.defaults?.aliases;
    
    const providersList = Object.keys(configuredProviders).join(', ') || 'none';
    const aliasesList = aliases ? Object.keys(aliases).join(', ') : 'none';
    
    logger.info('Initialized successfully');
    logger.info(`Config: ${configPath}`);
    logger.info(`Providers: ${providersList}`);
    logger.info(`Default: ${defaultProvider || 'none'}/${defaultModel || 'none'}`);
    if (aliases) {
      logger.info(`Aliases: ${aliasesList}`);
    }
  } catch (error) {
    logger.error('Failed to load config', error instanceof Error ? error : undefined);
    logger.error('Server cannot start without valid config');
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
      resources: {},
      resourceTemplates: {},
      prompts: {},
      sampling: {},
    },
  }
);

// Tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return listTools({ defaultModel, defaultProvider });
});

// Tool calls handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const context = {
      router,
      defaultProvider,
      defaultModel,
      configuredProviders,
      aliases,
    };

    let result;
    switch (name) {
      case "anygpt_chat_completion":
        result = await handleChatCompletion((args ?? {}) as ChatCompletionToolArgs, context);
        break;
      case "anygpt_list_models":
        result = await handleListModels((args ?? {}) as ListModelsToolArgs, context);
        break;
      case "anygpt_list_providers":
        result = handleListProviders(context);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
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

// Resources handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return listResources();
});

// Resource templates handler
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return listResourceTemplates();
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return readResource(request.params.uri, {
    configuredProviders,
    defaultProvider,
    defaultModel,
  });
});

// Prompts handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return listPrompts();
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  return getPrompt(request.params.name, request.params.arguments || {});
});

// Start the server
async function main() {
  try {
    // Initialize router from config first
    await initializeRouter();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info('Server started and listening on stdio');
  } catch (error) {
    logger.error('Failed to start server', error instanceof Error ? error : undefined);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await server.close();
  process.exit(0);
});

main().catch((error) => {
  logger.error('Fatal error', error instanceof Error ? error : undefined);
  process.exit(1);
});
