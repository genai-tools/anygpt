/**
 * Response API types and interfaces
 */

import type { ChatMessage } from './chat.js';

/**
 * Tool definition for function calling
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

/**
 * Tool choice configuration
 */
export type ToolChoice = 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };

/**
 * Response API request interface
 */
export interface ResponseRequest {
  provider: string;
  model: string;
  input: string | ChatMessage[];
  previous_response_id?: string;
  temperature?: number;
  max_output_tokens?: number;
  top_p?: number;
  tools?: Tool[];
  tool_choice?: ToolChoice;
}

/**
 * Response content annotation
 */
export interface ResponseAnnotation {
  type: string;
  text?: string;
  [key: string]: unknown;
}

/**
 * Response content item
 */
export interface ResponseContent {
  type: 'output_text' | 'function_call' | 'reasoning';
  text?: string;
  annotations?: ResponseAnnotation[];
}

/**
 * Response output item
 */
export interface ResponseOutput {
  id: string;
  type: 'message' | 'function_call' | 'reasoning';
  role?: 'assistant' | 'user';
  content?: ResponseContent[];
  status?: string;
}

/**
 * Response API response interface
 */
export interface ResponseResponse {
  id: string;
  object: string;
  created_at: number;
  model: string;
  provider: string;
  status: 'in_progress' | 'completed' | 'failed';
  output: ResponseOutput[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  previous_response_id?: string;
}
