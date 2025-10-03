import type { CLIContext } from '../utils/cli-context.js';

interface ChatOptions {
  provider?: string;
  type?: 'openai' | 'anthropic' | 'google';
  url?: string;
  token?: string;
  model?: string;
}

export async function chatCommand(
  context: CLIContext,
  message: string,
  options: ChatOptions
) {
  // Determine which provider to use
  const providerId = options.provider || context.defaults.provider;
  
  if (!providerId) {
    throw new Error('No provider specified. Use --provider or configure a default provider.');
  }
  
  // Get model (use provided model, or default, or error)
  const modelId = options.model || context.defaults.model;
  if (!modelId) {
    throw new Error(`No model specified. Use --model or configure a default model for provider '${providerId}'.`);
  }
  
  try {
    const response = await context.router.chatCompletion({
      provider: providerId,
      model: modelId,
      messages: [{ role: 'user', content: message }]
    });
    
    const reply = response.choices[0]?.message?.content;
    if (reply) {
      console.log(reply);
    } else {
      console.log('No response received');
    }
    
    // Show usage info if available
    if (response.usage) {
      console.log('');
      console.log(`📊 Usage: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
    }
    
  } catch (error) {
    throw new Error(`Chat request failed: ${error instanceof Error ? error.message : error}`);
  }
}
