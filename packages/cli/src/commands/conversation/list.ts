import { listConversations } from '../../utils/conversations.js';
import { getCurrentConversation } from './state.js';

export async function conversationListCommand(): Promise<void> {
  const conversations = await listConversations();
  
  if (conversations.length === 0) {
    console.log('📭 No conversations found');
    return;
  }
  
  const currentId = await getCurrentConversation();
  
  console.log('📋 Conversations:');
  console.log('');
  
  for (const conv of conversations) {
    const isActive = conv.id === currentId ? '🟢' : '⚪';
    const updatedAt = new Date(conv.updatedAt).toLocaleString();
    
    console.log(`${isActive} ${conv.name}`);
    console.log(`   ID: ${conv.id}`);
    console.log(`   Provider: ${conv.provider}/${conv.model}`);
    console.log(`   Messages: ${conv.messageCount}`);
    console.log(`   Tokens: ${conv.totalTokens || 0} total (${conv.inputTokens || 0} input, ${conv.outputTokens || 0} output)`);
    console.log(`   Updated: ${updatedAt}`);
    console.log('');
  }
}
