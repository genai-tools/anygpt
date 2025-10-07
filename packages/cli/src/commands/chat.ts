import type { CLIContext } from '../utils/cli-context.js';
import type { FactoryProviderConfig } from '@anygpt/config';

interface ChatOptions {
  provider?: string;
  type?: 'openai' | 'anthropic' | 'google';
  url?: string;
  token?: string;
  model?: string;
  maxTokens?: number;
  usage?: boolean;
  stdin?: boolean;
}

// Import shared model resolution from config
import { resolveModel as resolveModelShared } from '@anygpt/config';

export async function chatCommand(
  context: CLIContext,
  message: string | undefined,
  options: ChatOptions
) {
  // Read from stdin if --stdin flag is set
  let actualMessage = message;
  if (options.stdin) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    actualMessage = Buffer.concat(chunks).toString('utf-8').trim();
  }
  
  if (!actualMessage) {
    throw new Error('No message provided. Either pass a message argument or use --stdin.');
  }
  // Determine which provider to use (might be overridden by alias resolution)
  let providerId = options.provider || context.defaults.provider;
  
  if (!providerId) {
    throw new Error('No provider specified. Use --provider or configure a default provider.');
  }
  
  // Get model with priority: CLI option > per-provider default > global default
  let modelId = options.model 
    || context.defaults.providers?.[providerId]?.model 
    || context.defaults.model;
  
  if (!modelId) {
    throw new Error(`No model specified. Use --model or configure a default model for provider '${providerId}'.`);
  }
  
  // Check if the model is an alias/tag and resolve it
  const resolution = resolveModelShared(modelId, {
    providers: context.providers,
    aliases: context.defaults.aliases,
    defaultProvider: context.defaults.provider
  }, providerId);
  if (resolution) {
    // Use the resolved provider and model
    providerId = resolution.provider;
    modelId = resolution.model;
    
    if (options.model) {
      // Log resolution info (only shown with --verbose)
      context.logger.info(`🔗 Resolved '${options.model}' → ${providerId}/${modelId}`);
    }
  }
  
  // Verbose mode: show request metrics
  context.logger.info(`📤 Request: provider=${providerId}, model=${modelId}`);
  context.logger.info(`💬 Message length: ${actualMessage.length} chars`);
  context.logger.info(''); // Empty line before response
  
  try {
    const startTime = Date.now();
    
    const response = await context.router.chatCompletion({
      provider: providerId,
      model: modelId,
      messages: [{ role: 'user', content: actualMessage }],
      ...(options.maxTokens && { max_tokens: options.maxTokens })
    });
    
    const duration = Date.now() - startTime;
    
    const reply = response.choices[0]?.message?.content;
    
    // Print the actual response (clearly visible)
    if (reply) {
      console.log(reply);
    } else {
      console.log('No response received');
    }
    
    // Verbose mode: show response metrics after the response
    context.logger.info(''); // Empty line after response
    context.logger.info(`⏱️  Response time: ${duration}ms`);
    if (response.usage) {
      context.logger.info(`📊 Tokens: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} total`);
    }
    if (response.model) {
      context.logger.info(`🤖 Model used: ${response.model}`);
    }
    if (reply) {
      context.logger.info(`📝 Response length: ${reply.length} chars`);
    }
    
    // Show usage info only if --usage flag is provided (for non-verbose mode)
    if (options.usage && response.usage && !context.logger.info) {
      console.log('');
      console.log(`📊 Usage: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
    }
    
  } catch (error) {
    throw new Error(`Chat request failed: ${error instanceof Error ? error.message : error}`);
  }
}
