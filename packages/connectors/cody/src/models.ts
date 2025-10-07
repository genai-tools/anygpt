import type { ModelInfo } from '@anygpt/types';
import type { CodyConnectorConfig } from './types.js';

/**
 * Fetch available models from Sourcegraph API directly
 */
export async function getCodyModels(config: CodyConnectorConfig): Promise<ModelInfo[]> {
  try {
    const models = await listModelsFromAPI(config);
    return models;
  } catch (error) {
    // If API fails, throw with more context
    throw new Error(`Failed to list models from Sourcegraph API: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get client identification headers required by Sourcegraph API
 */
function getClientIdentificationHeaders(): Record<string, string> {
  const clientName = 'cody';
  const clientVersion = '5.5.21';
  const runtimeInfo = typeof process !== 'undefined' && process.version
    ? `Node.js ${process.version}`
    : 'Unknown environment';

  return {
    'X-Requested-With': `${clientName} ${clientVersion}`,
    'X-Sourcegraph-API-Client-Name': clientName,
    'X-Sourcegraph-API-Client-Version': clientVersion,
    'User-Agent': `${clientName}/${clientVersion} (${runtimeInfo})`
  };
}

/**
 * Fetch models directly from Sourcegraph API
 */
async function listModelsFromAPI(config: CodyConnectorConfig): Promise<ModelInfo[]> {
  const endpoint = config.endpoint || 'https://sourcegraph.com/';
  const accessToken = config.accessToken || process.env.SRC_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('Access token is required. Set accessToken in config or SRC_ACCESS_TOKEN environment variable.');
  }

  // Ensure endpoint ends with /
  const baseUrl = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
  const apiUrl = `${baseUrl}.api/llm/models`;

  const headers = {
    'Authorization': `token ${accessToken}`,
    ...getClientIdentificationHeaders()
  };

  const response = await fetch(apiUrl, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
  }

  const responseData = await response.json();
  
  // Handle OpenAI-style response format: {object: "list", data: [...]}
  let modelList: any[];
  if (responseData && typeof responseData === 'object' && responseData.data && Array.isArray(responseData.data)) {
    modelList = responseData.data;
  } else if (Array.isArray(responseData)) {
    modelList = responseData;
  } else {
    throw new Error('Invalid response format: expected array of models or {data: [...]} object');
  }

  // Convert model objects to ModelInfo objects
  const models: ModelInfo[] = modelList.map(modelObj => {
    // Handle both string IDs and model objects with id field
    const modelId = typeof modelObj === 'string' ? modelObj : modelObj.id;
    
    return {
      id: modelId,
      provider: 'cody',
      display_name: formatModelName(modelId),
      capabilities: {
        input: { text: true },
        output: { text: true, function_calling: true },
        // Use reasonable defaults - actual capabilities may vary
        context_length: getContextLength(modelId),
        max_output_tokens: getMaxOutputTokens(modelId)
      }
    };
  });
  
  return models;
}

/**
 * Get estimated context length based on model ID
 */
function getContextLength(modelId: string): number {
  if (modelId.includes('claude-3') || modelId.includes('claude-sonnet-4')) {
    return 200000;
  }
  if (modelId.includes('gpt-4') || modelId.includes('gpt-5')) {
    return 128000;
  }
  if (modelId.includes('gemini')) {
    return 1000000;
  }
  return 100000; // Default
}

/**
 * Get estimated max output tokens based on model ID
 */
function getMaxOutputTokens(modelId: string): number {
  if (modelId.includes('claude') || modelId.includes('gpt-4') || modelId.includes('gpt-5')) {
    return 8192;
  }
  if (modelId.includes('gemini')) {
    return 8192;
  }
  return 4096; // Default
}

/**
 * Format model ID into a human-readable name
 */
function formatModelName(modelId: string): string {
  // Convert model IDs like "anthropic/claude-3-5-sonnet-20241022" to "Claude 3.5 Sonnet"
  const parts = modelId.split('/');
  const name = parts[parts.length - 1];
  
  return name
    .replace(/-/g, ' ')
    .replace(/\d{8}$/, '') // Remove date suffix
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}
