import OpenAI from 'openai';
import type { ChatCompletionResponse } from '@anygpt/types';

/**
 * Convert Responses API response to Chat Completion format
 */
export function convertResponsesToChatCompletion(
  responsesResponse: OpenAI.Responses.Response,
  providerId = 'openai'
): ChatCompletionResponse {
  const outputMessage = responsesResponse.output.find(
    (item): item is OpenAI.Responses.ResponseOutputMessage =>
      item.type === 'message'
  );
  const textContent = outputMessage?.content?.find(
    (c): c is OpenAI.Responses.ResponseOutputText => c.type === 'output_text'
  );

  return {
    id: responsesResponse.id,
    object: 'chat.completion',
    created: responsesResponse.created_at,
    model: responsesResponse.model,
    provider: providerId,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: textContent?.text || '',
        },
        finish_reason:
          responsesResponse.status === 'completed' ? 'stop' : 'length',
      },
    ],
    usage: {
      prompt_tokens: responsesResponse.usage?.input_tokens || 0,
      completion_tokens: responsesResponse.usage?.output_tokens || 0,
      total_tokens: responsesResponse.usage?.total_tokens || 0,
    },
  };
}
