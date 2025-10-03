import { getConversation, getConversationMessages } from '../../utils/conversations.js';
import { getCurrentConversation } from './state.js';

interface ShowOptions {
  conversation?: string;
  limit?: number;
  format?: 'full' | 'compact' | 'json';
}

/**
 * Show full conversation history
 */
export async function conversationShowCommand(
  options: ShowOptions = {}
): Promise<void> {
  let targetConversationId = options.conversation;
  
  // If no conversation specified, use current conversation
  if (!targetConversationId) {
    targetConversationId = await getCurrentConversation() || undefined;
  }
  
  if (!targetConversationId) {
    throw new Error('No active conversation. Use --conversation <id> or start a conversation first.');
  }
  
  const conversation = await getConversation(targetConversationId);
  if (!conversation) {
    throw new Error(`Conversation ${targetConversationId} not found`);
  }
  
  const messages = await getConversationMessages(targetConversationId);
  
  if (messages.length === 0) {
    console.log('📭 No messages in this conversation yet');
    return;
  }
  
  // Apply limit if specified
  const displayMessages = options.limit ? messages.slice(-options.limit) : messages;
  const format = options.format || 'full';
  
  // Show conversation header
  console.log(`💬 Conversation: ${conversation.name}`);
  console.log(`🆔 ID: ${conversation.id}`);
  console.log(`🤖 Provider: ${conversation.provider}/${conversation.model}`);
  console.log(`📊 Messages: ${messages.length} total${options.limit ? ` (showing last ${displayMessages.length})` : ''}`);
  console.log(`🎯 Tokens: ${conversation.totalTokens || 0} total`);
  console.log('');
  
  if (format === 'json') {
    console.log(JSON.stringify(displayMessages, null, 2));
    return;
  }
  
  // Display messages
  console.log('📝 Messages:');
  console.log('─'.repeat(80));
  
  displayMessages.forEach((message, index) => {
    const messageNumber = options.limit ? 
      messages.length - displayMessages.length + index + 1 : 
      index + 1;
    
    const timestamp = new Date(message.timestamp).toLocaleString();
    const roleIcon = getRoleIcon(message.role);
    const roleName = message.role.toUpperCase();
    
    if (format === 'compact') {
      // Compact format - one line per message
      const preview = message.content.length > 100 ? 
        message.content.substring(0, 100) + '...' : 
        message.content;
      console.log(`${messageNumber}. ${roleIcon} [${roleName}] ${preview}`);
    } else {
      // Full format - complete messages
      console.log(`${messageNumber}. ${roleIcon} ${roleName} (${timestamp})`);
      console.log('');
      
      // Handle long messages with proper formatting
      const content = message.content;
      if (content.length > 500) {
        // For very long messages, add some formatting
        const lines = content.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            console.log(`   ${line}`);
          } else {
            console.log('');
          }
        });
      } else {
        // For shorter messages, simple indentation
        const lines = content.split('\n');
        lines.forEach(line => console.log(`   ${line}`));
      }
      
      console.log('');
      console.log('─'.repeat(80));
    }
  });
  
  // Show summary
  if (format !== 'compact') {
    console.log('');
    console.log('📈 Summary:');
    console.log(`   Total messages: ${messages.length}`);
    console.log(`   User messages: ${messages.filter(m => m.role === 'user').length}`);
    console.log(`   Assistant messages: ${messages.filter(m => m.role === 'assistant').length}`);
    console.log(`   System messages: ${messages.filter(m => m.role === 'system').length}`);
    console.log(`   Total characters: ${messages.reduce((sum, m) => sum + m.content.length, 0).toLocaleString()}`);
    console.log(`   Estimated tokens: ~${Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4)}`);
    
    if (conversation.totalTokens > 0) {
      console.log(`   Actual tokens used: ${conversation.totalTokens}`);
    }
  }
}

function getRoleIcon(role: string): string {
  switch (role) {
    case 'user': return '👤';
    case 'assistant': return '🤖';
    case 'system': return '⚙️';
    default: return '❓';
  }
}
