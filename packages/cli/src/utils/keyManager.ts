import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { generateSecurePassword } from './encryption.js';

const ANYGPT_DIR = join(homedir(), '.anygpt');
const KEY_FILE = join(ANYGPT_DIR, '.encryption-key');

/**
 * Get or create encryption key for conversations
 * Priority: ENV var > stored key file > generate new key
 */
export async function getEncryptionKey(): Promise<string> {
  // 1. Check environment variable first
  const envKey = process.env.ANYGPT_ENCRYPTION_KEY;
  if (envKey) {
    return envKey;
  }

  // 2. Try to load existing key from file
  try {
    const existingKey = await fs.readFile(KEY_FILE, 'utf-8');
    return existingKey.trim();
  } catch {
    // Key file doesn't exist, generate new one
  }

  // 3. Generate new key and store it securely
  const newKey = generateSecurePassword();
  await ensureAnygptDir();
  
  // Write key file with restricted permissions
  await fs.writeFile(KEY_FILE, newKey, { mode: 0o600 });
  
  console.log('🔐 Generated new encryption key for conversation storage');
  console.log('💡 Key stored securely in ~/.anygpt/.encryption-key');
  
  return newKey;
}

/**
 * Check if encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
  return process.env.ANYGPT_NO_ENCRYPTION !== 'true';
}

/**
 * Ensure .anygpt directory exists
 */
async function ensureAnygptDir(): Promise<void> {
  try {
    await fs.mkdir(ANYGPT_DIR, { recursive: true, mode: 0o700 });
  } catch {
    // Directory might already exist
  }
}

/**
 * Reset encryption key (for testing or security reset)
 */
export async function resetEncryptionKey(): Promise<void> {
  try {
    await fs.unlink(KEY_FILE);
    console.log('🔐 Encryption key reset. New key will be generated on next use.');
  } catch {
    console.log('🔐 No encryption key found to reset.');
  }
}
