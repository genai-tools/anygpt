# Verbose Flag Refactoring

## Summary

Refactored the CLI logging system to use a single `--verbose` flag with optional levels instead of separate `--verbose` and `--debug` flags.

## Motivation

Having multiple flags (`--verbose`, `--debug`) for controlling output verbosity is not a best practice. It creates confusion and redundancy. A single flag with levels is cleaner and more intuitive.

## Implementation

### Before

```bash
anygpt chat "hello" --verbose  # Shows info messages
anygpt chat "hello" --debug    # Shows debug messages
```

### After

```bash
anygpt chat "hello"              # Quiet mode (only errors/warnings)
anygpt chat "hello" -v           # Info mode (shows metrics, emojis)
anygpt chat "hello" --verbose    # Info mode (same as -v)
anygpt chat "hello" -v debug     # Debug mode (shows everything)
anygpt chat "hello" --verbose debug  # Debug mode (same as -v debug)
```

## Log Levels

1. **Quiet** (default): Only errors and warnings
2. **Info** (`-v` or `--verbose`): Shows user-friendly metrics

   - 📤 Request info (provider, model)
   - 💬 Message length
   - ⏱️ Response time
   - 📊 Token usage
   - 🤖 Model used
   - 📝 Response length

3. **Debug** (`-v debug` or `--verbose debug`): Shows everything
   - All info messages above
   - `[DEBUG]` prefixed technical logs
   - Request objects
   - Error details
   - Model data structures
   - API error analysis

## Environment Variables

You can also set the log level via environment variables:

```bash
VERBOSE=true anygpt chat "hello"   # Info mode
VERBOSE=debug anygpt chat "hello"  # Debug mode
```

## Changes Made

### Files Modified

1. **`packages/cli/src/utils/cli-context.ts`**

   - Added `LogLevel` type: `'quiet' | 'info' | 'debug'`
   - Refactored `ConsoleLogger` to use a single log level
   - Implemented `getLogLevel()` to parse from env vars and CLI args
   - `debug()` only shows when level is `'debug'`
   - `info()` shows when level is `'info'` or `'debug'`

2. **`packages/cli/src/index.ts`**

   - Removed `--debug` flag
   - Changed `--verbose` to `--verbose [level]` with optional value
   - Updated help text

3. **`packages/cli/src/commands/chat.ts`**
   - Updated verbose check to use `process.argv.some()`

## Benefits

✅ **Single flag** - No confusion about which flag to use  
✅ **Intuitive** - Matches user's suggestion (`--verbose=debug`)  
✅ **Flexible** - Supports both short (`-v`) and long (`--verbose`) forms  
✅ **Environment support** - Can be set via `VERBOSE` env var  
✅ **Backward compatible** - `-v` still works as before  
✅ **Extensible** - Easy to add more levels in the future (e.g., `trace`)
