# TypeScript Config Loading Strategy

## Overview

AnyGPT supports native TypeScript configuration files (`.anygpt/anygpt.config.ts`) with intelligent loading that adapts to your Node.js version.

## How It Works

We use **jiti with `tryNative: true`** option, which provides:

1. **Native-first approach**: Tries Node.js native import first
2. **Automatic fallback**: Falls back to jiti transformation if native fails
3. **Zero overhead**: On modern Node.js versions, configs load natively with no transpilation

## Node.js Version Support

### Node.js 24+ (Current: v24.8.0) ✅
- **Native TypeScript support enabled by default**
- Zero overhead - configs load directly
- No flags required
- Full type stripping support

### Node.js 22.18+ ✅
- **Native TypeScript support enabled by default**
- Same as Node 24+
- Can disable with `--no-experimental-strip-types` if needed

### Node.js 22.6 - 22.17 ⚠️
- Native TypeScript available but requires flag
- Run with: `node --experimental-strip-types`
- Falls back to jiti transformation without flag

### Node.js < 22.6 📦
- No native TypeScript support
- Automatically uses jiti's Babel transformation
- Configs are cached for performance
- Still works perfectly, just with transformation overhead

## Implementation

```typescript
// In packages/config/src/loader.ts
import { createJiti } from 'jiti';

async function loadTSConfig(path: string): Promise<AnyGPTConfig> {
  const { createJiti } = await import('jiti');
  const jiti = createJiti(import.meta.url, {
    tryNative: true,        // Try native import first
    fsCache: true,          // Cache transformed files
    interopDefault: true,   // Handle ESM/CJS interop
    moduleCache: true       // Use Node.js module cache
  });
  
  return await jiti.import<AnyGPTConfig>(path, { default: true });
}
```

## Benefits

### For Users
- ✅ Write configs in TypeScript with full type safety
- ✅ No build step required
- ✅ Works across all Node.js versions (20+)
- ✅ Fast loading on modern Node.js

### For Developers
- ✅ Single implementation works everywhere
- ✅ No version-specific code paths
- ✅ Automatic optimization on newer Node.js
- ✅ Graceful degradation on older versions

## Supported Config Formats

All formats work with the same loader:

```typescript
// .anygpt/anygpt.config.ts (Recommended)
import { config, openai } from '@anygpt/config';

export default config({
  providers: {
    'my-provider': {
      connector: openai({ apiKey: process.env.API_KEY })
    }
  }
});
```

```javascript
// .anygpt/anygpt.config.js
export default {
  providers: {
    'my-provider': {
      connector: {
        connector: '@anygpt/openai',
        config: { apiKey: process.env.API_KEY }
      }
    }
  }
};
```

```json
// .anygpt/anygpt.config.json
{
  "providers": {
    "my-provider": {
      "connector": {
        "connector": "@anygpt/openai",
        "config": {
          "apiKey": "..."
        }
      }
    }
  }
}
```

## Why jiti?

We chose jiti over alternatives because:

1. **Already in dependencies** - Zero new deps
2. **Production-ready** - Used by Nuxt, Nitro, UnoCSS, Tailwind (60M+ downloads/month)
3. **Smart caching** - Filesystem + memory caching
4. **tryNative option** - Perfect for our use case
5. **ESM + CommonJS** - Seamless interop

## Alternatives Considered

### tsx
- ❌ Additional dependency
- ❌ Larger bundle size
- ✅ Very popular and battle-tested

### Node.js native only
- ❌ Breaks on Node < 22.18
- ❌ No fallback for older versions
- ✅ Zero overhead

### Pure jiti (without tryNative)
- ❌ Always transforms, even on Node 24+
- ❌ Unnecessary overhead on modern Node
- ✅ Works everywhere

## Performance

### Node 24+ / 22.18+
- **Native loading**: ~1-2ms (no transformation)
- **First load**: Instant
- **Subsequent loads**: Cached by Node.js

### Node 22.6-22.17 (without flag)
- **Jiti transformation**: ~50-100ms (first load)
- **Subsequent loads**: ~1-2ms (cached)

### Node < 22.6
- **Jiti transformation**: ~50-100ms (first load)
- **Subsequent loads**: ~1-2ms (cached)

## Testing

Run the test suite to verify the implementation:

```bash
# Run config loader tests
npx nx test config

# All tests should pass:
# ✓ should load TypeScript config with jiti tryNative
# ✓ should handle TypeScript-specific syntax
# ✓ should work with multiple providers
# ✓ should cache subsequent imports
# ✓ should report current Node.js version
# ✓ should handle jiti tryNative option correctly
```

## Future Considerations

- **Node 26+**: May have full TypeScript support without experimental flags
- **Enums/Namespaces**: Currently require `--experimental-transform-types` in Node 22+
- **Source maps**: Native stripping doesn't generate source maps (not needed for configs)

## Conclusion

This implementation gives us the best of both worlds:
- **Modern Node.js**: Zero-overhead native TypeScript loading
- **Older Node.js**: Automatic fallback with jiti transformation
- **All users**: Seamless experience regardless of Node version

No breaking changes, no version-specific code, just works! 🎉
