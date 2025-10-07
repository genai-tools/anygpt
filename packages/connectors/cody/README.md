# @anygpt/cody

Cody API connector for AnyGPT - enables using Sourcegraph's Cody AI assistant through direct API integration.

## Features

- 🚀 **OpenAI-compatible API** - Built on proven OpenAI connector architecture
- 🔄 **Multiple models** - Claude, GPT-4, Gemini, and more
- 🎯 **Enterprise ready** - Works with any Sourcegraph instance
- 🔧 **Automatic configuration** - Reads from existing Cody config files
- 📝 **Full compatibility** - Supports both new loader and legacy connector
- 🛡️ **Proper authentication** - Handles all required Sourcegraph headers

## Installation

```bash
npm install @anygpt/cody
```

**Prerequisites:**
- Access to a Sourcegraph instance with API token
- No CLI installation required (uses direct API calls)

## Usage

### Recommended: New Loader Approach

```typescript
import { createCodyConnector } from '@anygpt/cody';

// Automatically reads from ~/.config/Cody-nodejs/config.json
const connector = await createCodyConnector();

const response = await connector.chatCompletion({
  model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
  messages: [{ role: 'user', content: 'Hello, Cody!' }]
});

console.log(response.choices[0].message.content);
```

### With Custom Configuration

```typescript
import { createCodyConnector } from '@anygpt/cody';

const connector = await createCodyConnector({
  endpoint: 'https://sourcegraph.example.com/',
  accessToken: 'sgp_your-access-token'
});
```

### Legacy Compatibility

```typescript
import { CodyConnector } from '@anygpt/cody';

// Still works, but uses new OpenAI-based implementation internally
const connector = new CodyConnector({
  endpoint: 'https://sourcegraph.example.com/',
  accessToken: 'sgp_your-access-token'
});
```

### Using with AnyGPT Router

```typescript
import { Router } from '@anygpt/router';
import { CodyConnectorFactory } from '@anygpt/cody';

const router = new Router();
router.registerConnector(new CodyConnectorFactory());

const response = await router.chatCompletion({
  provider: 'cody',
  model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
  messages: [
    { role: 'user', content: 'Explain TypeScript generics' }
  ]
});
```

### Configuration File Example

```typescript
// anygpt.config.ts
import { cody } from '@anygpt/cody';

export default {
  providers: {
    cody: cody({
      endpoint: 'https://sourcegraph.example.com/',
      accessToken: process.env.SRC_ACCESS_TOKEN,
      model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest'
    })
  }
};
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | `'https://sourcegraph.com/'` | Sourcegraph instance URL |
| `accessToken` | `string` | - | Access token (auto-read from config or `SRC_ACCESS_TOKEN` env var) |
| `timeout` | `number` | `60000` | Request timeout in milliseconds |
| `maxRetries` | `number` | `3` | Maximum number of retries |

**Note:** The new loader automatically reads configuration from `~/.config/Cody-nodejs/config.json`, so manual configuration is often unnecessary.

## Supported Models

The connector **dynamically fetches available models** from your Sourcegraph instance via API. Model availability depends on your instance configuration.

```typescript
// List models available on your instance
const models = await connector.listModels();
models.forEach(model => {
  console.log(`${model.id} - ${model.display_name}`);
});
```

### Example Model IDs

- `anthropic::2024-10-22::claude-sonnet-4-latest`
- `anthropic::2024-10-22::claude-3-5-sonnet-latest`
- `openai::2024-02-01::gpt-5`
- `openai::2024-02-01::gpt-4o`
- `google::v1::gemini-2.5-pro`
- `fireworks::v1::deepseek-v3`

## Authentication

The connector uses direct API authentication with proper headers:

1. **Using Environment Variables:**
   ```bash
   export SRC_ACCESS_TOKEN="sgp_your-token"
   export SRC_ENDPOINT="https://sourcegraph.example.com/"
   ```

2. **Using Configuration:**
   ```typescript
   const connector = cody({
     accessToken: 'sgp_your-token',
     endpoint: 'https://sourcegraph.example.com/'
   });
   ```

## API Integration

This connector makes direct HTTP calls to Sourcegraph's API endpoints with proper authentication headers:

- **Endpoint:** `https://your-instance/.api/llm/models`
- **Headers:**
  - `Authorization: token <your-token>`
  - `X-Requested-With: cody 5.5.21`
  - `X-Sourcegraph-API-Client-Name: cody`
  - `X-Sourcegraph-API-Client-Version: 5.5.21`

This approach is more reliable than CLI-based integration and works with enterprise Sourcegraph instances that have strict header validation.

## How It Works

This connector directly calls Sourcegraph APIs instead of spawning CLI processes:

- ✅ **More reliable** - No CLI process spawning
- ✅ **Better performance** - Direct HTTP calls
- ✅ **Enterprise ready** - Proper header validation
- ✅ **No CLI dependency** - Works in any Node.js environment
- ✅ **Better error handling** - Direct API error responses

## Error Handling

The connector provides detailed error messages for common issues:

- Missing access token
- Authentication failures
- Network timeouts
- Invalid API responses
- Unsupported model requests

## Examples

See the `examples/` directory for more usage examples:
- `example.ts`: Basic usage
- `test-example.mjs`: Simple test script
- `test-with-auth.mjs`: Authentication example
- `test-models-api.mjs`: Direct API model listing test

## Migration from CLI-based approach

If you were previously using a CLI-based Cody connector:

1. **Remove CLI dependency** - No need to install `@sourcegraph/cody` CLI
2. **Update model IDs** - Use format `provider::version::model-name`
3. **Set authentication** - Provide `accessToken` and `endpoint` in configuration
4. **Better reliability** - Enjoy improved performance and error handling

## Troubleshooting

### Header Validation Errors

If you get "Precondition Required" or "Missing required header" errors:

1. Ensure your Sourcegraph instance allows the required headers
2. Contact your IT team if using enterprise Sourcegraph
3. The connector automatically sets all required headers for standard instances

### Authentication Issues

1. Verify your access token is valid: `curl -H "Authorization: token YOUR_TOKEN" https://your-instance/.api/llm/models`
2. Check endpoint URL format (should end with `/`)
3. Ensure token has appropriate permissions
