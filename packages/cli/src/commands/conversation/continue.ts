import { getConversation, findConversationByName } from '../../utils/conversations.js';
import { setCurrentConversation } from './state.js';

export async function conversationContinueCommand(conversationIdentifier: string): Promise<void> {
  let conversation = await getConversation(conversationIdentifier);
  
  // If not found by ID, try to find by name
  if (!conversation) {
    conversation = await findConversationByName(conversationIdentifier);
  }
  
  if (!conversation) {
    throw new Error(`Conversation '${conversationIdentifier}' not found`);
  }
  
  await setCurrentConversation(conversation.id);
  
  console.log(`🔄 Switched to conversation: ${conversation.name}`);
  console.log(`📝 ID: ${conversation.id}`);
  console.log(`🤖 Provider: ${conversation.provider}/${conversation.model}`);
  console.log(`📊 Messages: ${conversation.messageCount}`);
}
