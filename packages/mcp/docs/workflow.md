# Discovery Workflow

Follow this workflow to use AnyGPT effectively:

## Quick Start (Using Tags)

The easiest way - use tags to reference models:

```json
{
  "model": "opus",
  "messages": [{ "role": "user", "content": "Hello!" }]
}
```

The server automatically resolves "opus" to the actual model ID!

**Recommended**: First call `anygpt_list_tags` to discover available tags and their mappings.

## Explicit Workflow (Full Control)

### Step 1: Discover Providers

Call `anygpt_list_providers` to see what AI providers are configured:

```json
{
  "providers": [
    { "id": "openai", "type": "openai", "isDefault": true },
    { "id": "anthropic", "type": "anthropic", "isDefault": false }
  ],
  "default_provider": "openai"
}
```

### Step 2: Discover Tags (Recommended)

Call `anygpt_list_tags` to see available tags and their model mappings:

```json
{
  "tags": [
    {
      "tag": "opus",
      "provider": "cody",
      "model": "anthropic::2024-10-22::claude-opus-4-latest"
    },
    {
      "tag": "sonnet",
      "provider": "booking",
      "model": "ml-asset:static-model/claude-sonnet-4-5"
    },
    {
      "tag": "gemini",
      "provider": "cody",
      "model": "google::v1::gemini-2.5-pro"
    }
  ],
  "providers": [
    { "id": "booking", "name": "Company AI Gateway", "isDefault": true },
    { "id": "cody", "name": "Sourcegraph Cody", "isDefault": false }
  ]
}
```

**Or** call `anygpt_list_models` to see models directly from the provider API:

```json
{
  "provider": "booking",
  "models": [
    { "id": "ml-asset:static-model/gpt-5", "provider": "booking" },
    { "id": "ml-asset:static-model/claude-sonnet-4-5", "provider": "booking" }
  ]
}
```

### Step 3: Chat

Call `anygpt_chat_completion` with your chosen model:

**Using tags (recommended):**

```json
{
  "model": "gemini",
  "provider": "cody",
  "messages": [{ "role": "user", "content": "Hello!" }]
}
```

**Using direct model IDs:**

```json
{
  "model": "ml-asset:static-model/claude-sonnet-4-5",
  "provider": "booking",
  "messages": [{ "role": "user", "content": "Hello!" }]
}
```

## Tag Resolution

AnyGPT supports intelligent tag-to-model resolution:

- **Tags**: `opus`, `sonnet`, `gemini`, `gpt5` → Resolved to actual model IDs
- **Direct model IDs**: Full model names work as-is (no resolution)
- **Provider preference**: Specify `provider` to disambiguate when a tag exists in multiple providers
- **Auto-detection**: If provider is omitted, uses default provider or searches all providers

## Best Practices for MCP Clients

1. **Discovery first**: Call `anygpt_list_tags` to see available tags and models
2. **Use tags**: Easier to remember and use than full model IDs (e.g., `"opus"` vs `"anthropic::2024-10-22::claude-opus-4-latest"`)
3. **Specify provider**: When a tag exists in multiple providers, specify which one to use
4. **Handle errors**: 422 errors mean the model/tag wasn't found - call `anygpt_list_tags` to see what's available

## Tips

- **Quick tasks**: Use tags (e.g., `"model": "opus"`)
- **Explicit control**: Specify both `provider` and `model`
- **Discovery**: Use `anygpt_list_tags` to see all available tags
- **Direct models**: Use `anygpt_list_models` to see models from provider APIs
- **Defaults**: If you don't specify anything, configured defaults are used
