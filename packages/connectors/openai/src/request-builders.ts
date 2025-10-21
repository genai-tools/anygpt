import OpenAI from 'openai';
import type { BaseChatCompletionRequest as ChatCompletionRequest } from '@anygpt/router';

/**
 * Determine the appropriate token limit parameter name and value
 * based on the request flags
 */
export function getTokenLimitParam(
  request: ChatCompletionRequest
): Record<string, number> | undefined {
  if (request.max_tokens === undefined) {
    return undefined;
  }

  const paramName = request.useLegacyMaxTokens
    ? 'max_tokens'
    : 'max_completion_tokens';

  return { [paramName]: request.max_tokens };
}

/**
 * Build Chat Completions API request parameters
 */
export function buildChatCompletionRequest(
  request: ChatCompletionRequest
): OpenAI.Chat.ChatCompletionCreateParamsNonStreaming {
  const requestParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model: request.model!,
    messages: request.messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: request.temperature,
    top_p: request.top_p,
    presence_penalty: request.presence_penalty,
    stream: false,
    // Add reasoning_effort if provided (for OpenAI o1/o3 models)
    ...(request.reasoning?.effort && {
      reasoning_effort: request.reasoning.effort,
    }),
    // Handle token limits
    ...getTokenLimitParam(request),
  };

  const chatRequest = {
    ...requestParams,
    ...(request.extra_body && {
      extra_body: request.extra_body,
    }),
  };

  // Remove undefined values
  Object.keys(chatRequest).forEach((key) => {
    if (chatRequest[key as keyof typeof chatRequest] === undefined) {
      delete chatRequest[key as keyof typeof chatRequest];
    }
  });

  return chatRequest;
}

/**
 * Build Responses API request parameters
 */
export function buildResponsesRequest(
  request: ChatCompletionRequest
): OpenAI.Responses.ResponseCreateParamsNonStreaming {
  return {
    model: request.model!,
    input: request.messages.map((msg) => ({
      type: 'message' as const,
      role: msg.role,
      content: msg.content,
    })) as OpenAI.Responses.ResponseInput,
    temperature: request.temperature,
    top_p: request.top_p,
    ...(request.max_tokens !== undefined && {
      max_output_tokens: request.max_tokens,
    }),
  };
}
