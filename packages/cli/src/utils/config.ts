import { existsSync } from 'fs';
import { extname } from 'path';
import { pathToFileURL } from 'url';
import type { RouterConfig } from '@anygpt/router';

// Extensions that Node.js can import as modules
const IMPORTABLE_EXTENSIONS = ['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx'];

function isImportableModule(ext: string): boolean {
  return IMPORTABLE_EXTENSIONS.includes(ext);
}

export async function loadConfig(configPath?: string): Promise<RouterConfig> {
  if (configPath) {
    // Use specific path if provided
    return await loadConfigFromPath(configPath);
  }

  // No config specified - use default hardcoded config
  return getDefaultConfig();
}

async function loadConfigFromPath(path: string): Promise<RouterConfig> {
  // First, check if it's a file path
  if (existsSync(path)) {
    return await loadConfigFromFilePath(path);
  }

  // If not a file, try as module path
  try {
    const module = await import(path);
    return module.default || module;
  } catch {
    console.error('Error loading config');
    throw new Error('Failed to load config');
  }
}

async function loadConfigFromFilePath(path: string): Promise<RouterConfig> {
  const ext = extname(path);
  if (ext === '.json') {
    // Use modern JSON import with assertion
    const fileUrl = pathToFileURL(path).href;
    const module = await import(fileUrl, { with: { type: 'json' } });
    return module.default;
  } else if (isImportableModule(ext) || !ext) {
    // Dynamic import for any importable module or extensionless files
    const fileUrl = pathToFileURL(path).href;
    const module = await import(fileUrl);
    return module.default || module;
  }

  throw new Error(`Unsupported config file extension: ${ext}`);
}

function getDefaultConfig(): RouterConfig {
  // Return default config if no file found
  return {
    providers: {
      openai: {
        type: 'openai',
        api: {
          url: 'https://api.openai.com/v1',
          token: process.env.OPENAI_API_KEY,
        },
      },
    },
  };
}
