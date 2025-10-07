# @anygpt/cody

Sourcegraph Cody connector for AnyGPT with flexible API and CLI modes.

## Features

- 🚀 **Dual-mode** - API (fast) or CLI (feature-rich) with auto-fallback
- 🔄 **Multiple models** - Claude, GPT-4, Gemini, and more
- 🎯 **Enterprise ready** - Works with any Sourcegraph instance
- 🔧 **Auto-config** - Reads from `~/.config/Cody-nodejs/config.json`

## Installation

```bash
npm install @anygpt/cody
```

**Prerequisites:**
- Access to a Sourcegraph instance with API token
- **API mode** (default): No CLI installation required
- **CLI mode**: Requires `@sourcegraph/cody` CLI installed

## Quick Start

```typescript
import { createCodyConnector } from '@anygpt/cody';

// Auto-reads from ~/.config/Cody-nodejs/config.json
const connector = await createCodyConnector();

const response = await connector.chatCompletion({
  model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
  messages: [{ role: 'user', content: 'Hello, Cody!' }]
});
```

### With Configuration

```typescript
const connector = await createCodyConnector({
  connectionMode: 'api',  // 'api' | 'cli' | 'auto'
  endpoint: 'https://sourcegraph.example.com/',
  accessToken: process.env.SRC_ACCESS_TOKEN
});
```

## Connection Modes

Choose between three modes:

| Mode | Speed | Best For |
|------|-------|----------|
| **`api`** (default) | ⚡ Fast | Production, CI/CD |
| **`cli`** | 🐢 Slower | Local dev, debugging |
| **`auto`** | ⚡ Fast* | Resilient setups |

```typescript
// API mode (default)
const connector = await createCodyConnector({
  connectionMode: 'api'
});

// CLI mode (requires Cody CLI installed)
const connector = await createCodyConnector({
  connectionMode: 'cli',
  showContext: true
});

// Auto mode (tries API, falls back to CLI)
const connector = await createCodyConnector({
  connectionMode: 'auto'
});
```

📖 **[Detailed Mode Documentation](./docs/CONNECTION_MODES.md)**

## Configuration

| Option | Type | Default |
|--------|------|---------|
| `connectionMode` | `'api' \| 'cli' \| 'auto'` | `'api'` |
| `endpoint` | `string` | `'https://sourcegraph.com/'` |
| `accessToken` | `string` | Auto-detected |
| `timeout` | `number` | `60000` |
| `model` | `string` | - |

**CLI-specific** (for `cli` and `auto` modes):
- `cliPath`, `workingDirectory`, `showContext`, `debug`

💡 Auto-reads from `~/.config/Cody-nodejs/config.json`

## Models

Models are dynamically fetched from your Sourcegraph instance:

```typescript
const models = await connector.listModels();
```

Common models: Claude Sonnet 4, Claude 3.5 Sonnet, GPT-4o, GPT-5, Gemini 2.5 Pro, DeepSeek v3

## Authentication

Via environment variables:
```bash
export SRC_ACCESS_TOKEN="sgp_your-token"
export SRC_ENDPOINT="https://sourcegraph.example.com/"
```

Or in config:
```typescript
const connector = await createCodyConnector({
  accessToken: 'sgp_your-token',
  endpoint: 'https://sourcegraph.example.com/'
});
```

## Examples

See [`examples/connection-modes.ts`](./examples/connection-modes.ts) for working examples of all modes.

Config examples: [`examples/cody.config.ts`](./examples/cody.config.ts)

## Troubleshooting

**CLI mode fails:**
- Install CLI: `npm install -g @sourcegraph/cody`
- Verify: `which cody`
- Auth: `cody auth`

**API mode fails:**
- Check token: `curl -H "Authorization: token TOKEN" https://instance/.api/llm/models`
- Verify endpoint ends with `/`

**Slow responses:**
- Use API mode (fastest)
- Check network latency

📖 **[Detailed Troubleshooting](./docs/CONNECTION_MODES.md#troubleshooting)**

## Documentation

- **[Connection Modes](./docs/CONNECTION_MODES.md)** - Detailed mode comparison and configuration
- **[Architecture](./docs/ARCHITECTURE.md)** - Technical implementation details
- **[Examples](./examples/)** - Working code examples
- **[Changelog](./CHANGELOG.md)** - Version history

## License

MIT
