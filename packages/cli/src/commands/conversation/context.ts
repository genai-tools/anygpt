import { getConversation, getConversationMessages } from '../../utils/conversations.js';
import { getCurrentConversation } from './state.js';

interface ContextOptions {
  conversation?: string;
}

/**
 * Show detailed context statistics for a conversation
 */
export async function conversationContextCommand(
  options: ContextOptions = {}
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
  
  // Calculate context statistics
  const stats = calculateContextStats(messages, conversation);
  
  // Display formatted statistics
  displayContextStats(conversation, stats);
}

interface ContextStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  totalCharacters: number;
  estimatedTokens: number;
  averageMessageLength: number;
  longestMessage: number;
  shortestMessage: number;
  conversationAge: string;
  lastActivity: string;
}

function calculateContextStats(messages: any[], conversation: any): ContextStats {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const systemMessages = messages.filter(m => m.role === 'system');
  
  const totalCharacters = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  const messageLengths = messages.map(msg => msg.content.length);
  
  const createdAt = new Date(conversation.createdAt);
  const updatedAt = new Date(conversation.updatedAt);
  const now = new Date();
  
  return {
    totalMessages: messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    systemMessages: systemMessages.length,
    totalCharacters,
    estimatedTokens: Math.ceil(totalCharacters / 4), // Rough estimation
    averageMessageLength: Math.round(totalCharacters / messages.length),
    longestMessage: Math.max(...messageLengths, 0),
    shortestMessage: Math.min(...messageLengths, 0),
    conversationAge: formatDuration(now.getTime() - createdAt.getTime()),
    lastActivity: formatDuration(now.getTime() - updatedAt.getTime())
  };
}

function displayContextStats(conversation: any, stats: ContextStats): void {
  console.log(`📊 Context Statistics for: ${conversation.name}`);
  console.log(`🆔 ID: ${conversation.id}`);
  console.log(`🤖 Provider: ${conversation.provider}/${conversation.model}`);
  console.log('');
  
  // Message breakdown
  console.log('💬 Messages:');
  console.log(`   Total: ${stats.totalMessages}`);
  console.log(`   👤 User: ${stats.userMessages}`);
  console.log(`   🤖 Assistant: ${stats.assistantMessages}`);
  if (stats.systemMessages > 0) {
    console.log(`   ⚙️  System: ${stats.systemMessages}`);
  }
  console.log('');
  
  // Token and cost information
  console.log('🎯 Token Usage:');
  console.log(`   Input tokens: ${conversation.inputTokens || 0}`);
  console.log(`   Output tokens: ${conversation.outputTokens || 0}`);
  console.log(`   Total tokens: ${conversation.totalTokens || 0}`);
  console.log(`   Estimated context: ~${stats.estimatedTokens} tokens`);
  console.log('');
  
  
  // Content statistics
  console.log('📝 Content Analysis:');
  console.log(`   Total characters: ${stats.totalCharacters.toLocaleString()}`);
  console.log(`   Average message: ${stats.averageMessageLength} characters`);
  console.log(`   Longest message: ${stats.longestMessage} characters`);
  console.log(`   Shortest message: ${stats.shortestMessage} characters`);
  console.log('');
  
  // Timing information
  console.log('⏰ Timeline:');
  console.log(`   Conversation age: ${stats.conversationAge}`);
  console.log(`   Last activity: ${stats.lastActivity} ago`);
  console.log(`   Created: ${new Date(conversation.createdAt).toLocaleString()}`);
  console.log(`   Updated: ${new Date(conversation.updatedAt).toLocaleString()}`);
  
  // Context optimization suggestions
  console.log('');
  console.log('💡 Optimization Suggestions:');
  
  if (stats.estimatedTokens > 8000) {
    console.log('   ⚠️  Large context detected - consider using context condensation');
  }
  
  if (stats.totalMessages > 50) {
    console.log('   📉 Long conversation - sliding window optimization could reduce costs');
  }
  
  if ((conversation.totalTokens || 0) > 10000) {
    console.log('   💸 High token usage - monitor costs carefully');
  }
  
  if (stats.averageMessageLength > 500) {
    console.log('   📏 Long messages - consider breaking into smaller interactions');
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}
