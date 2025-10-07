/**
 * Example configuration for using Cody connector with AnyGPT
 * 
 * The Cody connector supports three connection modes:
 * - 'api' (default): Direct API calls - fast, no CLI needed
 * - 'cli': Uses Cody CLI - may have additional features
 * - 'auto': Tries API first, falls back to CLI
 * 
 * Prerequisites:
 * - API mode: Just need access token
 * - CLI mode: Install Cody CLI: npm install -g @sourcegraph/cody
 * 
 * Usage:
 * - Use this config with the AnyGPT router to chat with Cody
 */

import { cody } from '../src/index.js';

export default {
  providers: {
    // ============================================
    // API Mode (Default) - Recommended
    // ============================================
    
    // Basic API setup - fastest and most reliable
    'cody-api': cody({
      connectionMode: 'api',  // or omit (default)
      endpoint: 'https://sourcegraph.com/',
      accessToken: process.env.SRC_ACCESS_TOKEN,
      model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest'
    }),
    
    // ============================================
    // CLI Mode - For CLI-specific features
    // ============================================
    
    // CLI mode with context awareness
    'cody-cli': cody({
      connectionMode: 'cli',
      endpoint: 'https://sourcegraph.com/',
      accessToken: process.env.SRC_ACCESS_TOKEN,
      
      // CLI-specific options
      workingDirectory: process.cwd(),
      showContext: true,
      debug: false,
      cliPath: 'cody',  // optional, defaults to 'cody'
    }),
    
    // ============================================
    // Auto Mode - Best of both worlds
    // ============================================
    
    // Auto mode with fallback
    'cody-auto': cody({
      connectionMode: 'auto',
      endpoint: 'https://sourcegraph.com/',
      accessToken: process.env.SRC_ACCESS_TOKEN,
      
      // Works for both API and CLI
      timeout: 60000,
      maxRetries: 3,
      
      // CLI options (used if fallback occurs)
      cliPath: 'cody',
      workingDirectory: process.cwd(),
    }),
    
    // ============================================
    // Enterprise Examples
    // ============================================
    
    // Enterprise Sourcegraph instance (API mode)
    'cody-enterprise': cody({
      connectionMode: 'api',
      endpoint: 'https://sourcegraph.example.com/',
      accessToken: process.env.SRC_ACCESS_TOKEN,
      model: 'anthropic::2024-10-22::claude-sonnet-4-latest',
    }),
    
    // Default setup (uses API mode automatically)
    cody: cody(),
  }
};
