# 1-3-connector-mock - Design

**Spec**: [Mock Connector](../../../../../products/anygpt/specs/README.md#provider-connectors)  
**Use Case**: [Rapid Prototyping](../../../../../products/anygpt/use-cases/rapid-prototyping.md)  
**Project**: anygpt-ts  
**Status**: 🔄 Design Phase

## Overview

Mock connector for testing and offline development. Provides configurable responses, delays, and failure simulation without real API calls.

## Architecture

### Components

**MockConnector**
- Implements Connector interface
- Returns configurable mock responses
- Simulates delays and failures

### Data Structures

```typescript
interface MockConnectorConfig {
  defaultResponse?: string;
  delay?: number;  // ms
  failureRate?: number;  // 0-1
  models?: string[];
}
```

## Dependencies

- `@anygpt/types` - Connector interface
- `@anygpt/router` - Registration

## Implementation Strategy

- [ ] Implement Connector interface
- [ ] Configurable responses
- [ ] Delay simulation
- [ ] Failure simulation
- [ ] Mock model list

## References

[Roadmap](../../roadmap.md) | [Architecture](../../architecture.md)
