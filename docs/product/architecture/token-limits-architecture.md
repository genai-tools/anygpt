# Token Limits Architecture

## Overview

This document describes the architecture and design decisions for the token limits feature, which provides API compatibility across different LLM providers that use different parameter names for token limits.

## Problem Statement

Different LLM API providers use different parameter names for specifying maximum response tokens:

- **OpenAI (modern)**: `max_completion_tokens` - The current standard for OpenAI's API
- **Anthropic/Cody**: `max_tokens` - Used by Anthropic's Claude API and Sourcegraph Cody
- **Legacy OpenAI**: `max_tokens` - Older OpenAI API versions

Without proper handling, this inconsistency causes:
1. **Truncated responses**: When the wrong parameter is used, APIs may default to very low token limits (e.g., 100 tokens)
2. **API errors**: Some APIs reject requests with the wrong parameter name
3. **Configuration complexity**: Users need to know which parameter each provider expects

## Solution: `useLegacyMaxTokens` Capability Flag

### Design Principles

1. **Single source of truth**: Users configure `max_tokens` once in their config
2. **Automatic translation**: The system translates to the correct API parameter based on provider
3. **Explicit control**: Providers can explicitly declare which parameter style they use
4. **Backward compatible**: Defaults to modern OpenAI style (`max_completion_tokens`)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Config                          │
│  modelRules: [                                              │
│    { pattern: [/.*/], max_tokens: 4096,                     │
│      useLegacyMaxTokens: true/false }                       │
│  ]                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Model Pattern Resolver                         │
│  - Matches patterns to models                               │
│  - Resolves max_tokens and useLegacyMaxTokens              │
│  - Returns ResolvedModelConfig                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLI / MCP / Router                       │
│  - Passes both max_tokens and useLegacyMaxTokens           │
│  - No translation logic here                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenAI Connector                           │
│  if (useLegacyMaxTokens) {                                  │
│    request.max_tokens = max_tokens                          │
│  } else {                                                    │
│    request.max_completion_tokens = max_tokens               │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      LLM API                                │
│  Receives correctly formatted parameter                     │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. Config Package (`@anygpt/config`)

**Files**: `factory.ts`, `model-pattern-resolver.ts`

**Responsibilities**:
- Define `BaseModelConfig` interface with `max_tokens` and `useLegacyMaxTokens`
- Resolve model rules to determine which capability flag to use
- Pass resolved configuration to consumers

**Key Types**:
```typescript
interface BaseModelConfig {
  max_tokens?: number;
  useLegacyMaxTokens?: boolean; // true = max_tokens, false = max_completion_tokens
}
```

#### 2. Types Package (`@anygpt/types`)

**Files**: `chat.ts`

**Responsibilities**:
- Define `ChatCompletionRequest` with capability flag
- Document the flag's purpose and usage

**Key Types**:
```typescript
interface ChatCompletionRequest {
  max_tokens?: number;
  useLegacyMaxTokens?: boolean; // Internal flag, not sent to API
}
```

#### 3. Router Package (`@anygpt/router`)

**Files**: `lib/router.ts`, `types/base.ts`

**Responsibilities**:
- Pass through `max_tokens` and `useLegacyMaxTokens` from request to connector
- No translation logic (connectors handle it)

**Key Code**:
```typescript
const baseRequest: BaseRequest = {
  max_tokens: request.max_tokens,
  useLegacyMaxTokens: request.useLegacyMaxTokens,
  // ... other fields
};
```

#### 4. OpenAI Connector (`@anygpt/openai`)

**Files**: `src/index.ts`

**Responsibilities**:
- Translate `max_tokens` to correct API parameter based on `useLegacyMaxTokens`
- Send correctly formatted request to OpenAI-compatible APIs

**Key Code**:
```typescript
...(validatedRequest.max_tokens !== undefined && {
  [validatedRequest.useLegacyMaxTokens ? 'max_tokens' : 'max_completion_tokens']:
    validatedRequest.max_tokens,
})
```

#### 5. Cody Connector (`@anygpt/cody`)

**Files**: `src/index.ts`

**Responsibilities**:
- Pass through request to OpenAI connector (which handles translation)
- Preserve `useLegacyMaxTokens` flag

**Note**: Cody delegates to OpenAI connector, so no additional logic needed.

### Configuration Examples

#### OpenAI Provider (Modern API)

```typescript
providers: {
  openai: {
    connector: openai({ apiKey: process.env.OPENAI_API_KEY }),
    modelRules: [
      {
        pattern: [/.*/],
        max_tokens: 4096,
        useLegacyMaxTokens: false, // Uses max_completion_tokens
      },
    ],
  },
}
```

#### Cody Provider (Anthropic API)

```typescript
providers: {
  cody: {
    connector: cody(),
    modelRules: [
      {
        pattern: [/.*/],
        max_tokens: 4096,
        useLegacyMaxTokens: true, // Uses max_tokens
      },
    ],
  },
}
```

## Implementation Details

### Priority System

The model pattern resolver follows this priority order:

1. **Model metadata** (highest priority) - Explicit configuration for specific models
2. **Provider rules** - Provider-specific patterns
3. **Global rules** (lowest priority) - Workspace-wide defaults

Properties use **first-match-wins**, except for tags which are **accumulated**.

### Default Behavior

- **Default value**: `useLegacyMaxTokens: false` (uses `max_completion_tokens`)
- **Rationale**: OpenAI's modern API is the standard, and most new APIs follow this pattern

### CLI Integration

The CLI respects the `--max-tokens` flag and passes it through with the resolved capability:

```bash
npx anygpt chat --tag sonnet --max-tokens 2000 "Your prompt"
```

The CLI:
1. Resolves the model config (including `useLegacyMaxTokens`)
2. Passes both `max_tokens` and `useLegacyMaxTokens` to the router
3. Router passes to connector
4. Connector translates to correct API parameter

## Testing Strategy

### Unit Tests

- Model pattern resolver correctly applies `useLegacyMaxTokens` from rules
- OpenAI connector translates to correct parameter name

### Integration Tests

- CLI with Cody provider uses `max_tokens`
- CLI with OpenAI provider uses `max_completion_tokens`
- Responses are not truncated (full token limit is respected)

### Manual Testing

```bash
# Test Cody (should use max_tokens)
npx anygpt chat --tag sonnet "Write 3 detailed bullet points about TypeScript"

# Test OpenAI (should use max_completion_tokens)
npx anygpt chat --provider openai --model gpt-4 "Write 3 detailed bullet points about TypeScript"
```

## Caching Issue Resolution

### Problem

During development, we encountered an issue where Nx was caching build outputs even when source files changed. This caused the updated code to not be used, leading to confusing behavior.

### Root Cause

The `nx-tsdown` plugin's build target only included project-local source files in its inputs:

```typescript
inputs: [
  `{projectRoot}/src/**/*.ts`,
  `{projectRoot}/tsconfig.lib.json`,
  // Missing: dependency source files!
]
```

When we changed `router/src/types/base.ts`, packages depending on `router` (like `cli`, `config`) didn't know their cache was invalid.

### Solution

**1. Added `^production` to inputs** - Includes all dependency source files:

```typescript
inputs: [
  `{projectRoot}/src/**/*.ts`,
  `{projectRoot}/tsconfig.lib.json`,
  `{projectRoot}/tsdown.config.ts`,
  `{projectRoot}/package.json`,
  `^production`, // ← This invalidates cache when dependencies change
  { externalDependencies: ['tsdown'] },
]
```

**2. Improved outputs specification** - Better cache granularity:

```typescript
outputs: [
  `{projectRoot}/dist`,           // All build artifacts
  `{projectRoot}/dist/**/*.js`,   // JavaScript files
  `{projectRoot}/dist/**/*.d.ts`, // TypeScript declarations
  `{projectRoot}/dist/**/*.map`,  // Source maps
]
```

**File**: `tools/nx-tsdown/src/plugin.ts`

**Benefits**:
- More precise cache invalidation
- Better tracking of what files are actually produced
- Nx can detect partial build failures more accurately

### Verification

After the fix, changing source files in any package correctly invalidates the cache for all dependent packages.

## Future Considerations

### Additional API Styles

If new API parameter styles emerge, we can:

1. Add new capability flags (e.g., `tokenLimitStyle: 'openai' | 'anthropic' | 'google'`)
2. Extend the connector translation logic
3. Maintain backward compatibility with `useLegacyMaxTokens`

### Provider-Specific Defaults

Consider adding provider-level defaults:

```typescript
providers: {
  cody: {
    connector: cody(),
    defaults: {
      useLegacyMaxTokens: true, // Apply to all models in this provider
    },
  },
}
```

### MCP Integration

The MCP server should respect the same capability flags when calling models, ensuring consistency across CLI and MCP interfaces.

## Related Documentation

- [Model Rules Guide](../packages/config/docs/MODEL_RULES.md) - User-facing documentation
- [Configuration Guide](./configuration.md) - General configuration overview
- [Anthropic Thinking Support](./anthropic-thinking-support.md) - Related feature using `extra_body`

## Changelog

- **2025-01-10**: Initial implementation of `useLegacyMaxTokens` capability
- **2025-01-10**: Fixed Nx caching issue in `nx-tsdown` plugin
