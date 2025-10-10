# 1-3-connector-mock

**Status**: ❌ Not Started  
**Progress**: 0/5 tasks

## Overview

Mock connector for testing and offline development. Provides configurable responses, delays, and failure simulation without real API calls.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 1-2-provider-router

## Tasks

- [ ] Implement Connector interface
- [ ] Configurable responses
- [ ] Delay simulation
- [ ] Failure simulation
- [ ] Mock model list

## Design

**See [design.md](./design.md)** for detailed design.

Key components:
- MockConnector implementing Connector interface
- Configurable response patterns
- Delay and failure rate simulation

## Tests

**See [tests.md](./tests.md)** for test scenarios.

Key tests:
- Return default response
- Simulate delays
- Simulate failures
- Register with router

## References

- [Architecture](../../architecture.md)
- [Spec](../../../../../products/anygpt/specs/README.md#provider-connectors)
