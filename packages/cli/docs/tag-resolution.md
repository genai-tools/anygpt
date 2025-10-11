# Tag Resolution Guide

## Overview

AnyGPT supports **smart tag resolution** to make it easy to reference models across providers without remembering complex model IDs. Tags like `opus`, `sonnet`, `gpt5` automatically resolve to the appropriate model based on your configuration.

## Discovering Available Tags

### CLI Command

```bash
# List all available tags and their mappings
anygpt list-tags

# Filter by provider
anygpt list-tags --provider provider1
anygpt list-tags --provider cody

# JSON output
anygpt list-tags --json
```

### MCP Tool

External agents (like Kilocode, Claude Desktop, etc.) can use the `anygpt_list_tags` tool:

```json
{
  "name": "anygpt_list_tags",
  "arguments": {
    "provider": "provider1" // optional
  }
}
```

## Using Tags vs Direct Models

### Key Distinction

- **`--tag`**: Resolves tag to model name (e.g., `sonnet` → `ml-asset:static-model/claude-sonnet-4-5`)
- **`--model`**: Uses model name directly, **no resolution** (passed as-is to provider)

### In CLI

```bash
# Use a tag (resolves to default provider)
anygpt chat --tag sonnet "Hello"
anygpt chat --tag opus "Explain quantum computing"

# Use provider:tag syntax (recommended for clarity)
anygpt chat --tag openai:gemini "Hello"
anygpt chat --tag cody:opus "Hello"

# Or specify provider separately
anygpt chat --provider cody --tag sonnet "Hello"
anygpt chat --provider provider1 --tag gemini "Hello"

# Use direct model name (no resolution)
anygpt chat --model "ml-asset:static-model/claude-sonnet-4-5" "Hello"
anygpt chat --provider cody --model "anthropic::2024-10-22::claude-opus-4-latest" "Hello"
```

### In Conversations

```bash
# Start conversation with a tag
anygpt conversation start --tag sonnet --name "My Chat"

# Fork with different tag
anygpt conversation fork --tag opus --name "Opus Version"

# Or use direct model name
anygpt conversation start --model "ml-asset:static-model/gpt-5" --name "GPT5 Chat"
```

### In MCP

When calling `anygpt_chat_completion`, you can use tags:

```json
{
  "name": "anygpt_chat_completion",
  "arguments": {
    "model": "sonnet",
    "messages": [...]
  }
}
```

Or specify the provider:

```json
{
  "name": "anygpt_chat_completion",
  "arguments": {
    "model": "sonnet",
    "provider": "cody",
    "messages": [...]
  }
}
```

## How Tag Resolution Works

1. **Check aliases**: First checks if the model name is a configured alias
2. **Search tags**: Searches all provider models for matching tags
3. **Provider preference**: If a provider is specified, it's checked first
4. **Default provider**: Falls back to the default provider if configured
5. **Direct model**: If no tag matches, treats it as a direct model ID

## Configuration Example

```typescript
// anygpt.config.ts
export default config({
  defaults: {
    provider: 'provider1',
    providers: {
      provider1: { model: 'sonnet' },
      cody: { model: 'sonnet' },
    },
  },
  providers: {
    provider1: {
      name: 'Custom Gateway',
      connector: openai({ baseURL: '...' }),
      models: {
        'ml-asset:static-model/claude-sonnet-4-5': {
          tags: ['claude', 'sonnet', 'sonnet4.5', 'claude-sonnet']
        },
        'ml-asset:static-model/gpt-5': {
          tags: ['gpt', 'gpt5']
        }
      }
    },
    cody: {
      name: 'Sourcegraph Cody',
      connector: cody({ ... }),
      models: {
        'anthropic::2024-10-22::claude-sonnet-4-latest': {
          tags: ['claude', 'sonnet', 'sonnet4', 'claude-sonnet']
        },
        'anthropic::2024-10-22::claude-opus-4-latest': {
          tags: ['opus', 'claude-opus', 'opus4']
        }
      }
    }
  }
});
```

## Best Practices

1. **Use descriptive tags**: Tags like `sonnet`, `opus`, `gpt5` are more memorable than full model IDs
2. **Multiple tags per model**: Add multiple tags for flexibility (e.g., `['claude', 'sonnet', 'claude-sonnet']`)
3. **Provider-specific tags**: When using the same tag across providers, specify the provider explicitly
4. **Check available tags**: Run `anygpt list-tags` to see what's available before using
5. **Use in MCP tools**: External agents should call `anygpt_list_tags` first to discover available models

## Troubleshooting

### Tag not found

If you get an error like "Model 'opus' not found":

1. Run `anygpt list-tags` to see available tags
2. Check if the tag exists in your configuration
3. Verify the provider is configured correctly
4. Try specifying the provider explicitly: `--provider cody --model opus`

### Ambiguous tags

If a tag exists in multiple providers:

- Without `--provider`: Uses the default provider
- With `--provider`: Uses the specified provider
- Use `provider:tag` syntax: `cody:sonnet` or `provider1:sonnet`

### External agents can't find models

External agents (like Kilocode) should:

1. Call `anygpt_list_tags` first to discover available models
2. Use the returned tag/model information to make informed choices
3. Specify both `model` and `provider` in `anygpt_chat_completion` for clarity

## Related Commands

- `anygpt list-tags` - List all available tags and mappings
- `anygpt list-models` - List models from a provider's API
- `anygpt list-providers` - List configured providers (MCP only)
- `anygpt config` - Show full configuration
