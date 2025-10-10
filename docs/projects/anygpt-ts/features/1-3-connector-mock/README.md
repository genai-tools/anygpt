# Mock Connector

| | |
|---|---|
| **Status** | ✅ Complete |
| **Progress** | 5/5 tasks (100%) |
| **Spec** | [Mock Connector](../../../../products/anygpt/specs/README.md#provider-connectors) |
| **Use Case** | [Rapid Prototyping](../../../../products/anygpt/cases/rapid-prototyping.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |
| **Technical Design** | [design.md](./design.md) |
| **Testing Strategy** | [tests.md](./tests.md) |

---

## Overview

Mock connector for testing and offline development. Provides configurable responses, delays, and failure simulation without real API calls.

## Status

**Last Updated**: 2025-10-10  
**Current Phase**: Complete

### Recent Updates
- 2025-10-10: ✅ Feature complete - 48 tests, 61% coverage
- 2025-10-10: Added comprehensive tests for all features
- 2025-01-10: Feature documentation created

## Implementation Plan

- [x] Implement Connector interface ✅
- [x] Configurable responses (default, custom patterns) ✅
- [x] Delay simulation (configurable latency) ✅
- [x] Failure simulation (error rates, specific errors) ✅
- [x] Mock model list ✅

## Technical Design

**MockConnector** implementing Connector interface with:
- Configurable response patterns
- Delay and failure rate simulation
- No external API calls

**See [design.md](./design.md)** for detailed design.

## Tests

**Key tests**: Return default response, simulate delays, simulate failures, register with router

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

| Type | Dependency | Description |
|------|------------|-------------|
| 🚫 **Blocked by** | [Provider Router](../1-2-provider-router/) | Need router to register connector with |
| 📦 **Internal** | [@anygpt/types](../../packages/types/) | Shared type definitions |
