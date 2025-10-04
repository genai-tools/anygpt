/**
 * Migration utilities for AnyGPT configuration
 */

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { convertCodexToAnyGPTConfig } from './defaults.js';
import { parseCodexToml } from './codex-parser.js';
import type { AnyGPTConfig } from '@anygpt/types';

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Migrate from ~/.codex/config.toml to .anygpt/anygpt.config.ts
 */
export async function migrateFromCodex(targetDir = '.'): Promise<boolean> {
  const codexConfigPath = join(homedir(), '.codex', 'config.toml');
  const anyGPTConfigDir = join(targetDir, '.anygpt');
  const anyGPTConfigPath = join(anyGPTConfigDir, 'anygpt.config.ts');
  
  // Check if codex config exists
  if (!(await fileExists(codexConfigPath))) {
    console.log('No ~/.codex/config.toml found to migrate');
    return false;
  }
  
  // Check if AnyGPT config already exists
  if (await fileExists(anyGPTConfigPath)) {
    console.log('AnyGPT config already exists at .anygpt/anygpt.config.ts');
    return false;
  }
  
  try {
    // Read and parse TOML config
    const tomlContent = await readFile(codexConfigPath, 'utf-8');
    const codexConfig = parseCodexToml(tomlContent);
    
    // Convert to AnyGPT format
    const anyGPTConfig = convertCodexToAnyGPTConfig(codexConfig);
    
    // Create .anygpt directory if it doesn't exist
    try {
      await mkdir(anyGPTConfigDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
    
    // Generate TypeScript config file
    const configContent = generateConfigFile(anyGPTConfig);
    
    // Write the new config
    await writeFile(anyGPTConfigPath, configContent, 'utf-8');
    
    console.log('✅ Successfully migrated ~/.codex/config.toml to .anygpt/anygpt.config.ts');
    console.log('📁 Config location: .anygpt/anygpt.config.ts (git-ignored)');
    console.log('🔒 Your gateway configurations are now private and secure');
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

/**
 * Generate TypeScript config file content
 */
function generateConfigFile(config: AnyGPTConfig): string {
  return `/**
 * AnyGPT Configuration
 * 
 * This file contains sensitive API keys and gateway configurations.
 * It is automatically excluded from git via .gitignore for security.
 * 
 * Migrated from ~/.codex/config.toml
 */

import type { AnyGPTConfig } from '@anygpt/config';

const config: AnyGPTConfig = ${JSON.stringify(config, null, 2)};

export default config;
`;
}

/**
 * CLI command for migration
 */
export async function runMigration(): Promise<void> {
  console.log('🔄 Migrating Codex configuration to AnyGPT...');
  
  const success = await migrateFromCodex();
  
  if (success) {
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the generated .anygpt/anygpt.config.ts file');
    console.log('2. Update any gateway URLs or API keys as needed');
    console.log('3. Test with: npx anygpt chat "Hello!"');
  } else {
    console.log('');
    console.log('Migration not needed or failed.');
    console.log('You can manually create .anygpt/anygpt.config.ts if needed.');
  }
}
