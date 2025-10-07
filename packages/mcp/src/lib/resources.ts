/**
 * MCP Resources - Documentation that AI agents can read
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { 
  ListResourceTemplatesResult,
  ListResourcesResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";

// Get the directory for loading docs
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// When built, this file is at dist/lib/resources.js, docs are at dist/docs
const docsDir = join(__dirname, '../docs');

/**
 * Helper to read documentation files
 */
function readDoc(filename: string): string {
  try {
    return readFileSync(join(docsDir, filename), 'utf-8');
  } catch (error) {
    console.error(`Failed to read doc file ${filename}:`, error);
    return `# Error\n\nFailed to load documentation: ${filename}`;
  }
}

/**
 * List resource templates (for AI agents to understand patterns)
 */
export function listResourceTemplates(): ListResourceTemplatesResult {
  return {
    resourceTemplates: [
      {
        uriTemplate: "anygpt://docs/{section}",
        name: "Documentation",
        description: "Access documentation sections. Type one of: overview, workflow, providers",
        mimeType: "text/markdown",
      },
      {
        uriTemplate: "anygpt://examples/{example}",
        name: "Usage Examples", 
        description: "Access usage examples. Type: basic-chat",
        mimeType: "text/markdown",
      },
    ],
  };
}

/**
 * List all available resources (concrete URIs for direct access)
 */
export function listResources(): ListResourcesResult {
  return {
    resources: [
      {
        uri: "anygpt://docs/overview",
        name: "AnyGPT Overview",
        description: "Introduction to AnyGPT MCP server and its capabilities",
        mimeType: "text/markdown",
      },
      {
        uri: "anygpt://docs/workflow",
        name: "Discovery Workflow",
        description: "Step-by-step guide on how to discover and use providers",
        mimeType: "text/markdown",
      },
      {
        uri: "anygpt://docs/providers",
        name: "Configured Providers",
        description: "List of currently configured AI providers and their details",
        mimeType: "application/json",
      },
      {
        uri: "anygpt://examples/basic-chat",
        name: "Basic Chat Example",
        description: "Simple example of using the chat completion tool",
        mimeType: "text/markdown",
      },
    ],
  };
}

/**
 * Read a specific resource using template matching
 */
export function readResource(
  uri: string,
  context: {
    configuredProviders: Record<string, { type: string }>;
    defaultProvider?: string;
    defaultModel?: string;
  }
): ReadResourceResult {
  // Match docs template: anygpt://docs/{section}
  const docsMatch = uri.match(/^anygpt:\/\/docs\/(.+)$/);
  if (docsMatch) {
    const section = docsMatch[1];
    return readDocSection(section, context);
  }

  // Match examples template: anygpt://examples/{example}
  const examplesMatch = uri.match(/^anygpt:\/\/examples\/(.+)$/);
  if (examplesMatch) {
    const example = examplesMatch[1];
    return readExample(example);
  }

  throw new Error(`Unknown resource: ${uri}`);
}

/**
 * Read a documentation section
 */
function readDocSection(
  section: string,
  context: {
    configuredProviders: Record<string, { type: string }>;
    defaultProvider?: string;
    defaultModel?: string;
  }
) {
  const uri = `anygpt://docs/${section}`;

  switch (section) {
    case "overview":
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: readDoc('overview.md'),
          },
        ],
      };

    case "workflow":
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: readDoc('workflow.md'),
          },
        ],
      };

    case "providers":
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                configured_providers: Object.entries(context.configuredProviders).map(([id, config]) => ({
                  id,
                  type: config.type,
                  isDefault: id === context.defaultProvider,
                })),
                default_provider: context.defaultProvider,
                default_model: context.defaultModel,
              },
              null,
              2
            ),
          },
        ],
      };

    default:
      throw new Error(`Unknown documentation section: ${section}. Available: overview, workflow, providers`);
  }
}

/**
 * Read an example
 */
function readExample(example: string) {
  const uri = `anygpt://examples/${example}`;

  switch (example) {
    case "basic-chat":
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: readDoc('basic-chat-example.md'),
          },
        ],
      };

    default:
      throw new Error(`Unknown example: ${example}. Available: basic-chat`);
  }
}
