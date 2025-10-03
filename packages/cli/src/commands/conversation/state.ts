import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const STATE_FILE = join(homedir(), '.anygpt', 'current-conversation.txt');

export async function setCurrentConversation(conversationId: string): Promise<void> {
  try {
    await fs.mkdir(join(homedir(), '.anygpt'), { recursive: true });
    await fs.writeFile(STATE_FILE, conversationId);
  } catch (error) {
    // Ignore errors for now
  }
}

export async function getCurrentConversation(): Promise<string | null> {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8');
    return content.trim() || null;
  } catch (error) {
    return null;
  }
}

export async function clearCurrentConversation(): Promise<void> {
  try {
    await fs.unlink(STATE_FILE);
  } catch (error) {
    // File might not exist, ignore error
  }
}
