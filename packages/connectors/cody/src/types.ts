import type { BaseConnectorConfig } from '@anygpt/types';

export interface CodyConnectorConfig extends BaseConnectorConfig {
  /**
   * Path to the cody CLI executable
   * @default 'cody'
   */
  cliPath?: string;
  
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
   * Working directory for cody CLI
   */
  workingDirectory?: string;
  
  /**
   * Model to use for chat
   * @default undefined (uses Cody's default)
   */
  model?: string;
  
  /**
   * Show context items in reply
   * @default false
   */
  showContext?: boolean;
  
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}
