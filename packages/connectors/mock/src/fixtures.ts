/**
 * Fixture types and utilities for E2E testing
 */

import type { BaseChatCompletionRequest, BaseChatCompletionResponse } from '@anygpt/types';

/**
 * Fixture matching strategies
 */
export type FixtureMatcher =
  | { type: 'exact'; content: string }
  | { type: 'pattern'; pattern: RegExp }
  | { type: 'contains'; substring: string }
  | { type: 'function'; match: (request: BaseChatCompletionRequest) => boolean };

/**
 * Fixture response can be static or dynamic
 */
export type FixtureResponse = 
  | string
  | { content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }
  | ((request: BaseChatCompletionRequest) => string | { content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } });

/**
 * A fixture defines a request pattern and its response
 */
export interface Fixture {
  /** Unique name for debugging */
  name: string;
  /** How to match this fixture */
  matcher: FixtureMatcher;
  /** What to respond with */
  response: FixtureResponse;
  /** Optional: only match for specific model */
  model?: string;
  /** Optional: delay response (ms) for testing timeouts */
  delay?: number;
}

/**
 * Sequence fixture for multi-turn conversations
 */
export interface SequenceFixture {
  name: string;
  /** Match the first message */
  startMatcher: FixtureMatcher;
  /** Responses for each turn */
  responses: FixtureResponse[];
}

/**
 * Check if a request matches a fixture
 */
export function matchesFixture(
  request: BaseChatCompletionRequest,
  fixture: Fixture
): boolean {
  const lastMessage = request.messages[request.messages.length - 1];
  if (!lastMessage) return false;

  // Check model if specified
  if (fixture.model && request.model !== fixture.model) {
    return false;
  }

  const content = lastMessage.content;
  const matcher = fixture.matcher;

  switch (matcher.type) {
    case 'exact':
      return content === matcher.content;
    
    case 'pattern':
      return matcher.pattern.test(content);
    
    case 'contains':
      return content.includes(matcher.substring);
    
    case 'function':
      return matcher.match(request);
    
    default:
      return false;
  }
}

/**
 * Build response from fixture
 */
export function buildFixtureResponse(
  fixture: Fixture,
  request: BaseChatCompletionRequest
): Omit<BaseChatCompletionResponse, 'id' | 'created' | 'object' | 'provider'> {
  let responseData: { content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } };

  // Resolve response (could be function)
  const response = typeof fixture.response === 'function' 
    ? fixture.response(request)
    : fixture.response;

  // Normalize to object format
  if (typeof response === 'string') {
    responseData = { content: response };
  } else {
    responseData = response;
  }

  // Calculate usage if not provided
  const promptTokens = Math.ceil(request.messages.reduce((sum, m) => sum + m.content.length / 4, 0));
  const completionTokens = Math.ceil(responseData.content.length / 4);
  
  const usage = responseData.usage || {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens
  };

  return {
    model: request.model || 'mock-model',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: responseData.content
      },
      finish_reason: 'stop'
    }],
    usage
  };
}

/**
 * Helper to create exact match fixture
 */
export function exactMatch(content: string, response: FixtureResponse, name?: string): Fixture {
  return {
    name: name || `exact:${content}`,
    matcher: { type: 'exact', content },
    response
  };
}

/**
 * Helper to create pattern match fixture
 */
export function patternMatch(pattern: RegExp, response: FixtureResponse, name?: string): Fixture {
  return {
    name: name || `pattern:${pattern.source}`,
    matcher: { type: 'pattern', pattern },
    response
  };
}

/**
 * Helper to create contains match fixture
 */
export function containsMatch(substring: string, response: FixtureResponse, name?: string): Fixture {
  return {
    name: name || `contains:${substring}`,
    matcher: { type: 'contains', substring },
    response
  };
}
