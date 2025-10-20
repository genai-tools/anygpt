import { ChatLoop } from '../chat-loop/index.js';
import { AIProvider } from '@anygpt/ai-provider';
import type { CLIContext } from '../utils/cli-context.js';
import type { Message } from '../chat-loop/types.js';

interface ChatInteractiveOptions {
  echo?: boolean;
  model?: string;
  provider?: string;
}

/**
 * Start an interactive chat session with AI
 */
export async function chatInteractiveCommand(
  context: CLIContext,
  options: ChatInteractiveOptions
) {
  const chatLoop = new ChatLoop();

  // Determine provider and model (same logic as chat command)
  let providerId = options.provider || context.defaults.provider || 'openai';
  let modelId: string;

  if (options.model) {
    // Explicit model specified
    modelId = options.model;
  } else {
    // Use defaults - check for tag first, then model
    const defaultTag = context.defaults.providers?.[providerId]?.tag;
    const defaultModel = context.defaults.providers?.[providerId]?.model || context.defaults.model;

    if (defaultTag && context.tagRegistry) {
      // Resolve tag to model
      const resolution = context.tagRegistry.resolve(defaultTag, providerId || undefined);
      if (resolution) {
        providerId = resolution.provider;
        modelId = resolution.model;
        context.logger.info(`🔗 Resolved tag '${defaultTag}' → ${modelId}`);
      } else {
        throw new Error(`Could not resolve tag '${defaultTag}' for provider '${providerId}'`);
      }
    } else if (defaultModel) {
      modelId = defaultModel;
    } else {
      throw new Error('No model specified. Use --model or configure a default model/tag.');
    }
  }

  console.log('🤖 Interactive AI Chat');
  console.log(`Provider: ${providerId}`);
  console.log(`Model: ${modelId}`);
  console.log('Type /help for commands, /exit to quit.\n');

  // Create AI provider
  const aiProvider = new AIProvider(context.router, {
    provider: providerId,
    model: modelId,
  });

  await chatLoop.start({
    prompt: '💬 ',
    maxHistory: 50,
    onMessage: async (message: string) => {
      // Echo mode for testing
      if (options.echo) {
        return `Echo: ${message}`;
      }

      try {
        // Get conversation history
        const history = chatLoop.getHistory();

        // Convert to AI provider format
        const messages: Array<{
          role: 'system' | 'user' | 'assistant';
          content: string;
        }> = history.map((msg: Message) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }));

        // Debug: Show conversation history
        context.logger.debug(`Sending ${messages.length} messages to AI:`);
        messages.forEach((msg, i) => {
          context.logger.debug(`  [${i}] ${msg.role}: ${msg.content.substring(0, 50)}...`);
        });

        // Call AI
        const response = await aiProvider.chat({ messages });

        // Log token usage
        context.logger.info(
          `📊 Tokens: ${response.usage.promptTokens} input + ${response.usage.completionTokens} output = ${response.usage.totalTokens} total`
        );

        return response.message;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        context.logger.error(`AI Error: ${errorMsg}`);
        return `❌ Error: ${errorMsg}`;
      }
    },
  });

  console.log('\n👋 Chat ended. Goodbye!');
}
