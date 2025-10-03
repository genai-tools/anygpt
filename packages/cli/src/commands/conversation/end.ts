import { getConversation } from '../../utils/conversations.js';
import { getCurrentConversation, clearCurrentConversation } from './state.js';

export async function conversationEndCommand(): Promise<void> {
  const currentId = await getCurrentConversation();
  
  if (!currentId) {
    console.log('❌ No active conversation to end');
    return;
  }
  
  const conversation = await getConversation(currentId);
  if (conversation) {
    console.log(`✅ Ended conversation: ${conversation.name}`);
    console.log(`📊 Messages: ${conversation.messageCount}`);
  }
  
  await clearCurrentConversation();
}
