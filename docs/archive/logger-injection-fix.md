# Logger Injection Fix

## Problem Statement

**Issue:** Every connector was creating its own `NoOpLogger` instance instead of using the process-wide logger.

**Root Cause:** When connectors were instantiated via `setupRouterFromFactory()`, the logger was NOT being passed to them.

## The Fix

### Changes Made

#### 1. **packages/config/src/setup.ts**
- Added `logger?: Logger` parameter to `setupRouterFromFactory()`
- Inject logger into each connector before registering with router:

```typescript
export async function setupRouterFromFactory(
  factoryConfig: FactoryConfig,
  logger?: Logger  // ← NEW PARAMETER
): Promise<{ router: GenAIRouter; config: FactoryConfig }> {
  // ...
  
  for (const [providerId, providerConfig] of Object.entries(factoryConfig.providers)) {
    const connector = providerConfig.connector;
    
    // Inject logger into connector if provided
    if (logger && connector) {
      Object.defineProperty(connector, 'logger', {
        value: logger,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
    
    // ... register connector
  }
}
```

#### 2. **packages/cli/src/utils/cli-context.ts**
- Pass `consoleLogger` to `setupRouterFromFactory()`
- **Removed** the hacky post-setup logger injection code (18 lines deleted!)

```typescript
// BEFORE: Manual injection after setup
const { router, config } = await setupRouterFromFactory(loadedConfig);
// ... 18 lines of Object.defineProperty hackery ...

// AFTER: Clean injection at setup time
const { router, config } = await setupRouterFromFactory(loadedConfig, consoleLogger);
```

#### 3. **packages/mcp/src/index.ts**
- Pass MCP `logger` to `setupRouterFromFactory()`

```typescript
// Pass the MCP logger to setup so it gets injected into all connectors
const { router: r, config: c } = await setupRouterFromFactory(config, logger);
```

## Architecture

### Before (❌ Broken)

```
User creates connector: openai({ baseURL: '...' })
  ↓
Connector constructor: this.logger = config.logger || new NoOpLogger()
  ↓ (no logger in config)
Creates NoOpLogger ❌
  ↓
CLI tries to inject logger later with Object.defineProperty hack
MCP has no way to inject logger at all ❌
```

### After (✅ Fixed)

```
Process creates ONE logger:
  - CLI: ConsoleLogger
  - MCP: stderr logger

  ↓
setupRouterFromFactory(config, logger)
  ↓
Injects logger into all connectors
  ↓
All connectors use the same process-wide logger ✅
```

## Key Principles

1. **One logger per process** - Not one per connector
2. **Inject at setup time** - Not after the fact
3. **Clean API** - Logger is an explicit parameter
4. **No hacks** - No more `Object.defineProperty` workarounds in CLI

## Testing

To verify the fix works:

1. **CLI with verbose mode:**
   ```bash
   anygpt chat --verbose "test message"
   ```
   Should see connector loading messages

2. **MCP server:**
   ```bash
   MCP_LOG_LEVEL=debug node packages/mcp/dist/index.js
   ```
   Should see debug logs on stderr

3. **Check connector logs:**
   - Connectors should log using the injected logger
   - No more silent NoOpLogger instances

## Files Changed

- ✅ `packages/config/src/setup.ts` - Added logger parameter
- ✅ `packages/cli/src/utils/cli-context.ts` - Removed hack, pass logger
- ✅ `packages/mcp/src/index.ts` - Pass logger to setup

## Benefits

1. **Simpler code** - Removed 18 lines of hacky injection code
2. **Consistent behavior** - CLI and MCP both work the same way
3. **Explicit dependencies** - Logger is a clear parameter
4. **Easier testing** - Can inject test loggers easily
5. **Better debugging** - All logs go through the same logger
