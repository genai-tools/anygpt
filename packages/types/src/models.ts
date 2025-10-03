/**
 * Model-related types and interfaces
 */

export interface ModelCapabilities {
  /** Input types supported */
  input: {
    text: boolean;
    image?: boolean;
    audio?: boolean;
  };
  /** Output features supported */
  output: {
    text: boolean;
    function_calling?: boolean;
    reasoning?: boolean;
  };
  /** Context window size */
  context_length?: number;
  /** Maximum output tokens */
  max_output_tokens?: number;
}

export interface ModelInfo {
  id: string;
  provider: string;
  display_name: string;
  capabilities: ModelCapabilities;
  description?: string;
}
