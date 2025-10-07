/**
 * Example configuration for using Cody connector with AnyGPT
 * 
 * Prerequisites:
 * 1. Install Cody CLI: npm install -g @sourcegraph/cody
 * 2. Authenticate: cody auth
 * 
 * Usage:
 * - Use this config with the AnyGPT router to chat with Cody
 * - Cody will use your authenticated Sourcegraph instance
 */

import { cody } from '@anygpt/cody';

export default {
  providers: {
    // Basic Cody setup - uses default configuration
    cody: cody(),
    
    // Custom Cody setup with specific model
    'cody-custom': cody({
      // Optional: specify a working directory for context
      workingDirectory: process.cwd(),
      
      // Optional: show context items in responses
      showContext: false,
      
      // Optional: enable debug logging
      debug: false,
      
      // Optional: custom timeout (default: 60000ms)
      timeout: 60000,
    }),
    
    // Enterprise Sourcegraph instance
    'cody-enterprise': cody({
      endpoint: 'https://sourcegraph.company.com/',
      accessToken: process.env.SRC_ACCESS_TOKEN,
      workingDirectory: '/path/to/project',
    }),
  }
};
