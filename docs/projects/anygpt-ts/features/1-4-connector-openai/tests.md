# 1-4-connector-openai - Test Scenarios

**Design**: [design.md](./design.md)  
**Status**: ❌ Not Started

## Test Summary

- **Total Tests**: 0
- **Passing**: 0
- **Coverage**: 0%

## Unit Tests

#### Test: Call OpenAI API
- **Given**: Valid API key
- **When**: `complete(request)` is called
- **Then**: Calls OpenAI API and returns response
- **Status**: ❌

#### Test: Use custom baseURL
- **Given**: baseURL set to Ollama endpoint
- **When**: `complete(request)` is called
- **Then**: Calls Ollama instead of OpenAI
- **Status**: ❌

#### Test: Handle API errors
- **Given**: Invalid API key
- **When**: `complete(request)` is called
- **Then**: Throws appropriate error
- **Status**: ❌

#### Test: List models
- **Given**: Valid API key
- **When**: `listModels()` is called
- **Then**: Returns OpenAI model list
- **Status**: ❌

## Integration Tests

#### Test: OpenAI integration
- **Given**: Real OpenAI API key
- **When**: Request is sent
- **Then**: Returns real response
- **Status**: ❌

#### Test: Ollama integration
- **Given**: Ollama running locally
- **When**: Request with baseURL=http://localhost:11434
- **Then**: Returns Ollama response
- **Status**: ❌

## Contract Tests

- [ ] Implements Connector interface
- [ ] Returns valid CompletionResponse
- [ ] Handles all OpenAI error codes
- [ ] Supports OpenAI-compatible APIs

## Coverage Requirements

- [ ] Unit test coverage > 80%
- [ ] All error paths tested
