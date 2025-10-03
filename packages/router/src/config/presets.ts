/**
 * Built-in presets imported from connector folders
 * Currently focused on OpenAI models only
 */

import type { GatewayProfile } from './types.js';
// Removed OPENAI_PRESETS - simplified architecture

// Simplified - no presets needed with dynamic fallback system
export const BUILTIN_PRESETS: Record<string, GatewayProfile> = {};

// Helper functions for working with presets
export function getPreset(slug: string): GatewayProfile | undefined {
  return BUILTIN_PRESETS[slug];
}

export function listPresets(): GatewayProfile[] {
  return Object.values(BUILTIN_PRESETS);
}

export function getPresetsByProvider(providerType: string): GatewayProfile[] {
  return Object.values(BUILTIN_PRESETS).filter(
    preset => preset.provider.type === providerType
  );
}

export function createCustomPreset(
  basePreset: string,
  overrides: Partial<GatewayProfile>
): GatewayProfile {
  const base = getPreset(basePreset);
  if (!base) {
    throw new Error(`Base preset '${basePreset}' not found`);
  }

  return {
    ...base,
    ...overrides,
    provider: { ...base.provider, ...overrides.provider },
    model: { ...base.model, ...overrides.model },
    parameters: { ...base.parameters, ...overrides.parameters },
    context: { ...base.context, ...overrides.context }
  };
}
