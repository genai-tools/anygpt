import { GenAIGateway } from '@anygpt/router';
import { getConversation, getConversationMessages, createConversation, addMessageToConversation } from '../../utils/conversations.js';
import { loadConfig } from '../../utils/config.js';
import { getCurrentConversation, setCurrentConversation } from './state.js';

interface SummarizeOptions {
  conversation?: string;
  keepRecent?: number;
  model?: string;
  provider?: string;
  name?: string;
  dryRun?: boolean;
}

/**
 * Create a new conversation with AI-generated summary of older messages
 */
export async function conversationSummarizeCommand(
  options: SummarizeOptions = {}
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
  
  if (messages.length < 5) {
    console.log('⚠️  Conversation too short to summarize (need at least 5 messages)');
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
  
  console.log(`📝 Summarizing conversation: ${sourceConversation.name}`);
  console.log(`📊 Summarizing ${messagesToSummarize.length} messages, keeping ${recentMessages.length} recent`);
  
  // Calculate current context size
  const originalTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
  console.log(`📏 Original estimated context: ~${originalTokens} tokens`);
  
  if (options.dryRun) {
    console.log('🧪 Dry run - showing what would be summarized:');
    displaySummarizationPreview(messagesToSummarize, recentMessages);
    return;
  }
  
  // Load config and create gateway
  const config = await loadConfig() as any;
  if (!config.providers?.[sourceConversation.provider]) {
    throw new Error(`Provider '${sourceConversation.provider}' not found in config`);
  }
  
  const gateway = new GenAIGateway(config);
  
  // Create AI summary
  const summary = await createAISummary(gateway, sourceConversation, messagesToSummarize);
  
  // Calculate token savings
  const summaryTokens = Math.ceil(summary.length / 4);
  const recentTokens = recentMessages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
  const newTotalTokens = summaryTokens + recentTokens;
  const tokenSavings = originalTokens - newTotalTokens;
  const savingsPercent = Math.round((tokenSavings / originalTokens) * 100);
  
  console.log('');
  console.log('📋 Generated Summary:');
  console.log('─'.repeat(60));
  console.log(summary);
  console.log('─'.repeat(60));
  console.log('');
  console.log(`💾 Token Optimization:`);
  console.log(`   Original: ~${originalTokens} tokens`);
  console.log(`   New total: ~${newTotalTokens} tokens (${summaryTokens} summary + ${recentTokens} recent)`);
  console.log(`   Savings: ~${tokenSavings} tokens (${savingsPercent}%)`);
  console.log('');
  
  // Determine new conversation parameters
  const newProvider = options.provider || sourceConversation.provider;
  const newModel = options.model || sourceConversation.model;
  const newName = options.name || `${sourceConversation.name} (Summarized)`;
  
  // Create new conversation
  console.log(`🆕 Creating new conversation: ${newName}`);
  const newConversationId = await createConversation(
    newName,
    newProvider,
    newModel,
    'summarized'
  );
  
  // Add summary as system message
  await addMessageToConversation(
    newConversationId,
    'system',
    `[CONVERSATION SUMMARY]: ${summary}`
  );
  
  // Copy recent messages
  for (const message of recentMessages) {
    await addMessageToConversation(
      newConversationId,
      message.role as 'user' | 'assistant' | 'system',
      message.content
    );
  }
  
  // Switch to new conversation
  await setCurrentConversation(newConversationId);
  
  console.log('');
  console.log(`✅ Summarized conversation created!`);
  console.log(`🆔 New conversation ID: ${newConversationId}`);
  console.log(`🎯 Now active: ${newName}`);
  console.log(`💰 Token savings: ${savingsPercent}% reduction`);
  console.log('');
  console.log('💡 Original conversation preserved unchanged');
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
