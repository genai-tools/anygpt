import type { Tool } from '@anygpt/ai-provider';
import type { ToolDetails } from './types.js';

/**
 * Convert MCP tool details to AI provider tool format
 */
export function convertMCPToolToAITool(
  toolDetails: ToolDetails,
  serverName: string
): Tool {
  return {
    type: 'function',
    function: {
      name: `${serverName}__${toolDetails.name}`,
      description: toolDetails.description || `Execute ${toolDetails.name} from ${serverName}`,
      parameters: toolDetails.inputSchema || {
        type: 'object',
        properties: {},
      },
    },
  };
}

/**
 * Parse AI tool call name to extract server and tool
 */
export function parseToolCallName(toolCallName: string): {
  server: string;
  tool: string;
} | null {
  const parts = toolCallName.split('__');
  if (parts.length !== 2) {
    return null;
  }
  return {
    server: parts[0],
    tool: parts[1],
  };
}
