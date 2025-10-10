# Mock Connector

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/5 tasks |
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

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 1-2-provider-router

## Implementation Plan

- [ ] Implement Connector interface
- [ ] Configurable responses (default, custom patterns)
- [ ] Delay simulation (configurable latency)
- [ ] Failure simulation (error rates, specific errors)
- [ ] Mock model list

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

**Internal**: @anygpt/types  
**External**: None
