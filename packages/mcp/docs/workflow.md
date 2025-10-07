# Discovery Workflow

Follow this workflow to use AnyGPT effectively:

## Quick Start (Smart Resolution)

The easiest way - just specify the model name:

```json
{
  "model": "opus",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

The server automatically detects that "opus" is Claude Opus on Anthropic!

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

### Step 2: List Models

Call `anygpt_list_models` with a provider to see available models:

```json
{
  "provider": "openai",
  "models": [
    { "id": "gpt-4", "created": 1687882411, "owned_by": "openai" },
    { "id": "gpt-3.5-turbo", "created": 1677610602, "owned_by": "openai" }
  ]
}
```

### Step 3: Chat

Call `anygpt_chat_completion` with your chosen provider and model:

```json
{
  "provider": "openai",
  "model": "gpt-4",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

## Smart Model Resolution

AnyGPT supports intelligent model resolution, just like the CLI:

- **Shorthand names**: `opus`, `sonnet`, `haiku` → Auto-detects Anthropic
- **Common names**: `gpt-4`, `gpt-3.5-turbo` → Auto-detects OpenAI
- **Full names**: `claude-opus-4-20250514` → Works as expected
- **Explicit provider**: Specify both `provider` and `model` for full control

## Tips

- **Quick tasks**: Just use model shorthand (e.g., `"model": "opus"`)
- **Explicit control**: Specify both provider and model
- **Discovery**: Use `anygpt_list_providers` and `anygpt_list_models` to explore
- **Defaults**: If you don't specify anything, configured defaults are used
