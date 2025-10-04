import { createConversation } from '../../utils/conversations.js';
import { setupCLIContext } from '../../utils/cli-context.js';
import { setCurrentConversation } from './state.js';

interface StartOptions {
  provider?: string;
  model?: string;
  name?: string;
}

export async function conversationStartCommand(
  options: StartOptions,
  configPath?: string
): Promise<void> {
  // Use CLI context setup to handle factory configs properly
  const context = await setupCLIContext(configPath);
  
  // Use provided options or fall back to config defaults
  const provider = options.provider || context.defaults.provider;
  const model = options.model || context.defaults.model;
  
  if (!provider) {
    throw new Error('No provider specified. Either provide --provider or set defaults.provider in config.');
  }
  
  if (!model) {
    throw new Error('No model specified. Either provide --model or set defaults.model in config.');
  }
  
  const name = options.name || `${provider}/${model} - ${new Date().toLocaleString()}`;
  const conversationId = await createConversation(name, provider, model, 'pending');
  
  console.log(`🎯 Started new conversation: ${name}`);
  console.log(`📝 Conversation ID: ${conversationId}`);
  console.log(`💡 Use 'anygpt conversation message "your message"' to chat`);
  
  await setCurrentConversation(conversationId);
}
