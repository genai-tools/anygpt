import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { encrypt, decrypt, type EncryptedData } from './encryption.js';
import { getEncryptionKey, isEncryptionEnabled } from './keyManager.js';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationMetadata {
  id: string;
  name: string;
  provider: string;
  model: string;
  lastResponseId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
}

export interface ConversationStorage {
  conversations: Record<string, ConversationMetadata>;
}

export interface ConversationMessages {
  messages: ConversationMessage[];
}

const CONVERSATIONS_DIR = join(homedir(), '.anygpt');
const CONVERSATIONS_FILE = join(CONVERSATIONS_DIR, 'conversations.json');

function getConversationMessagesFile(conversationId: string): string {
  return join(CONVERSATIONS_DIR, `${conversationId}.messages.json`);
}

/**
 * Ensure the conversations directory exists
 */
async function ensureConversationsDir(): Promise<void> {
  try {
    await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

/**
 * Load conversations from storage
 */
export async function loadConversations(): Promise<ConversationStorage> {
  await ensureConversationsDir();
  
  try {
    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return empty storage
    return { conversations: {} };
  }
}

/**
 * Save conversations to storage
 */
export async function saveConversations(storage: ConversationStorage): Promise<void> {
  await ensureConversationsDir();
  await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(storage, null, 2));
}

/**
 * Create a new conversation
 */
export async function createConversation(
  name: string,
  provider: string,
  model: string,
  responseId: string
): Promise<string> {
  const storage = await loadConversations();
  
  const id = generateConversationId();
  const now = new Date().toISOString();
  
  storage.conversations[id] = {
    id,
    name,
    provider,
    model,
    lastResponseId: responseId,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0
  };
  
  await saveConversations(storage);
  return id;
}

/**
 * Update conversation with new response
 */
export async function updateConversation(
  conversationId: string,
  responseId: string
): Promise<void> {
  const storage = await loadConversations();
  
  if (!storage.conversations[conversationId]) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  storage.conversations[conversationId].lastResponseId = responseId;
  storage.conversations[conversationId].updatedAt = new Date().toISOString();
  storage.conversations[conversationId].messageCount++;
  
  await saveConversations(storage);
}

/**
 * Update conversation with token usage
 */
export async function updateConversationTokens(
  conversationId: string,
  inputTokens: number,
  outputTokens: number,
  totalTokens: number
): Promise<void> {
  const storage = await loadConversations();
  
  if (!storage.conversations[conversationId]) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  const conversation = storage.conversations[conversationId];
  conversation.inputTokens += inputTokens;
  conversation.outputTokens += outputTokens;
  conversation.totalTokens += totalTokens;
  conversation.updatedAt = new Date().toISOString();
  
  await saveConversations(storage);
}

/**
 * Replace all messages in a conversation
 */
export async function replaceConversationMessages(
  conversationId: string,
  newMessages: ConversationMessage[]
): Promise<void> {
  await ensureConversationsDir();
  
  const messagesFile = getConversationMessagesFile(conversationId);
  const conversationMessages: ConversationMessages = { messages: newMessages };
  
  const dataToWrite = JSON.stringify(conversationMessages, null, 2);
  
  if (isEncryptionEnabled()) {
    const key = await getEncryptionKey();
    const encryptedData = encrypt(dataToWrite, key);
    await fs.writeFile(messagesFile, JSON.stringify(encryptedData, null, 2), { mode: 0o600 });
  } else {
    await fs.writeFile(messagesFile, dataToWrite, { mode: 0o600 });
  }
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId: string): Promise<ConversationMetadata | null> {
  const storage = await loadConversations();
  return storage.conversations[conversationId] || null;
}

/**
 * List all conversations
 */
export async function listConversations(): Promise<ConversationMetadata[]> {
  const storage = await loadConversations();
  return Object.values(storage.conversations)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const storage = await loadConversations();
  
  if (!storage.conversations[conversationId]) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  delete storage.conversations[conversationId];
  await saveConversations(storage);
}

/**
 * Generate a unique conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Find conversation by name (partial match)
 */
export async function findConversationByName(name: string): Promise<ConversationMetadata | null> {
  const storage = await loadConversations();
  const conversations = Object.values(storage.conversations);
  
  // Try exact match first
  let found = conversations.find(conv => conv.name.toLowerCase() === name.toLowerCase());
  
  // If no exact match, try partial match
  if (!found) {
    found = conversations.find(conv => 
      conv.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  return found || null;
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(
  conversationId: string, 
  role: 'user' | 'assistant' | 'system', 
  content: string
): Promise<void> {
  await ensureConversationsDir();
  
  const messagesFile = getConversationMessagesFile(conversationId);
  let conversationMessages: ConversationMessages;
  
  try {
    const fileContent = await fs.readFile(messagesFile, 'utf-8');
    
    if (isEncryptionEnabled()) {
      // Try to decrypt existing file
      try {
        const encryptedData: EncryptedData = JSON.parse(fileContent);
        const key = await getEncryptionKey();
        const decryptedContent = decrypt(encryptedData, key);
        conversationMessages = JSON.parse(decryptedContent);
      } catch {
        // Might be plain JSON from before encryption was enabled
        conversationMessages = JSON.parse(fileContent);
      }
    } else {
      conversationMessages = JSON.parse(fileContent);
    }
  } catch {
    // File doesn't exist, create new
    conversationMessages = { messages: [] };
  }
  
  conversationMessages.messages.push({
    role,
    content,
    timestamp: new Date().toISOString()
  });
  
  const dataToWrite = JSON.stringify(conversationMessages, null, 2);
  
  if (isEncryptionEnabled()) {
    const key = await getEncryptionKey();
    const encryptedData = encrypt(dataToWrite, key);
    await fs.writeFile(messagesFile, JSON.stringify(encryptedData, null, 2), { mode: 0o600 });
  } else {
    await fs.writeFile(messagesFile, dataToWrite, { mode: 0o600 });
  }
}

/**
 * Get all messages from a conversation
 */
export async function getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const messagesFile = getConversationMessagesFile(conversationId);
  
  try {
    const fileContent = await fs.readFile(messagesFile, 'utf-8');
    let conversationMessages: ConversationMessages;
    
    if (isEncryptionEnabled()) {
      // Try to decrypt existing file
      try {
        const encryptedData: EncryptedData = JSON.parse(fileContent);
        const key = await getEncryptionKey();
        const decryptedContent = decrypt(encryptedData, key);
        conversationMessages = JSON.parse(decryptedContent);
      } catch {
        // Might be plain JSON from before encryption was enabled
        conversationMessages = JSON.parse(fileContent);
      }
    } else {
      conversationMessages = JSON.parse(fileContent);
    }
    
    return conversationMessages.messages;
  } catch {
    // File doesn't exist, return empty array
    return [];
  }
}

/**
 * Clear all messages from a conversation
 */
export async function clearConversationMessages(conversationId: string): Promise<void> {
  const messagesFile = getConversationMessagesFile(conversationId);
  
  try {
    await fs.unlink(messagesFile);
  } catch {
    // File might not exist, ignore error
  }
}
