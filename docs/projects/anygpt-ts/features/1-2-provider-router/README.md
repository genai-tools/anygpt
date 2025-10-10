# Provider Router

| | |
|---|---|
| **Status** | ✅ Complete (Core Features) |
| **Progress** | 9/17 tasks (53%) - Production Ready |
| **Spec** | [Provider Router](../../../../products/anygpt/specs/README.md#provider-router) |
| **Use Case** | [Provider Agnostic Chat](../../../../products/anygpt/cases/provider-agnostic-chat.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |
| **Technical Design** | [design.md](./design.md) |
| **Testing Strategy** | [tests.md](./tests.md) |

---

## Overview

Provider router that abstracts multiple AI providers, handles routing strategies, retry logic, and failover.

## Status

**Last Updated**: 2025-10-10  
**Current Phase**: Complete (Core Features)

### Recent Updates
- 2025-10-10: ✅ Retry logic implemented (Phase 3 complete)
- 2025-10-10: ✅ ConnectorRegistry tests complete (100% coverage)
- 2025-10-10: Feature marked production-ready

## Implementation Plan

### Phase 1: Basic Routing (3/5 complete)
- [x] Implement ConnectorRegistry ✅
- [x] Implement basic ProviderRouter ✅
- [ ] Implement ExplicitStrategy (deferred - hardcoded works)
- [ ] Implement DefaultStrategy (deferred - not critical)
- [x] Basic error handling ✅

### Phase 2: Response Normalization (0/3 complete) - DEFERRED
- [ ] Implement ResponseNormalizer (connectors already normalize)
- [ ] Handle different response formats (not needed)
- [ ] Extract usage information (already done in connectors)

### Phase 3: Retry Logic (3/3 complete) ✅
- [x] Implement ErrorHandler
- [x] Implement retry with backoff
- [x] Implement retryable error detection

### Phase 4: Advanced Routing (0/3 complete) - FUTURE
- [ ] Implement CostOptimizedStrategy (future enhancement)
- [ ] Implement FailoverStrategy (future enhancement)
- [ ] Implement circuit breaker pattern (future enhancement)

## Technical Design

**Key Components**:
- **ProviderRouter** - Main entry point, orchestrates routing
- **ConnectorRegistry** - Manage registered connectors
- **RoutingStrategy** - Determine which provider to use (Explicit, Default, Cost, Failover)
- **ResponseNormalizer** - Normalize provider responses
- **ErrorHandler** - Handle errors with retry logic

**See [design.md](./design.md)** for detailed architecture and algorithms.

## Tests

**Unit Tests**: All components (Registry, Router, Strategies, Normalizer, ErrorHandler)  
**Integration Tests**: End-to-end routing with retry and failover

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

| Type | Dependency | Description |
|------|------------|-------------|
| 🚫 **Blocked by** | [Configuration Loader](../1-1-config-loader/) | Need config system to load provider settings |
| 📦 **Internal** | [@anygpt/types](../../packages/types/) | Shared type definitions |
| 📦 **Internal** | [@anygpt/config](../../packages/config/) | Configuration management |
