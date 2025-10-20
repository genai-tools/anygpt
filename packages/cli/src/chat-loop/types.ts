/**
 * Chat loop types for interactive REPL
 */

/**
 * Message in the chat history
 */
export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCallId?: string; // For tool result messages
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>; // For assistant messages with tool calls
}

/**
 * Options for starting the chat loop
 */
export interface ChatLoopOptions {
  /**
   * Custom prompt string (default: '> ')
   */
  prompt?: string;

  /**
   * Maximum number of messages to keep in history (default: 100)
   */
  maxHistory?: number;

  /**
   * Callback to handle user messages
   * If not provided, messages are echoed back
   */
  onMessage?: (message: string) => Promise<string>;
}

/**
 * Chat loop interface
 */
export interface IChatLoop {
  /**
   * Start the chat loop
   */
  start(options?: ChatLoopOptions): Promise<void>;

  /**
   * Stop the chat loop
   */
  stop(): Promise<void>;

  /**
   * Add a message to history
   */
  addMessage(message: Message): void;

  /**
   * Get all messages from history
   */
  getHistory(): Message[];

  /**
   * Clear message history
   */
  clearHistory(): void;

  /**
   * Check if chat loop is running
   */
  isRunning(): boolean;
}

/**
 * Command handler function
 */
export type CommandHandler = (args: string[]) => Promise<void> | void;

/**
 * Available commands
 */
export interface Commands {
  [command: string]: {
    handler: CommandHandler;
    description: string;
  };
}
