import { getConversation, getConversationMessages, createConversation, addMessageToConversation } from '../../utils/conversations.js';
import { getCurrentConversation, setCurrentConversation } from './state.js';

interface ForkOptions {
  conversation?: string;
  model?: string;
  provider?: string;
  name?: string;
}

/**
 * Fork a conversation - create a new conversation with the same history
 */
export async function conversationForkCommand(
  options: ForkOptions = {}
): Promise<void> {
  let sourceConversationId = options.conversation;
  
  // If no conversation specified, use current conversation
  if (!sourceConversationId) {
    sourceConversationId = await getCurrentConversation() || undefined;
  }
  
  if (!sourceConversationId) {
    throw new Error('No active conversation. Use --conversation <id> or start a conversation first.');
  }
  
  const sourceConversation = await getConversation(sourceConversationId);
  if (!sourceConversation) {
    throw new Error(`Conversation ${sourceConversationId} not found`);
  }
  
  const messages = await getConversationMessages(sourceConversationId);
  
  // Determine new conversation parameters
  const newProvider = options.provider || sourceConversation.provider;
  const newModel = options.model || sourceConversation.model;
  const newName = options.name || `${sourceConversation.name} (Fork)`;
  
  console.log(`🔀 Forking conversation: ${sourceConversation.name}`);
  console.log(`📊 Copying ${messages.length} messages`);
  console.log(`🤖 Target: ${newProvider}/${newModel}`);
  
  // Create new conversation
  const newConversationId = await createConversation(
    newName,
    newProvider,
    newModel,
    'forked'
  );
  
  // Copy all messages
  for (const message of messages) {
    await addMessageToConversation(
      newConversationId, 
      message.role as 'user' | 'assistant' | 'system', 
      message.content
    );
  }
  
  // Switch to new conversation
  await setCurrentConversation(newConversationId);
  
  console.log('');
  console.log(`✅ Fork created successfully!`);
  console.log(`🆔 New conversation ID: ${newConversationId}`);
  console.log(`🎯 Now active: ${newName}`);
  console.log('');
  console.log('💡 Use cases:');
  console.log('   • Test different models with same context');
  console.log('   • Experiment with different conversation paths');
  console.log('   • Create backups before major changes');
}
