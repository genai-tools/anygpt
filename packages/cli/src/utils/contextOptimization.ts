import type { ConversationMessage } from './conversations.js';

export interface ContextOptimizationOptions {
  maxTokens?: number;
  strategy?: 'sliding-window' | 'summarization' | 'semantic-compression';
  windowSize?: number;
}

/**
 * Optimize conversation context to reduce token usage
 */
export function optimizeContext(
  messages: ConversationMessage[],
  options: ContextOptimizationOptions = {}
): ConversationMessage[] {
  const { 
    maxTokens = 4000, 
    strategy = 'sliding-window', 
    windowSize = 10 
  } = options;

  switch (strategy) {
    case 'sliding-window':
      return slidingWindowOptimization(messages, windowSize);
    
    case 'summarization':
      return summarizationOptimization(messages, maxTokens);
    
    case 'semantic-compression':
      return semanticCompression(messages);
    
    default:
      return messages;
  }
}

/**
 * Keep only the most recent N messages
 */
function slidingWindowOptimization(
  messages: ConversationMessage[], 
  windowSize: number
): ConversationMessage[] {
  if (messages.length <= windowSize) {
    return messages;
  }

  // Keep first message (often contains important context like name)
  const firstMessage = messages[0];
  const recentMessages = messages.slice(-windowSize + 1);
  
  return [firstMessage, ...recentMessages];
}

/**
 * Create a summary of older messages
 */
function summarizationOptimization(
  messages: ConversationMessage[], 
  maxTokens: number
): ConversationMessage[] {
  // Rough estimation: 4 chars per token
  const estimatedTokens = messages.reduce((sum, msg) => 
    sum + Math.ceil(msg.content.length / 4), 0
  );

  if (estimatedTokens <= maxTokens) {
    return messages;
  }

  // Keep recent messages, summarize older ones
  const recentCount = Math.floor(maxTokens * 0.7 / 100); // Keep 70% for recent
  const recentMessages = messages.slice(-recentCount);
  const olderMessages = messages.slice(0, -recentCount);

  // Create summary of older messages
  const summary = createSummary(olderMessages);
  
  return [
    {
      role: 'system',
      content: `[Previous conversation summary: ${summary}]`,
      timestamp: new Date().toISOString()
    },
    ...recentMessages
  ];
}

/**
 * Remove redundant content and compress semantically
 */
function semanticCompression(messages: ConversationMessage[]): ConversationMessage[] {
  return messages.map(msg => ({
    ...msg,
    content: compressMessage(msg.content)
  }));
}

/**
 * Create a summary of multiple messages
 */
function createSummary(messages: ConversationMessage[]): string {
  const keyPoints: string[] = [];
  
  // Extract user name if mentioned
  const nameMatch = messages.find(msg => 
    msg.content.toLowerCase().includes('my name is') || 
    msg.content.toLowerCase().includes('i am')
  );
  if (nameMatch) {
    const name = extractName(nameMatch.content);
    if (name) keyPoints.push(`User is ${name}`);
  }

  // Extract main topics discussed
  const topics = extractTopics(messages);
  if (topics.length > 0) {
    keyPoints.push(`Discussed: ${topics.join(', ')}`);
  }

  // Count interactions
  keyPoints.push(`${messages.length} previous exchanges`);

  return keyPoints.join('. ');
}

/**
 * Extract name from message content
 */
function extractName(content: string): string | null {
  const patterns = [
    /my name is (\w+)/i,
    /i am (\w+)/i,
    /call me (\w+)/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract main topics from conversation
 */
function extractTopics(messages: ConversationMessage[]): string[] {
  const topics = new Set<string>();
  const keywords = [
    'programming', 'code', 'token', 'conversation', 'AI', 'model',
    'encryption', 'security', 'database', 'API', 'configuration'
  ];

  messages.forEach(msg => {
    keywords.forEach(keyword => {
      if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
        topics.add(keyword);
      }
    });
  });

  return Array.from(topics).slice(0, 5); // Limit to top 5 topics
}

/**
 * Compress individual message content
 */
function compressMessage(content: string): string {
  return content
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove common filler words in responses
    .replace(/\b(um|uh|well|you know|like)\b/gi, '')
    // Compress common phrases
    .replace(/How can I assist you today\?/gi, 'How can I help?')
    .replace(/Is there anything else I can help you with\?/gi, 'Anything else?')
    .trim();
}
