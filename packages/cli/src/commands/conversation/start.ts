import { createConversation } from '../../utils/conversations.js';
import { loadConfig } from '../../utils/config.js';
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
  // Load config to get defaults
  const config = await loadConfig(configPath) as any;
  
  // Use provided options or fall back to config defaults
  const provider = options.provider || config.defaultProvider;
  const model = options.model || config.defaultModel;
  
  if (!provider) {
    throw new Error('No provider specified. Either provide --provider or set model_provider in config.');
  }
  
  if (!model) {
    throw new Error('No model specified. Either provide --model or set model in config.');
  }
  
  const name = options.name || `${provider}/${model} - ${new Date().toLocaleString()}`;
  const conversationId = await createConversation(name, provider, model, 'pending');
  
  console.log(`🎯 Started new conversation: ${name}`);
  console.log(`📝 Conversation ID: ${conversationId}`);
  console.log(`💡 Use 'anygpt conversation message "your message"' to chat`);
  
  await setCurrentConversation(conversationId);
}
