import { existsSync, readFileSync } from 'fs';
import { extname, join } from 'path';
import { pathToFileURL } from 'url';
import { homedir } from 'os';
import * as TOML from '@iarna/toml';
import type { RouterConfig } from '@anygpt/router';

// Extensions that Node.js can import as modules
const IMPORTABLE_EXTENSIONS = ['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx'];

function isImportableModule(ext: string): boolean {
  return IMPORTABLE_EXTENSIONS.includes(ext);
}

// Codex-style TOML configuration interface
interface CodexConfig {
  model?: string;
  model_provider?: string;
  model_providers?: {
    [key: string]: {
      name?: string;
      base_url: string;
      env_key?: string;
      wire_api?: 'chat' | 'responses';
      query_params?: Record<string, string>;
    };
  };
}

export async function loadConfig(configPath?: string): Promise<RouterConfig> {
  if (configPath) {
    // Use specific path if provided
    return await loadConfigFromPath(configPath);
  }

  // Try to load Codex-style config from ~/.codex/config.toml
  const codexConfigPath = join(homedir(), '.codex', 'config.toml');
  if (existsSync(codexConfigPath)) {
    return await loadCodexConfig(codexConfigPath);
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
  if (ext === '.toml') {
    return await loadCodexConfig(path);
  } else if (ext === '.json') {
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

async function loadCodexConfig(path: string): Promise<RouterConfig> {
  try {
    const content = readFileSync(path, 'utf-8');
    const codexConfig = TOML.parse(content) as CodexConfig;
    
    return convertCodexToRouterConfig(codexConfig);
  } catch (error) {
    throw new Error(`Failed to load Codex config from ${path}: ${error instanceof Error ? error.message : error}`);
  }
}

function convertCodexToRouterConfig(codexConfig: CodexConfig): RouterConfig & { defaultModel?: string; defaultProvider?: string } {
  const providers: RouterConfig['providers'] = {};
  
  if (codexConfig.model_providers) {
    for (const [providerId, providerConfig] of Object.entries(codexConfig.model_providers)) {
      // Get API token from environment variable if specified
      let token: string | undefined;
      if (providerConfig.env_key) {
        token = process.env[providerConfig.env_key];
        if (!token) {
          console.warn(`Warning: Environment variable ${providerConfig.env_key} not set for provider ${providerId}`);
        }
      }
      // If no env_key is specified, don't require a token at all
      
      // Convert base_url to our format (remove /chat/completions if present)
      let baseUrl = providerConfig.base_url;
      if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.slice(0, -'/chat/completions'.length);
      }
      
      providers[providerId] = {
        type: 'openai', // Assume OpenAI-compatible for now
        api: {
          url: baseUrl,
          ...(token !== undefined && { token }) // Only include token if it's defined
        },
        // Pass through wire_api setting
        wireApi: providerConfig.wire_api || 'chat'
      };
    }
  }
  
  return { 
    providers,
    // Include defaults from TOML config
    defaultModel: codexConfig.model,
    defaultProvider: codexConfig.model_provider
  };
}


function getDefaultConfig(): RouterConfig {
  // Return default config if no file found
  return {
    providers: {
      openai: {
        type: 'openai',
        api: {
          url: 'https://api.openai.com/v1',
          token: process.env.OPENAI_API_KEY
        }
      }
    }
  };
}

