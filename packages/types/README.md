# @anygpt/types

Pure type definitions for the AnyGPT ecosystem with **zero runtime dependencies**.

## Purpose

This package contains ONLY TypeScript type definitions and interfaces. It has no runtime dependencies and produces virtually no JavaScript output (0.01 kB). 

## Key Benefits

1. **Zero Runtime Overhead**: Use with `import type` for compile-time only imports
2. **No Dependency Hell**: Packages can share types without heavy runtime dependencies  
3. **Clean Architecture**: Avoids circular dependencies between packages
4. **Lightweight**: Perfect for packages that only need type information

## Usage

Always use `import type` syntax to ensure zero runtime impact:

```typescript
// ✅ Correct - zero runtime overhead
import type { 
  ConnectorFactory, 
  AnyGPTConfig,
  ChatCompletionRequest 
} from '@anygpt/types';

// ❌ Avoid - creates runtime dependency
import { ConnectorFactory } from '@anygpt/types';
```

## Architecture Problem Solved

**Before**: Packages needed heavy router dependency just for types
```typescript
// Heavy dependency just for types!
import type { ConnectorFactory } from '@anygpt/router';
```

**After**: Lightweight types-only dependency
```typescript
// Pure types, zero runtime cost
import type { ConnectorFactory } from '@anygpt/types';
```

## Package Dependencies

- **Runtime Dependencies**: NONE ✅
- **Dev Dependencies**: Inherited from root package.json
- **Build Output**: ~0.01 kB JavaScript (essentially empty)
- **Type Definitions**: ~8 kB of .d.ts files

## Type Categories

### Base Types
- `ChatMessage`, `ChatCompletionRequest`, `ChatCompletionResponse`
- `ModelInfo`, `ConnectorConfig`, `Logger`

### Connector Types  
- `IConnector`, `ConnectorFactory`, `IConnectorRegistry`

### Router Types
- `RouterConfig`, `ApiConfig`, `ProviderConfig`
- `ResponseRequest`, `ResponseResponse`, `Tool`, `ToolChoice`

### Configuration Types
- `AnyGPTConfig`, `ConfigLoadOptions`

## Best Practices

1. **Always use `import type`** - never regular imports
2. **Keep this package pure** - no runtime code, only types
3. **Extend interfaces** rather than duplicating types
4. **Use this for shared contracts** between packages

## Example: Connector Implementation

```typescript
import type { 
  ConnectorFactory, 
  IConnector,
  BaseChatCompletionRequest,
  BaseChatCompletionResponse 
} from '@anygpt/types';

export class MyConnectorFactory implements ConnectorFactory {
  getProviderId(): string {
    return 'my-provider';
  }

  create(config: ConnectorConfig): IConnector {
    return new MyConnector(config);
  }
}
```

This approach keeps packages lightweight while ensuring type safety across the entire AnyGPT ecosystem.
