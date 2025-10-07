# Connection Modes

The Cody connector supports three connection modes for chat completions, allowing you to choose between speed, features, and resilience.

## Quick Comparison

| Mode | Speed | Reliability | CLI Required | Best For |
|------|-------|-------------|--------------|----------|
| **API** | ⚡ Fastest | High | ❌ No | Production, CI/CD, Serverless |
| **CLI** | 🐢 Slower | Medium | ✅ Yes | Local dev, Debugging, Context |
| **Auto** | ⚡ Fast* | Very High | ⚠️ Optional | Development with fallback |

*Auto mode is fast when API works, slower only on fallback

## API Mode (Default)

Direct HTTP calls to Sourcegraph's OpenAI-compatible API.

```typescript
const connector = await createCodyConnector({
  connectionMode: 'api',  // or omit (default)
  accessToken: process.env.SRC_ACCESS_TOKEN
});
```

### Benefits
- ✅ Fastest performance (~100ms)
- ✅ No CLI installation needed
- ✅ Works in any Node.js environment
- ✅ Better for production/CI/CD

### Use When
- Deploying to production
- Running in containers/serverless
- You don't need CLI-specific features
- Performance is critical

## CLI Mode

Spawns Cody CLI process for chat completions.

```typescript
const connector = await createCodyConnector({
  connectionMode: 'cli',
  accessToken: process.env.SRC_ACCESS_TOKEN,
  showContext: true,
  workingDirectory: process.cwd()
});
```

### Benefits
- ✅ Access to CLI-specific features
- ✅ Better context awareness (local workspace)
- ✅ Useful for debugging
- ✅ Can compare API vs CLI responses

### Use When
- Developing locally with Cody CLI installed
- You need workspace context awareness
- Debugging or comparing responses
- CLI has features not in API

### Requirements
- Cody CLI installed: `npm install -g @sourcegraph/cody`
- CLI in PATH or specify `cliPath`

## Auto Mode

Tries API first, automatically falls back to CLI on failure.

```typescript
const connector = await createCodyConnector({
  connectionMode: 'auto',
  accessToken: process.env.SRC_ACCESS_TOKEN
});
```

### Benefits
- ✅ Best of both worlds
- ✅ Resilient to API issues
- ✅ Automatic recovery
- ✅ Logs fallback for monitoring

### Use When
- Development environments
- You want reliability with fallback
- Testing both modes
- Uncertain about API availability

### How It Works
1. Attempts API call first (fast path)
2. On API failure, falls back to CLI
3. Logs warning when fallback occurs
4. Returns result from whichever succeeds

## Configuration Options

### Common (All Modes)

```typescript
{
  connectionMode: 'api' | 'cli' | 'auto',
  endpoint: 'https://sourcegraph.com/',
  accessToken: 'sgp_token',
  timeout: 60000,
  maxRetries: 3,
  model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest'
}
```

### CLI-Specific (CLI & Auto Modes)

```typescript
{
  cliPath: 'cody',              // Path to CLI executable
  workingDirectory: '/path',     // Working directory for context
  showContext: false,            // Show context items in response
  debug: false                   // Enable debug logging
}
```

## Examples

### Production Setup (API Mode)
```typescript
import { createCodyConnector } from '@anygpt/cody';

const connector = await createCodyConnector({
  connectionMode: 'api',
  endpoint: 'https://sourcegraph.example.com/',
  accessToken: process.env.SRC_ACCESS_TOKEN,
  model: 'anthropic::2024-10-22::claude-sonnet-4-latest'
});
```

### Local Development (CLI Mode)
```typescript
const connector = await createCodyConnector({
  connectionMode: 'cli',
  workingDirectory: process.cwd(),
  showContext: true
});
```

### Resilient Setup (Auto Mode)
```typescript
const connector = await createCodyConnector({
  connectionMode: 'auto',
  endpoint: 'https://sourcegraph.com/',
  accessToken: process.env.SRC_ACCESS_TOKEN,
  // CLI options used if fallback occurs
  cliPath: 'cody',
  workingDirectory: process.cwd()
});
```

## Troubleshooting

### CLI Mode Fails
- Ensure CLI is installed: `npm install -g @sourcegraph/cody`
- Verify CLI is in PATH: `which cody`
- Check authentication: `cody auth`

### API Mode Fails
- Verify access token is valid
- Check endpoint URL (should end with `/`)
- Ensure network access to Sourcegraph

### Auto Mode Always Uses CLI
- Check console for API error messages
- Verify API endpoint is accessible
- May indicate API configuration issue

## Performance Comparison

Typical latency for a simple query:

- **API Mode**: ~100-200ms
- **CLI Mode**: ~500-800ms (includes process spawn)
- **Auto Mode**: ~100-200ms (API success) or ~500-800ms (CLI fallback)

## See Also

- [Architecture Documentation](./ARCHITECTURE.md) - Technical implementation details
- [Main README](../README.md) - Quick start and basic usage
- [Examples](../examples/connection-modes.ts) - Working code examples
