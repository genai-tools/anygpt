import type { ModelInfo } from '@anygpt/router';

// Type alias for OpenAI-specific model info
export type OpenAIModelInfo = ModelInfo;

// Simplified: Let OpenAI API handle model validation
// No need for static model definitions since we use fallback system

export function getModelInfo(modelId: string): ModelInfo | undefined {
  void modelId;
  // Simplified: Let OpenAI API handle model validation
  // Return undefined to skip model-specific validation
  return undefined;
}

export function getChatModels(): ModelInfo[] {
  // Simplified: Return empty array since we don't need static model list
  return [];
}
