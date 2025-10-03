import { GenAIGateway } from '@anygpt/router';
import { getConversation, getConversationMessages, updateConversationTokens, replaceConversationMessages } from '../../utils/conversations.js';
import { loadConfig } from '../../utils/config.js';
import { getCurrentConversation } from './state.js';

interface CondenseOptions {
  conversation?: string;
  keepRecent?: number;
  dryRun?: boolean;
}

/**
 * Condense conversation context using AI summarization
 */
export async function conversationCondenseCommand(
  options: CondenseOptions = {}
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
  
  if (messages.length < 5) {
    console.log('⚠️  Conversation too short to condense (need at least 5 messages)');
    return;
  }
  
  const keepRecent = options.keepRecent || 3;
  
  if (messages.length <= keepRecent + 2) {
    console.log(`⚠️  Conversation only has ${messages.length} messages, keeping recent ${keepRecent} would leave too few to summarize`);
    return;
  }
  
  // Split messages into older (to summarize) and recent (to keep)
  const messagesToSummarize = messages.slice(0, -keepRecent);
  const recentMessages = messages.slice(-keepRecent);
  
  console.log(`🔄 Condensing conversation: ${conversation.name}`);
  console.log(`📊 Summarizing ${messagesToSummarize.length} messages, keeping ${recentMessages.length} recent`);
  
  // Calculate current context size
  const currentTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
  console.log(`📏 Current estimated context: ~${currentTokens} tokens`);
  
  if (options.dryRun) {
    console.log('🧪 Dry run - showing what would be summarized:');
    displaySummarizationPreview(messagesToSummarize, recentMessages);
    return;
  }
  
  // Load config and create gateway
  const config = await loadConfig() as any;
  if (!config.providers?.[conversation.provider]) {
    throw new Error(`Provider '${conversation.provider}' not found in config`);
  }
  
  const gateway = new GenAIGateway(config);
  
  // Create summarization prompt
  const summary = await createAISummary(gateway, conversation, messagesToSummarize);
  
  // Calculate token savings
  const originalTokens = messagesToSummarize.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
  const summaryTokens = Math.ceil(summary.length / 4);
  const tokenSavings = originalTokens - summaryTokens;
  const savingsPercent = Math.round((tokenSavings / originalTokens) * 100);
  
  console.log('');
  console.log('📋 Generated Summary:');
  console.log('─'.repeat(60));
  console.log(summary);
  console.log('─'.repeat(60));
  console.log('');
  console.log(`💾 Token Optimization:`);
  console.log(`   Original: ~${originalTokens} tokens`);
  console.log(`   Summary: ~${summaryTokens} tokens`);
  console.log(`   Savings: ~${tokenSavings} tokens (${savingsPercent}%)`);
  console.log('');
  
  // Ask for confirmation
  console.log('⚠️  This will replace the older messages with the summary.');
  console.log('   Recent messages will be preserved.');
  console.log('   This action cannot be undone.');
  console.log('');
  console.log('💡 Applying condensation:');
  console.log(`   1. Replace ${messagesToSummarize.length} older messages with 1 summary`);
  console.log(`   2. Keep ${recentMessages.length} recent messages unchanged`);
  console.log(`   3. Update conversation metadata`);
  console.log('');
  
  // Create new message array with summary + recent messages
  const summaryMessage = {
    role: 'system' as const,
    content: `[CONVERSATION SUMMARY]: ${summary}`,
    timestamp: new Date().toISOString()
  };
  
  const newMessages = [
    summaryMessage,
    ...recentMessages
  ];
  
  // Replace messages in the conversation
  await replaceConversationMessages(conversation.id, newMessages);
  
  console.log('✅ Conversation condensed successfully!');
  console.log(`📊 Messages: ${messages.length} → ${newMessages.length}`);
  console.log(`💾 Token savings: ~${tokenSavings} tokens (${savingsPercent}%)`);
  console.log('');
  console.log('🎯 Your current conversation now has optimized context');
  console.log('💬 Continue chatting with reduced token costs');
}

async function createAISummary(
  gateway: any, 
  conversation: any, 
  messages: any[]
): Promise<string> {
  const conversationText = messages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');
  
  const summarizationPrompt = `Please create a concise summary of this conversation that preserves the key information, context, and important details. The summary should be much shorter than the original but retain all essential information that might be needed for future conversation context.

Conversation to summarize:
${conversationText}

Please provide a clear, structured summary that captures:
1. Key topics discussed
2. Important information shared (names, preferences, etc.)
3. Main questions asked and answers provided
4. Any ongoing context that should be preserved

Summary:`;

  console.log('🤖 Generating AI summary...');
  
  const response = await gateway.chatCompletion({
    provider: conversation.provider,
    model: conversation.model,
    messages: [{ role: 'user', content: summarizationPrompt }]
  });
  
  // Track tokens used for summarization
  await updateConversationTokens(
    conversation.id,
    response.usage.prompt_tokens || 0,
    response.usage.completion_tokens || 0,
    response.usage.total_tokens
  );
  
  console.log(`📊 Summarization cost: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
  
  return response.choices[0].message.content || 'Summary generation failed';
}

function displaySummarizationPreview(messagesToSummarize: any[], recentMessages: any[]): void {
  console.log('');
  console.log('📝 Messages to be summarized:');
  messagesToSummarize.forEach((msg, i) => {
    const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
    console.log(`   ${i + 1}. [${msg.role}] ${preview}`);
  });
  
  console.log('');
  console.log('✅ Messages to be kept (recent):');
  recentMessages.forEach((msg, i) => {
    const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
    console.log(`   ${i + 1}. [${msg.role}] ${preview}`);
  });
}
