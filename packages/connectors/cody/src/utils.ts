import type { ChatMessage } from '@anygpt/types';

/**
 * Clean up Cody CLI output by removing loading indicators and extra whitespace
 */
export function cleanCodyOutput(output: string): string {
  // Remove loading indicators (spinner characters)
  let cleaned = output.replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '');
  
  // Remove "Logging in" messages
  cleaned = cleaned.replace(/Logging in.*\n?/g, '');
  
  // Remove Noxide loader messages
  cleaned = cleaned.replace(/Noxide Loader:.*\n?/g, '');
  cleaned = cleaned.replace(/DelegatingProxy:.*\n?/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Convert chat messages to a single prompt string
 */
export function messagesToPrompt(messages: ChatMessage[]): string {
  // Combine all messages into a single prompt
  // System messages are prepended, then user/assistant messages
  const systemMessages = messages.filter(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');
  
  let prompt = '';
  
  if (systemMessages.length > 0) {
    prompt += systemMessages.map(m => m.content).join('\n\n') + '\n\n';
  }
  
  // For conversation messages, format them clearly
  if (conversationMessages.length > 0) {
    prompt += conversationMessages.map(m => {
      if (m.role === 'user') {
        return m.content;
      } else {
        return `Previous assistant response: ${m.content}`;
      }
    }).join('\n\n');
  }
  
  return prompt;
}

/**
 * Estimate token count for messages
 * Simple estimation: ~4 characters per token
 */
export function estimateTokens(messages: ChatMessage[]): number {
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  return Math.ceil(totalChars / 4);
}

/**
 * Build command line arguments for cody CLI
 */
export function buildCodyArgs(
  message: string,
  config: {
    model?: string;
    endpoint?: string;
    accessToken?: string;
    workingDirectory?: string;
    showContext?: boolean;
    debug?: boolean;
  }
): string[] {
  const args = ['chat', '-m', message, '--silent'];
  
  // Add model if specified
  if (config.model) {
    args.push('--model', config.model);
  }
  
  // Add endpoint if specified
  if (config.endpoint) {
    args.push('--endpoint', config.endpoint);
  }
  
  // Add access token if specified
  if (config.accessToken) {
    args.push('--access-token', config.accessToken);
  }
  
  // Add working directory if specified
  if (config.workingDirectory) {
    args.push('-C', config.workingDirectory);
  }
  
  // Add show context flag if enabled
  if (config.showContext) {
    args.push('--show-context');
  }
  
  // Add debug flag if enabled
  if (config.debug) {
    args.push('--debug');
  }

  return args;
}
