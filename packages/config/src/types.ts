/**
 * Re-export configuration types from @anygpt/types as local aliases to avoid
 * runtime re-export issues when bundling with tsdown/rolldown.
 */

import type {
  ConnectorConfig as BaseConnectorConfig,
  ProviderConfig as BaseProviderConfig,
  AnyGPTConfig as BaseAnyGPTConfig,
  ConfigLoadOptions as BaseConfigLoadOptions
} from '@anygpt/types';

export type ConnectorConfig = BaseConnectorConfig;
export type ProviderConfig = BaseProviderConfig;
export type AnyGPTConfig = BaseAnyGPTConfig;
export type ConfigLoadOptions = BaseConfigLoadOptions;
