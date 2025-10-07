import type { BaseConnectorConfig } from '@anygpt/types';

/**
 * Connection mode for Cody connector
 * - 'api': Use direct API calls (fast, reliable, no CLI dependency)
 * - 'cli': Use Cody CLI (may have additional features or context awareness)
 * - 'auto': Try API first, fallback to CLI on failure (best of both worlds)
 */
export type CodyConnectionMode = 'api' | 'cli' | 'auto';

export interface CodyConnectorConfig extends BaseConnectorConfig {
  /**
   * Connection mode for chat completions
   * @default 'api'
   */
  connectionMode?: CodyConnectionMode;
  
  // ============================================
  // Common Configuration (used by both modes)
  // ============================================
  
  /**
   * Sourcegraph endpoint URL
   * @default 'https://sourcegraph.com/'
   */
  endpoint?: string;
  
  /**
   * Access token for authentication
   * Can also be set via SRC_ACCESS_TOKEN environment variable
   */
  accessToken?: string;
  
  /**
   * Model to use for chat
   * @default undefined (uses Cody's default)
   */
  model?: string;
  
  // ============================================
  // CLI-specific Configuration
  // ============================================
  
  /**
   * Path to the cody CLI executable
   * Only used when connectionMode is 'cli' or 'auto'
   * @default 'cody'
   */
  cliPath?: string;
  
  /**
   * Working directory for cody CLI
   * Only used when connectionMode is 'cli' or 'auto'
   */
  workingDirectory?: string;
  
  /**
   * Show context items in reply
   * Only used when connectionMode is 'cli' or 'auto'
   * @default false
   */
  showContext?: boolean;
  
  /**
   * Enable debug logging
   * Only used when connectionMode is 'cli' or 'auto'
   * @default false
   */
  debug?: boolean;
}
