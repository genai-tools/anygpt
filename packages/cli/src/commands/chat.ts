import { GenAIRouter } from '@anygpt/router';
import type { RouterConfig } from '@anygpt/router';
import { loadConfig } from '../utils/config.js';

interface ChatOptions {
  provider?: string;
  type?: 'openai' | 'anthropic' | 'google';
  url?: string;
  token?: string;
  model: string;
}

export async function chatCommand(
  message: string,
  options: ChatOptions,
  globalOpts: { config?: string }
) {
  let config: RouterConfig;
  
  if (options.provider) {
    // Use specific provider from config
    config = await loadConfig(globalOpts.config) as RouterConfig;
    
    if (!config.providers?.[options.provider]) {
      throw new Error(`Provider '${options.provider}' not found in config`);
    }
  } else if (options.type && options.url && options.token) {
    // Create ad-hoc config from command line options
    config = {
      providers: {
        adhoc: {
          type: options.type,
          baseURL: options.url,
          apiKey: options.token
        } as any
      }
    };
    options.provider = 'adhoc';
  } else {
    // Use default provider from config
    config = await loadConfig(globalOpts.config) as RouterConfig;
    
    // Find first available provider
    const providers = Object.keys(config.providers || {});
    if (providers.length === 0) {
      throw new Error('No providers configured. Use --provider or configure providers in config file.');
    }
    
    options.provider = providers[0];
    console.log(`Using default provider: ${options.provider}`);
  }
  
  const router = new GenAIRouter(config);
  
  try {
    const response = await router.chatCompletion({
      provider: options.provider!,
      model: options.model,
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
