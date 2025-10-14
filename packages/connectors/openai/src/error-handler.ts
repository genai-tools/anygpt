import OpenAI from 'openai';
import type { Logger } from '@anygpt/types';

export interface ErrorResponse {
  model: string;
  status?: number;
  error: {
    message?: string;
    type?: string;
    param?: string | null;
    code?: string | null;
  };
  body?: unknown;
}

/**
 * Build structured error response from an error object
 */
export function buildErrorResponse(
  error: unknown,
  model: string,
  lastErrorBody: unknown
): ErrorResponse {
  const errorResponse: ErrorResponse = {
    model,
    error: {},
    body: lastErrorBody,
  };

  if (error instanceof OpenAI.APIError) {
    errorResponse.status = error.status;
    errorResponse.error.message = error.message;
    errorResponse.error.type = error.type;
    errorResponse.error.code = error.code;
    errorResponse.error.param = error.param;
  } else if (error instanceof Error) {
    errorResponse.error.message = error.message;
  } else {
    errorResponse.error.message = String(error);
  }

  return errorResponse;
}

/**
 * Format error message for display
 */
export function formatErrorMessage(
  errorResponse: ErrorResponse,
  providerId: string,
  logger: Logger
): string {
  const errorStatus = errorResponse.status || 'unknown';
  const hasReasoning = errorResponse.error.param === 'reasoning_effort';

  // Extract error message
  const errorMessage =
    errorResponse.error.message || `${errorStatus} status code (no body)`;

  logger.debug(`[${providerId}] API Error Details:`, errorResponse);

  // If we have a real error message (not the generic "no body"), use it
  if (errorMessage && !errorMessage.includes('no body')) {
    return `❌ ${providerId} chat completion failed: ${errorMessage}`;
  }

  // If we have a body with details, show it as JSON
  if (errorResponse.body) {
    const bodyStr =
      typeof errorResponse.body === 'string'
        ? errorResponse.body
        : JSON.stringify(errorResponse.body, null, 2);
    return `❌ ${providerId} chat completion failed: ${errorStatus}\n${bodyStr}`;
  }

  // Provide contextual hints based on reasoning parameter presence
  let hint = '';
  if (hasReasoning) {
    hint = `This model may not support the reasoning_effort parameter. Try disabling reasoning in your provider config.`;
  } else {
    hint = `This model may not be available or supported by this provider. Check if the model exists and is accessible.`;
  }

  return `❌ ${providerId} chat completion failed: ${errorStatus} status code (no body). ${hint}`;
}

/**
 * Check if error should trigger fallback to Chat Completions API
 */
export function shouldFallbackToChatCompletion(
  error: unknown,
  allowFallback: boolean
): boolean {
  return (
    allowFallback &&
    !!error &&
    typeof error === 'object' &&
    'status' in error &&
    ((error as { status?: number }).status === 404 ||
      (error as { status?: number }).status === 400)
  );
}
