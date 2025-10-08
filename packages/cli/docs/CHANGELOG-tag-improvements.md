# Tag Resolution Improvements

## Summary

Improved tag-to-model resolution with better discoverability, clearer semantics, and enhanced error handling.

## Changes

### 1. Improved Tag Listing (`anygpt list-tags`)

**Problem**: With multiple providers, tags were shown multiple times, making it hard to track what resolves to what.

**Solution**: Show each unique tag once with all provider mappings:

```
🏷️  Tags (showing unique tags with provider mappings):
  • sonnet          → [2 providers]
      - Company AI Gateway: ml-asset:static-model/claude-sonnet-4-5
      - Sourcegraph Cody: anthropic::2024-10-22::claude-sonnet-4-latest
  • opus            → Sourcegraph Cody: anthropic::2024-10-22::claude-opus-4-latest
```

**Benefits**:

- Each tag shown only once (alphabetically sorted)
- Clear indication of which providers support each tag
- Easy to see when tags resolve to different models across providers

### 2. Separate `--tag` and `--model` Options

**Problem**:

- `--model` was ambiguous (resolution vs direct model name)
- Model names can contain `:` (e.g., `anthropic::2024-10-22::claude-opus-4-latest`)
- `provider:tag` syntax was broken and confusing

**Solution**: Explicit separation of concerns:

```bash
# Tag resolution (searches configured tags)
anygpt chat --tag sonnet "Hello"
anygpt chat --provider cody --tag gemini "Hello"

# Direct model name (no resolution, passed as-is)
anygpt chat --model "ml-asset:static-model/claude-sonnet-4-5" "Hello"
anygpt chat --model "anthropic::2024-10-22::claude-opus-4-latest" "Hello"
```

**Benefits**:

- **Explicit intent**: `--tag` for resolution, `--model` for direct names
- **No ambiguity**: Model names with `:` work correctly
- **Validation**: Error if both `--tag` and `--model` are specified
- **Clearer for AI agents**: External tools know exactly what to use

### 3. Enhanced Error Messages

**Problem**: 422 errors gave no context about what went wrong.

**Solution**: Helpful error messages with troubleshooting steps:

```
Error: Model 'nonexistent-model' not found or not supported by provider 'booking'.

Troubleshooting:
  1. Run 'anygpt list-tags --provider booking' to see available tags
  2. Run 'anygpt list-models --provider booking' to see available models
  3. Use --tag instead of --model if you want tag resolution

Original error: Chat completion failed for provider booking: booking chat completion failed: 422 status code (no body)
```

**Also handles**:

- 401/403 errors → Authentication guidance
- Tag not found → Suggests running `anygpt list-tags`
- Missing model/tag → Clear instructions on what to provide

## Migration Guide

### For Users

**Before**:

```bash
anygpt chat --model sonnet "Hello"  # Ambiguous: tag or model name?
anygpt chat --model cody:sonnet "Hello"  # Broken with : in model names
```

**After**:

```bash
# For tag resolution
anygpt chat --tag sonnet "Hello"
anygpt chat --provider cody --tag sonnet "Hello"

# For direct model names
anygpt chat --model "ml-asset:static-model/claude-sonnet-4-5" "Hello"
```

### For External Agents (MCP)

**Recommended workflow**:

1. Call `anygpt_list_tags` to discover available tags and models
2. Use tags in `anygpt_chat_completion` with explicit provider when needed
3. Better error messages help debug issues faster

## Files Changed

- `packages/cli/src/commands/chat.ts` - Added `--tag` option, improved error handling
- `packages/cli/src/commands/list-tags.ts` - Improved output format (unique tags)
- `packages/cli/src/index.ts` - Updated command registration
- `docs/tag-resolution.md` - Updated documentation
- `README.md` - Updated examples

## Testing

```bash
# Build
cd packages/cli && npx tsdown

# Test tag listing
npx anygpt list-tags

# Test tag resolution
npx anygpt chat --tag sonnet "test"

# Test direct model
npx anygpt chat --model "ml-asset:static-model/gpt-5" "test"

# Test error handling
npx anygpt chat --model "nonexistent" "test"  # Should show helpful error
npx anygpt chat --tag sonnet --model "x" "test"  # Should reject both options
```

## Benefits

1. **Discoverability**: `anygpt list-tags` shows clear tag-to-model mappings
2. **Clarity**: Explicit `--tag` vs `--model` removes ambiguity
3. **Robustness**: Model names with `:` work correctly
4. **Better UX**: Helpful error messages guide users to solutions
5. **AI-friendly**: External agents can easily discover and use tags
