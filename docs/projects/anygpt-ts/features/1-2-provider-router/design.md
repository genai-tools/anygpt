# 1-2-provider-router - Design

**Spec**: [Provider Router](../../../../../products/anygpt/specs/README.md#provider-router)  
**Use Cases**: 
- [Provider Agnostic Chat](../../../../../products/anygpt/use-cases/provider-agnostic-chat.md)
- [Cost Optimization](../../../../../products/anygpt/use-cases/cost-optimization.md)
- [Resilience & Failover](../../../../../products/anygpt/use-cases/resilience-failover.md)

**Project**: anygpt-ts  
**Status**: 🔄 Design Phase

## Overview

Provider router that abstracts provider differences, routes requests to appropriate connectors, normalizes responses, handles errors with retry logic, and supports multiple routing strategies.

## Architecture

### Components

**ProviderRouter**
- **Responsibility**: Main entry point, orchestrates routing
- **Public API**:
  - `route(request)` - Route request to provider
  - `registerConnector(name, connector)` - Register connector
  - `listModels()` - List all available models
- **Internal**: Routing strategy selection, error handling

**ConnectorRegistry**
- **Responsibility**: Manage registered connectors
- **Public API**:
  - `register(name, connector)` - Register connector
  - `get(name)` - Get connector by name
  - `list()` - List all connectors
- **Internal**: Map of connectors

**RoutingStrategy**
- **Responsibility**: Determine which provider to use
- **Implementations**:
  - `ExplicitStrategy` - Use specified provider
  - `DefaultStrategy` - Use default from config
  - `CostOptimizedStrategy` - Route by cost
  - `FailoverStrategy` - Retry with backup provider
- **Public API**:
  - `selectProvider(request, connectors)` - Select provider

**ResponseNormalizer**
- **Responsibility**: Normalize provider responses to common format
- **Public API**:
  - `normalize(response, provider)` - Normalize response
- **Internal**: Provider-specific transformations

**ErrorHandler**
- **Responsibility**: Handle errors with retry logic
- **Public API**:
  - `handle(error, context)` - Handle error, return retry decision
- **Internal**: Retry logic, exponential backoff

### Data Structures

```typescript
interface RouteRequest {
  prompt: string;
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
}

interface RouteResponse {
  message: {
    role: string;
    content: string;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
}

interface Connector {
  name: string;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  listModels(): Promise<Model[]>;
}

interface RoutingContext {
  request: RouteRequest;
  connectors: Map<string, Connector>;
  config: RouterConfig;
}
```

### Algorithms

**Routing Algorithm**:
1. Select routing strategy based on request
2. Strategy selects provider/connector
3. Call connector with request
4. If error, check if retryable
5. If retryable, apply backoff and retry
6. If max retries reached, try failover provider
7. Normalize response
8. Return to caller

**Retry Logic**:
- Retryable errors: rate limit, network, timeout
- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s)
- Jitter: Random 0-500ms

## Dependencies

### Internal Dependencies
- `@anygpt/types` - Type definitions
- `@anygpt/config` - Configuration

### External Dependencies
- None (pure routing logic)

## Interfaces

### Public API

```typescript
export class ProviderRouter {
  constructor(config: RouterConfig)
  
  async route(request: RouteRequest): Promise<RouteResponse>
  
  registerConnector(name: string, connector: Connector): void
  
  async listModels(): Promise<Model[]>
}

interface RouterConfig {
  defaultProvider?: string;
  routingStrategy?: 'explicit' | 'default' | 'cost' | 'failover';
  retry?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
  };
  failover?: {
    enabled: boolean;
    providers: string[];
  };
}
```

## Error Handling

### Error Types
- **ProviderNotFoundError**: Requested provider not registered
- **ModelNotFoundError**: Model not available
- **ProviderError**: Provider API error (wrapped)
- **MaxRetriesExceededError**: All retries failed

### Error Flow
1. Connector throws error
2. ErrorHandler checks if retryable
3. If retryable, apply backoff and retry
4. If not retryable or max retries, check failover
5. If failover enabled, try backup provider
6. If all fail, throw MaxRetriesExceededError

## Implementation Strategy

### Phase 1: Basic Routing
- [ ] Implement ConnectorRegistry
- [ ] Implement basic ProviderRouter
- [ ] Implement ExplicitStrategy
- [ ] Implement DefaultStrategy
- [ ] Basic error handling

### Phase 2: Response Normalization
- [ ] Implement ResponseNormalizer
- [ ] Handle different response formats
- [ ] Extract usage information

### Phase 3: Retry Logic
- [ ] Implement ErrorHandler
- [ ] Implement retry with backoff
- [ ] Implement retryable error detection

### Phase 4: Advanced Routing
- [ ] Implement CostOptimizedStrategy
- [ ] Implement FailoverStrategy
- [ ] Implement circuit breaker pattern

## Open Questions

- [ ] How to handle streaming responses?
- [ ] Should we cache model lists?
- [ ] How to implement circuit breaker?
- [ ] Metrics collection strategy?

## References

- **Spec**: [Provider Router](../../../../../products/anygpt/specs/README.md#provider-router)
- **Architecture**: [../../architecture.md](../../architecture.md)
- **Roadmap**: [../../roadmap.md](../../roadmap.md)
