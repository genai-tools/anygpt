import type { CodexConfig, CodexProviderConfig } from './defaults.js';

function parsePrimitive(value: string): unknown {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (value === '{}') {
    return {};
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue) && value.trim() !== '') {
    return numericValue;
  }

  return value;
}

export function parseCodexToml(content: string): CodexConfig {
  const codexConfig: CodexConfig = {};
  const providerConfigs: Record<string, CodexProviderConfig> = {};

  let currentProviderId: string | null = null;

  for (const rawLine of content.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentProviderId = null;
      const section = trimmed.slice(1, -1);

      if (section.startsWith('model_providers.')) {
        const providerId = section.slice('model_providers.'.length);
        currentProviderId = providerId;
        if (!providerConfigs[providerId]) {
          providerConfigs[providerId] = {};
        }
      }
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const cleanValue = rawValue.replace(/^['"]|['"]$/g, '');
    const parsedValue = parsePrimitive(cleanValue);

    if (currentProviderId) {
      const providerConfig = providerConfigs[currentProviderId];
      providerConfig[key] = parsedValue;
      continue;
    }

    if (key === 'model' && typeof parsedValue === 'string') {
      codexConfig.model = parsedValue;
    } else if (key === 'model_provider' && typeof parsedValue === 'string') {
      codexConfig.model_provider = parsedValue;
    } else if (key === 'model_providers') {
      // ignore section marker; actual provider values handled via sections
      continue;
    } else {
      codexConfig[key] = parsedValue;
    }
  }

  if (Object.keys(providerConfigs).length > 0) {
    codexConfig.model_providers = providerConfigs;
  }

  return codexConfig;
}
