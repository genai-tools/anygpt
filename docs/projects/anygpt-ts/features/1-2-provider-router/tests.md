# 1-2-provider-router - Test Scenarios

**Spec**: [Provider Router](../../../../../products/anygpt/specs/README.md#provider-router)  
**Design**: [design.md](./design.md)  
**Status**: ❌ Not Started

## Test Summary

- **Total Tests**: 0
- **Passing**: 0
- **Coverage**: 0%

## Unit Tests

### ConnectorRegistry

#### Test: Register connector
- **Given**: Empty registry
- **When**: `register('openai', connector)` is called
- **Then**: Connector is stored and retrievable
- **Status**: ❌

#### Test: Get registered connector
- **Given**: Connector registered as 'openai'
- **When**: `get('openai')` is called
- **Then**: Returns the connector
- **Status**: ❌

#### Test: Get non-existent connector
- **Given**: Connector not registered
- **When**: `get('invalid')` is called
- **Then**: Throws ProviderNotFoundError
- **Status**: ❌

### RoutingStrategy

#### Test: ExplicitStrategy selects specified provider
- **Given**: Request with `provider: 'openai'`
- **When**: Strategy selects provider
- **Then**: Returns 'openai' connector
- **Status**: ❌

#### Test: DefaultStrategy uses config default
- **Given**: No provider specified, default is 'openai'
- **When**: Strategy selects provider
- **Then**: Returns 'openai' connector
- **Status**: ❌

### ResponseNormalizer

#### Test: Normalize OpenAI response
- **Given**: OpenAI API response format
- **When**: `normalize(response, 'openai')` is called
- **Then**: Returns normalized RouteResponse
- **Status**: ❌

#### Test: Extract usage information
- **Given**: Provider response with token usage
- **When**: Response is normalized
- **Then**: Usage object contains correct token counts
- **Status**: ❌

### ErrorHandler

#### Test: Retry on rate limit error
- **Given**: Rate limit error (429)
- **When**: `handle(error)` is called
- **Then**: Returns retry decision with backoff
- **Status**: ❌

#### Test: No retry on auth error
- **Given**: Authentication error (401)
- **When**: `handle(error)` is called
- **Then**: Returns no retry decision
- **Status**: ❌

#### Test: Exponential backoff
- **Given**: Multiple retries
- **When**: Backoff is calculated
- **Then**: Delays are 1s, 2s, 4s
- **Status**: ❌

## Integration Tests

### Basic Routing

#### Test: Route to explicit provider
- **Given**: Request with provider='openai'
- **When**: `route(request)` is called
- **Then**: Routes to openai connector and returns response
- **Status**: ❌

#### Test: Route to default provider
- **Given**: Request without provider, default='openai'
- **When**: `route(request)` is called
- **Then**: Routes to openai connector
- **Status**: ❌

#### Test: List all models
- **Given**: Multiple connectors registered
- **When**: `listModels()` is called
- **Then**: Returns models from all connectors
- **Status**: ❌

### Retry Logic

#### Test: Retry on transient error
- **Given**: Connector fails with rate limit first time, succeeds second
- **When**: `route(request)` is called
- **Then**: Retries and returns successful response
- **Status**: ❌

#### Test: Max retries exceeded
- **Given**: Connector fails 4 times
- **When**: `route(request)` is called
- **Then**: Throws MaxRetriesExceededError after 3 retries
- **Status**: ❌

### Failover

#### Test: Failover to backup provider
- **Given**: Primary provider fails, backup configured
- **When**: `route(request)` is called
- **Then**: Automatically tries backup provider
- **Status**: ❌

## E2E Tests

### Real Provider Integration

#### Test: Route request through real connector
- **Given**: Mock connector registered
- **When**: Request is routed
- **Then**: Returns response from mock connector
- **Status**: ❌

## Error Tests

### Provider Not Found

#### Test: Invalid provider specified
- **Given**: Request with provider='invalid'
- **When**: `route(request)` is called
- **Then**: Throws ProviderNotFoundError
- **Error Message**: `Provider 'invalid' not found`
- **Status**: ❌

### All Providers Failed

#### Test: All retries and failover exhausted
- **Given**: All providers fail
- **When**: `route(request)` is called
- **Then**: Throws MaxRetriesExceededError
- **Error Message**: `All providers failed after 3 retries`
- **Status**: ❌

## Contract Tests (Spec Compliance)

- [ ] Routes to correct provider
- [ ] Handles all error types
- [ ] Retry logic works as specified
- [ ] Failover works as specified
- [ ] Response normalization works
- [ ] All routing strategies work

## Coverage Requirements

- [ ] Unit test coverage > 80%
- [ ] Integration test coverage > 70%
- [ ] All public APIs tested
- [ ] All error paths tested

## Notes

- Mock connectors for unit tests
- Use real mock connector for integration tests
- Test all routing strategies
- Test all error scenarios
