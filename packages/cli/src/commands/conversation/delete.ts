import { getConversation, findConversationByName, deleteConversation } from '../../utils/conversations.js';
import { getCurrentConversation, clearCurrentConversation } from './state.js';

export async function conversationDeleteCommand(conversationIdentifier: string): Promise<void> {
  let conversation = await getConversation(conversationIdentifier);
  
  // If not found by ID, try to find by name
  if (!conversation) {
    conversation = await findConversationByName(conversationIdentifier);
  }
  
  if (!conversation) {
    throw new Error(`Conversation '${conversationIdentifier}' not found`);
  }
  
  await deleteConversation(conversation.id);
  
  // Clear current conversation if it was the deleted one
  const currentId = await getCurrentConversation();
  if (currentId === conversation.id) {
    await clearCurrentConversation();
  }
  
  console.log(`🗑️ Deleted conversation: ${conversation.name}`);
}
