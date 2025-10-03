import { 
  getConversation, 
  findConversationByName, 
  updateConversation,
  updateConversationTokens,
  addMessageToConversation,
  getConversationMessages,
  createConversation
} from '../../utils/conversations.js';
import { setupCLIContext } from '../../utils/cli-context.js';
import { getCurrentConversation, setCurrentConversation } from './state.js';
import type { GenAIRouter } from '@anygpt/router';
import type { ConversationMetadata } from '../../utils/conversations.js';

interface MessageOptions {
  conversation?: string;
}

export async function conversationMessageCommand(
  message: string,
  options: MessageOptions,
  configPath?: string
): Promise<void> {
  let targetConversationId = options.conversation;
  
  // If no conversation specified, use current conversation
  if (!targetConversationId) {
    targetConversationId = await getCurrentConversation() || undefined;
  }
  
  // Use CLI context setup to handle factory configs properly
  const context = await setupCLIContext(configPath);
  
  // Check if provider exists (this will work with both factory and regular configs)
  if (!context.router) {
    throw new Error('Failed to initialize router');
  }
  
  let conversation;
  
  if (!targetConversationId) {
    // Auto-start a new conversation
    console.log('🚀 No active conversation found. Starting a new one...');
    
    const provider = context.defaults.provider;
    const model = context.defaults.model;
    
    if (!provider) {
      throw new Error('No default provider configured. Please configure a default provider or specify --conversation <id>.');
    }
    
    if (!model) {
      throw new Error('No default model configured. Please configure a default model or specify --conversation <id>.');
    }
    
    const name = `${provider}/${model} - ${new Date().toLocaleString()}`;
    targetConversationId = await createConversation(name, provider, model, 'pending');
    
    console.log(`🎯 Started new conversation: ${name}`);
    console.log(`📝 Conversation ID: ${targetConversationId}`);
    
    await setCurrentConversation(targetConversationId);
    conversation = await getConversation(targetConversationId);
  } else {
    conversation = await getConversation(targetConversationId);
    
    // If not found by ID, try to find by name
    if (!conversation) {
      conversation = await findConversationByName(targetConversationId);
    }
    
    if (!conversation) {
      throw new Error(`Conversation '${targetConversationId}' not found`);
    }
  }
  
  // TypeScript assertion: conversation is guaranteed to be non-null here
  const validConversation: ConversationMetadata = conversation!;
  
  console.log(`🔄 ${validConversation.name}`);
  console.log(`👤 ${message}`);
  
  // For now, always use Chat API since that's what the router supports
  // TODO: Add support for Responses API in the router
  await handleChatApi(context.router, validConversation, message);
}

// Note: Responses API support is planned for future implementation
// Currently using Chat API for all conversation interactions

async function handleChatApi(router: GenAIRouter, conversation: ConversationMetadata, message: string): Promise<void> {
  // Get conversation history for context
  const previousMessages = await getConversationMessages(conversation.id);
  
  // Build messages array with full conversation context
  const messages = [
    ...previousMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    })),
    { role: 'user' as const, content: message }
  ];
  
  // Store the user message
  await addMessageToConversation(conversation.id, 'user', message);
  
  // Use Chat Completions with full conversation context
  const response = await router.chatCompletion({
    provider: conversation.provider,
    model: conversation.model,
    messages: messages
  });
  
  const assistantMessage = response.choices[0].message.content || '';
  
  // Update token tracking
  await updateConversationTokens(
    conversation.id,
    response.usage.prompt_tokens || 0,
    response.usage.completion_tokens || 0,
    response.usage.total_tokens
  );
  
  // Get updated conversation for cumulative stats
  const updatedConversation = await getConversation(conversation.id);
  
  console.log(`🤖 ${assistantMessage}`);
  console.log(`📊 Current: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
  console.log(`📈 Total: ${updatedConversation?.inputTokens || 0} input + ${updatedConversation?.outputTokens || 0} output = ${updatedConversation?.totalTokens || 0} tokens`);
  console.log(`💬 Context: ${messages.length} messages (Chat API + local context)`);
  
  // Store the assistant response
  await addMessageToConversation(conversation.id, 'assistant', assistantMessage);
  
  // Update conversation metadata
  await updateConversation(conversation.id, 'chat-with-context');
}
