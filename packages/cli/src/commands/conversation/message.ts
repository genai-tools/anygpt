import { GenAIGateway } from '@anygpt/router';
import type { GatewayConfig } from '@anygpt/router';
import { 
  getConversation, 
  findConversationByName, 
  updateConversation,
  updateConversationTokens,
  addMessageToConversation,
  getConversationMessages
} from '../../utils/conversations.js';
import { loadConfig } from '../../utils/config.js';
import { getCurrentConversation } from './state.js';

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
  
  if (!targetConversationId) {
    throw new Error('No active conversation. Use --conversation <id> or start a conversation first.');
  }
  
  let conversation = await getConversation(targetConversationId);
  
  // If not found by ID, try to find by name
  if (!conversation) {
    conversation = await findConversationByName(targetConversationId);
  }
  
  if (!conversation) {
    throw new Error(`Conversation '${targetConversationId}' not found`);
  }
  
  // Load config
  const config: GatewayConfig = await loadConfig(configPath);
  
  if (!config.providers?.[conversation.provider]) {
    throw new Error(`Provider '${conversation.provider}' not found in config`);
  }
  
  const gateway = new GenAIGateway(config);
  
  console.log(`🔄 ${conversation.name}`);
  console.log(`👤 ${message}`);
  
  const providerConfig = config.providers[conversation.provider];
  const wireApi = providerConfig.wireApi || 'chat';
  
  if (wireApi === 'responses') {
    // Use Responses API directly (stateful)
    await handleResponsesApi(gateway, conversation, message);
  } else {
    // Use Chat API with local context management (stateful via message history)
    await handleChatApi(gateway, conversation, message);
  }
}

async function handleResponsesApi(gateway: any, conversation: any, message: string): Promise<void> {
  if (conversation.lastResponseId === 'pending') {
    // First message - start new response conversation
    const response = await gateway.response({
      provider: conversation.provider,
      model: conversation.model,
      input: message
    });
    
    // Extract text from response output
    const outputText = response.output
      .filter((item: any) => item.type === 'message')
      .flatMap((item: any) => item.content || [])
      .filter((content: any) => content.type === 'output_text')
      .map((content: any) => content.text)
      .join('');
    
    console.log(`🤖 ${outputText}`);
    console.log(`📊 Tokens: ${response.usage.total_tokens}`);
    console.log(`🔗 Using Responses API (stateful)`);
    
    // Update conversation with response ID for continuation
    await updateConversation(conversation.id, response.id);
    
  } else {
    // Continue existing response conversation
    const response = await gateway.response({
      provider: conversation.provider,
      model: conversation.model,
      input: message,
      previous_response_id: conversation.lastResponseId
    });
    
    // Extract text from response output
    const outputText = response.output
      .filter((item: any) => item.type === 'message')
      .flatMap((item: any) => item.content || [])
      .filter((content: any) => content.type === 'output_text')
      .map((content: any) => content.text)
      .join('');
    
    console.log(`🤖 ${outputText}`);
    console.log(`📊 Tokens: ${response.usage.total_tokens}`);
    console.log(`🔗 Using Responses API (stateful)`);
    
    // Update conversation with new response ID
    await updateConversation(conversation.id, response.id);
  }
}

async function handleChatApi(gateway: any, conversation: any, message: string): Promise<void> {
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
  const response = await gateway.chatCompletion({
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
