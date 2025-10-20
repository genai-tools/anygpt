import { ChatLoop } from '../chat-loop/index.js';
import type { CLIContext } from '../utils/cli-context.js';

interface ChatInteractiveOptions {
  echo?: boolean;
}

/**
 * Start an interactive chat session (demo of chat loop)
 */
export async function chatInteractiveCommand(
  context: CLIContext,
  options: ChatInteractiveOptions
) {
  const chatLoop = new ChatLoop();

  console.log('🤖 Interactive Chat Demo');
  console.log('This is a demo of the chat loop foundation.');
  console.log('Type /help for commands, /exit to quit.\n');

  await chatLoop.start({
    prompt: '💬 ',
    maxHistory: 50,
    onMessage: async (message: string) => {
      // For now, just echo back
      // In future features, this will call AI providers
      if (options.echo) {
        return `Echo: ${message}`;
      }
      return `You said: "${message}"\n(AI integration coming in Feature 5-2!)`;
    },
  });

  console.log('\n👋 Chat ended. Goodbye!');
}
