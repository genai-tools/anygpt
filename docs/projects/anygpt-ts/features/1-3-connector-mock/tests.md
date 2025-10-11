# 1-3-connector-mock - Test Scenarios

**Design**: [design.md](./design.md)  
**Status**: ❌ Not Started

## Test Summary

- **Total Tests**: 0
- **Passing**: 0
- **Coverage**: 0%

## Unit Tests

#### Test: Return default response
- **Given**: MockConnector with default response "Hello"
- **When**: `complete(request)` is called
- **Then**: Returns "Hello"
- **Status**: ❌

#### Test: Simulate delay
- **Given**: MockConnector with 100ms delay
- **When**: `complete(request)` is called
- **Then**: Takes ~100ms to respond
- **Status**: ❌

#### Test: Simulate failure
- **Given**: MockConnector with failureRate=1.0
- **When**: `complete(request)` is called
- **Then**: Throws error
- **Status**: ❌

#### Test: List mock models
- **Given**: MockConnector with models=['mock-1', 'mock-2']
- **When**: `listModels()` is called
- **Then**: Returns mock model list
- **Status**: ❌

## Integration Tests

#### Test: Register with router
- **Given**: MockConnector created
- **When**: Registered with provider router
- **Then**: Can route requests to mock
- **Status**: ❌

## Contract Tests

- [ ] Implements Connector interface
- [ ] Returns valid CompletionResponse
- [ ] Returns valid Model list

## Coverage Requirements

- [ ] Unit test coverage > 80%
- [ ] All public APIs tested
