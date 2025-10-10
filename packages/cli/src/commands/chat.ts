import type { CLIContext } from '../utils/cli-context.js';
import { resolveModel, resolveModelConfig } from '@anygpt/config';

interface ChatOptions {
  provider?: string;
  type?: 'openai' | 'anthropic' | 'google';
  url?: string;
  token?: string;
  model?: string;
  tag?: string;
  maxTokens?: number;
  usage?: boolean;
  stdin?: boolean;
}

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
    throw new Error(
      'No message provided. Either pass a message argument or use --stdin flag to read from stdin.'
    );
  }
  // Validate that only one of --model or --tag is specified
  if (options.model && options.tag) {
    throw new Error(
      'Cannot specify both --model and --tag. Use --model for direct model names or --tag for tag resolution.'
    );
  }

  // Determine which provider to use
  let providerId = options.provider || context.defaults.provider;

  if (!providerId) {
    throw new Error(
      'No provider specified. Use --provider or configure a default provider.'
    );
  }

  let modelId: string;

  if (options.tag) {
    // --tag: Resolve tag to model using tag registry
    // Support provider:tag syntax (e.g., "openai:gemini", "cody:sonnet")
    let tagToResolve = options.tag;
    let explicitProvider: string | undefined;

    if (options.tag.includes(':')) {
      const parts = options.tag.split(':', 2);
      explicitProvider = parts[0];
      tagToResolve = parts[1];

      // Override providerId if provider:tag syntax is used
      if (explicitProvider) {
        providerId = explicitProvider;
      }
    }

    // Use tag registry if available (fast lookup)
    if (context.tagRegistry) {
      const resolution = context.tagRegistry.resolve(tagToResolve, providerId);

      if (!resolution) {
        throw new Error(
          `Tag '${tagToResolve}' not found in provider '${providerId}'. ` +
            `Run 'anygpt list-tags --provider ${providerId}' to see available tags.`
        );
      }

      providerId = resolution.provider;
      modelId = resolution.model;
    } else {
      // Fallback to old resolution method (for non-factory configs)
      const resolution = resolveModel(
        tagToResolve,
        {
          providers: context.providers,
          aliases: context.defaults.aliases,
          defaultProvider: context.defaults.provider,
        },
        providerId
      );

      if (!resolution) {
        throw new Error(
          `Tag '${tagToResolve}' not found in provider '${providerId}'. ` +
            `Run 'anygpt list-tags --provider ${providerId}' to see available tags.`
        );
      }

      providerId = resolution.provider;
      modelId = resolution.model;
    }

    if (explicitProvider) {
      context.logger.info(`🔗 Resolved tag '${options.tag}' → ${modelId}`);
    } else {
      context.logger.info(
        `🔗 Resolved tag '${tagToResolve}' → ${providerId}:${modelId}`
      );
    }
  } else if (options.model) {
    // --model: Use model name directly (no resolution)
    modelId = options.model;
    context.logger.info(`📌 Using direct model: ${providerId}:${modelId}`);
  } else {
    // No --model or --tag: Use defaults
    modelId =
      context.defaults.providers?.[providerId]?.model || context.defaults.model;

    if (!modelId) {
      throw new Error(
        `No model specified. Use --model <model-name>, --tag <tag>, or configure a default model.\n` +
          `Run 'anygpt list-tags' to see available tags.`
      );
    }

    context.logger.info(`📌 Using default model: ${providerId}:${modelId}`);
  }

  // Verbose mode: show request metrics
  context.logger.info(`📤 Request: provider=${providerId}, model=${modelId}`);
  context.logger.info(`💬 Message length: ${actualMessage.length} chars`);
  context.logger.info(''); // Empty line before response

  try {
    const startTime = Date.now();

    // Resolve model configuration using rule matching
    const providers = context.config?.providers || {};
    const providerConfig = providers[providerId];
    const globalRules = context.defaults?.modelRules;
    const modelConfig = resolveModelConfig(
      modelId,
      providerId,
      providerConfig,
      globalRules
    );

    context.logger.debug('Model config:', {
      model: modelId,
      provider: providerId,
      max_tokens: modelConfig.max_tokens,
      useLegacyMaxTokens: modelConfig.useLegacyMaxTokens,
    });

    const requestParams = {
      provider: providerId,
      model: modelId,
      messages: [{ role: 'user', content: actualMessage }],
      // CLI flag takes precedence over model config
      ...((options.maxTokens || modelConfig.max_tokens) && {
        max_tokens: options.maxTokens || modelConfig.max_tokens,
        useLegacyMaxTokens: modelConfig.useLegacyMaxTokens, // Pass capability flag
      }),
      ...(modelConfig.reasoning && { reasoning: modelConfig.reasoning }),
      ...(modelConfig.extra_body && { extra_body: modelConfig.extra_body }),
    };

    const response = await context.router.chatCompletion(requestParams);

    const duration = Date.now() - startTime;

    const reply = response.choices[0]?.message?.content;
    const finishReason = response.choices[0]?.finish_reason;

    // Debug: Log finish reason if response seems truncated
    if (finishReason && finishReason !== 'stop') {
      context.logger.debug(`⚠️  Finish reason: ${finishReason}`);
    }

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
      context.logger.info(
        `📊 Tokens: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} total`
      );
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
      console.log(
        `📊 Usage: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Enhanced error messages for common issues
    if (errorMessage.includes('422')) {
      throw new Error(
        `Model '${modelId}' not found or not supported by provider '${providerId}'.\n` +
          `\nTroubleshooting:\n` +
          `  1. Run 'anygpt list-tags --provider ${providerId}' to see available tags\n` +
          `  2. Run 'anygpt list-models --provider ${providerId}' to see available models\n` +
          `  3. Use --tag instead of --model if you want tag resolution\n` +
          `\nOriginal error: ${errorMessage}`
      );
    }

    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      throw new Error(
        `Authentication failed for provider '${providerId}'.\n` +
          `Check your API credentials in the configuration.\n` +
          `\nOriginal error: ${errorMessage}`
      );
    }

    throw new Error(`Chat request failed: ${errorMessage}`);
  }
}
