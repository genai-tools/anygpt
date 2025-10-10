# MCP Self-Documentation Feature

## Problem

The MCP server required users to already know:
- What providers are configured
- What models each provider supports
- What provider and model names to use in requests
- How to effectively use the tools together

This violated the principle of self-documenting APIs and made it difficult for AI agents to discover and use the server effectively.

## Solution

Made the MCP server fully self-documenting through three MCP primitives:

1. **Tools** - The actual functions to call
2. **Resources** - Documentation that AI agents can read
3. **Prompts** - Pre-built templates for common workflows

### New Tool: `anygpt_list_providers`

**Purpose**: Discover all configured AI providers and their types

**Parameters**: None

**Note**: All tools are prefixed with `anygpt_` to prevent namespace collisions when multiple MCP servers are loaded.

**Returns**:
```json
{
  "providers": [
    {
      "id": "openai",
      "type": "openai", 
      "isDefault": true
    },
    {
      "id": "anthropic",
      "type": "anthropic",
      "isDefault": false
    }
  ],
  "default_provider": "openai"
}
```

## Discovery Workflow

Users can now follow this natural workflow:

1. **Call `anygpt_list_providers`** → Discover what providers are configured
2. **Call `anygpt_list_models(provider)`** → See available models for a provider
3. **Call `anygpt_chat_completion(provider, model, ...)`** → Use the AI

## Implementation Details

### Changes Made

1. **`packages/mcp/src/index.ts`**:
   - Added `ProviderInfo` type
   - Added `configuredProviders` variable to store provider configs
   - Added `handleListProviders()` function
   - Added `anygpt_list_providers` tool to the tool list
   - Added case handler for `anygpt_list_providers` in request handler
   - Prefixed all tools with `anygpt_` to prevent namespace collisions
   - Enhanced startup logging to show configured providers
   - **Added Resources capability**:
     - `anygpt://docs/overview` - Server introduction
     - `anygpt://docs/workflow` - Step-by-step guide
     - `anygpt://docs/providers` - Dynamic provider list
     - `anygpt://examples/basic-chat` - Complete example
   - **Added Prompts capability**:
     - `discover-and-chat` - Full workflow template
     - `compare-providers` - Multi-provider comparison
     - `list-capabilities` - Show all available options

2. **`packages/mcp/README.md`**:
   - Documented the new `list_providers` tool
   - Added "Discovery Workflow" section
   - Reordered tools to show discovery flow (providers → models → chat)
   - Updated examples to show the self-documenting workflow
   - Documented Resources and Prompts capabilities

### Technical Notes

- The router already had `getAvailableProviders()` method, but it returns connector types, not configured provider IDs
- We extract provider information directly from the loaded config (`c.providers`)
- The tool is synchronous (no API calls needed) since it reads from config
- Provider information includes:
  - `id`: The provider identifier used in other tools
  - `type`: The connector type (e.g., "openai", "anthropic")
  - `isDefault`: Boolean flag for the default provider

## Benefits

1. **Fully Self-Documenting**: AI agents can discover and learn everything about the server
   - Tools expose what actions are available
   - Resources provide readable documentation
   - Prompts show how to accomplish common tasks
2. **AI-Friendly**: Designed specifically for agentic AI consumption
   - Resources are in markdown/JSON formats AI can parse
   - Prompts provide step-by-step instructions
   - Dynamic content reflects current configuration
3. **User-Friendly**: Clear workflow from discovery to usage
4. **Flexible**: Works with any provider configuration
5. **No Breaking Changes**: Existing tools work exactly as before
6. **Better UX**: No need to read external docs or guess provider names

## Example Usage

```typescript
// Step 1: What's available?
const { providers, default_provider } = await anygpt_list_providers();
console.log(`Default: ${default_provider}`);
console.log(`Available: ${providers.map(p => p.id).join(', ')}`);

// Step 2: What models does the default provider have?
const { models } = await anygpt_list_models({ provider: default_provider });
console.log(`Models: ${models.map(m => m.id).join(', ')}`);

// Step 3: Use it
const response = await anygpt_chat_completion({
  provider: default_provider,
  model: models[0].id,
  messages: [{ role: "user", content: "Hello!" }]
});
```

## How AI Agents Use This

When an AI agent connects to the AnyGPT MCP server, it can:

1. **List Resources** - See available documentation
2. **Read Resources** - Learn about the server, workflows, and examples
3. **List Prompts** - Discover pre-built workflows
4. **Use Prompts** - Get step-by-step instructions for common tasks
5. **Call Tools** - Execute the actual operations

This creates a complete self-learning system where AI agents can understand and use the server without any external documentation.

## Example: AI Agent Discovery Flow

```
AI Agent: "I need to chat with an AI model"
  ↓
1. Lists resources → Finds "anygpt://docs/overview"
2. Reads overview → Learns about the three tools
3. Reads workflow → Understands the discovery pattern
4. Lists prompts → Finds "discover-and-chat"
5. Gets prompt → Receives step-by-step instructions
6. Executes:
   - anygpt_list_providers()
   - anygpt_list_models(provider)
   - anygpt_chat_completion(provider, model, messages)
```

## Future Enhancements

Consider adding:
- Provider metadata (description, capabilities, rate limits)
- Model filtering/search in `list_models`
- Caching of model lists to reduce API calls
- Provider health/status checks
- More prompts for advanced use cases (streaming, function calling, etc.)
- Interactive tutorials as resources
