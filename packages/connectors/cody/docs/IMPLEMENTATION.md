# Cody Connector Implementation

## Overview

The Cody connector is a CLI-based connector that integrates Sourcegraph's Cody AI assistant into the AnyGPT ecosystem. Unlike traditional API-based connectors, it spawns the `cody` CLI as a child process and parses its output.

## Architecture

### Design Decision: CLI vs API

The connector uses the CLI approach rather than direct API calls for several reasons:

1. **Existing Authentication**: Leverages `cody auth` - no need to manage API keys separately
2. **Enterprise Support**: Works seamlessly with enterprise Sourcegraph instances
3. **Context Awareness**: Can utilize local file context through CLI features
4. **Simplicity**: If Cody CLI is already configured, it just works

### Implementation Details

#### Process Flow

```
User Request → CodyConnector → spawn('cody', ['chat', ...]) → Pipeline → Parse Output → Response
```

1. **Request Processing** (`chatCompletion` method):
   - Validates and normalizes the request
   - Converts chat messages to a single prompt string
   - Combines system messages and conversation history

2. **CLI Execution** (`executeCodyChat` method):
   - Spawns `cody chat` with appropriate flags (via `buildCodyArgs`)
   - Sets environment variables for authentication
   - Uses Node.js stream pipeline for efficient processing
   - Implements timeout handling with Promise.race

3. **Stream Pipeline**:
   - **cleanTransform**: Transform stream that cleans output chunks in real-time
   - **collectTransform**: Collects cleaned chunks for final response
   - Uses `pipeline()` from `node:stream/promises` for proper backpressure handling
   - Memory efficient - processes data as it arrives

4. **Output Cleaning** (`cleanCodyOutput` method):
   - Removes loading indicators (spinner characters)
   - Strips "Logging in" messages
   - Removes Noxide loader messages
   - Trims whitespace
   - Applied per-chunk for streaming efficiency

5. **Response Formatting**:
   - Wraps CLI output in standard chat completion format
   - Estimates token usage (4 chars ≈ 1 token)
   - Generates unique response IDs

#### Message Conversion

The `messagesToPrompt` method converts OpenAI-style messages to a single prompt:

- System messages are prepended
- User/assistant messages are formatted clearly
- Previous assistant responses are labeled for context

## Key Components

### CodyConnector Class

Implements the `IConnector` interface with:
- `chatCompletion()`: Main chat method
- `response()`: Response API support (converts to chat completion)
- `listModels()`: Dynamically fetches models from Cody CLI (`cody models list`)
- `validateRequest()`: Basic parameter validation
- `isInitialized()`: Always returns true (CLI-based)

### Configuration Options

```typescript
interface CodyConnectorConfig {
  cliPath?: string;              // Path to cody CLI
  endpoint?: string;             // Sourcegraph endpoint
  accessToken?: string;          // Authentication token
  workingDirectory?: string;     // Context directory
  model?: string;                // Default model
  showContext?: boolean;         // Show context items
  debug?: boolean;               // Debug logging
  timeout?: number;              // Request timeout
  maxRetries?: number;           // Retry count
}
```

## Trade-offs

### Advantages ✅

- **No API key management**: Uses existing CLI authentication
- **Works with existing Cody CLI setup**: Zero additional configuration
- **Enterprise instance support**: Works with custom Sourcegraph instances
- **Local context awareness**: Can leverage project context
- **Familiar interface**: Standard chat completion API
- **Memory efficient**: Stream pipeline processes data incrementally
- **Proper backpressure**: Pipeline handles flow control automatically
- **Scalable architecture**: Ready for streaming when CLI supports it

### Limitations ⚠️

- **No streaming support yet**: CLI doesn't provide true streaming (but architecture is ready)
- **Process spawning overhead**: ~100-200ms per request
- **Limited function calling**: Depends on CLI capabilities
- **Each request spawns a new process**: Could be optimized with process pooling

## Testing

The connector includes:
- `test-example.mjs`: Basic functionality test
- `example.ts`: Comprehensive usage examples
- Manual testing with actual Cody CLI

### Test Coverage

- ✅ Model listing
- ✅ Simple chat completion
- ✅ Multi-turn conversations
- ✅ Response API
- ✅ Error handling
- ✅ Output cleaning

## Architecture Improvements

### Pipeline Approach (Implemented ✅)

The connector now uses Node.js stream pipelines inspired by the [codygen](https://github.com/theplenkov-npm/codygen) project:

**Benefits:**
- ✅ Memory efficient - processes chunks as they arrive
- ✅ Proper backpressure handling
- ✅ Ready for streaming when CLI supports it
- ✅ Cleaner separation of concerns
- ✅ Better error handling with pipeline

**Implementation:**
```typescript
await pipeline(
  codyProcess.stdout,
  cleanTransform,      // Clean output in real-time
  collectTransform     // Collect cleaned chunks
);
```

### Future Enhancements

Potential improvements:
1. **Process Pooling**: Reuse processes for better performance
2. **True Streaming Support**: When Cody CLI adds streaming, we're ready
3. **Better Model Detection**: Query actual available models from instance
4. **Context File Support**: Direct `--context-file` flag support
5. **Repository Context**: Enterprise `--context-repo` support
6. **Line-by-line Processing**: Split output by lines for even better streaming

## Integration

### With Router

```typescript
import { Router } from '@anygpt/router';
import { CodyConnectorFactory } from '@anygpt/cody';

const router = new Router();
router.registerConnector(new CodyConnectorFactory());
```

### Standalone

```typescript
import { cody } from '@anygpt/cody';

const connector = cody({
  workingDirectory: process.cwd()
});

const response = await connector.chatCompletion({
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Dependencies

- `@anygpt/types`: Type definitions
- Node.js built-in modules: `child_process`
- External: `@sourcegraph/cody` CLI (must be installed separately)

## Files Structure

```
packages/connectors/cody/
├── src/
│   └── index.ts              # Main connector implementation
├── dist/                     # Built files (generated)
├── package.json              # Package metadata
├── tsconfig.json             # TypeScript config
├── tsconfig.lib.json         # Library build config
├── tsconfig.spec.json        # Test config
├── tsdown.config.ts          # Build tool config
├── eslint.config.mjs         # Linting config
├── example.ts                # Usage examples
├── test-example.mjs          # Quick test
├── README.md                 # User documentation
├── CHANGELOG.md              # Version history
└── IMPLEMENTATION.md         # This file
```

## Maintenance Notes

- Keep model list updated with common Sourcegraph models
- Monitor Cody CLI changes for new features/breaking changes
- Update output cleaning regex if CLI output format changes
- Consider performance optimizations if usage scales
