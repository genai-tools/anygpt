import * as readline from 'node:readline';
import type {
  IChatLoop,
  ChatLoopOptions,
  Message,
  Commands,
} from './types.js';

/**
 * Interactive chat loop with REPL and history management
 */
export class ChatLoop implements IChatLoop {
  private history: Message[] = [];
  private running = false;
  private rl: readline.Interface | null = null;
  private options: ChatLoopOptions = {};
  private commands: Commands = {};
  private sigintCount = 0;

  constructor() {
    this.setupCommands();
  }

  /**
   * Setup built-in commands
   */
  private setupCommands(): void {
    this.commands = {
      exit: {
        handler: () => {
          this.stop();
        },
        description: 'Exit the chat',
      },
      quit: {
        handler: () => {
          this.stop();
        },
        description: 'Exit the chat (alias for /exit)',
      },
      help: {
        handler: () => {
          console.log('\nAvailable commands:');
          for (const [cmd, { description }] of Object.entries(this.commands)) {
            console.log(`  /${cmd} - ${description}`);
          }
          console.log('');
        },
        description: 'Show this help message',
      },
      clear: {
        handler: () => {
          this.clearHistory();
          console.log('History cleared.');
        },
        description: 'Clear message history',
      },
      history: {
        handler: () => {
          const history = this.getHistory();
          if (history.length === 0) {
            console.log('No messages in history.');
            return;
          }
          console.log(`\nMessage history (${history.length} messages):`);
          for (const msg of history) {
            const time = msg.timestamp.toLocaleTimeString();
            console.log(`[${time}] ${msg.role}: ${msg.content}`);
          }
          console.log('');
        },
        description: 'Show message history',
      },
    };
  }

  /**
   * Start the chat loop
   */
  async start(options: ChatLoopOptions = {}): Promise<void> {
    if (this.running) {
      throw new Error('Chat loop is already running');
    }

    this.options = {
      prompt: options.prompt || '> ',
      maxHistory: options.maxHistory || 100,
      onMessage: options.onMessage || this.defaultMessageHandler.bind(this),
    };

    this.running = true;

    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.options.prompt,
      historySize: this.options.maxHistory,
    });

    // Handle SIGINT (Ctrl+C)
    this.rl.on('SIGINT', () => {
      this.sigintCount++;
      if (this.sigintCount >= 2) {
        console.log('\n👋 Exiting...');
        this.stop();
      } else {
        console.log('\n(To exit, type /exit or press Ctrl+C again)');
        this.rl?.prompt();
      }
    });

    // Handle line input
    this.rl.on('line', async (input: string) => {
      // Reset SIGINT counter on any input
      this.sigintCount = 0;

      const trimmed = input.trim();

      if (!trimmed) {
        this.rl?.prompt();
        return;
      }

      // Check for commands
      if (trimmed.startsWith('/')) {
        await this.handleCommand(trimmed);
        this.rl?.prompt();
        return;
      }

      // Add user message to history
      this.addMessage({
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      });

      try {
        // Call message handler
        if (!this.options.onMessage) {
          throw new Error('No message handler configured');
        }
        const response = await this.options.onMessage(trimmed);

        // Add assistant response to history
        this.addMessage({
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        });

        // Display response
        console.log(response);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMsg}`);
      }

      this.rl?.prompt();
    });

    // Handle close
    this.rl.on('close', () => {
      this.running = false;
    });

    // Show initial prompt
    console.log('Chat started. Type /help for commands, /exit to quit.\n');
    this.rl.prompt();

    // Wait for the readline to close
    return new Promise<void>((resolve) => {
      this.rl?.on('close', () => {
        resolve();
      });
    });
  }

  /**
   * Stop the chat loop
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  /**
   * Add a message to history
   */
  addMessage(message: Message): void {
    this.history.push(message);

    // Enforce max history limit
    const maxHistory = this.options.maxHistory || 100;
    if (this.history.length > maxHistory) {
      this.history = this.history.slice(-maxHistory);
    }
  }

  /**
   * Get all messages from history
   */
  getHistory(): Message[] {
    return [...this.history];
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Check if chat loop is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Default message handler (echo)
   */
  private async defaultMessageHandler(message: string): Promise<string> {
    return `Echo: ${message}`;
  }

  /**
   * Handle command execution
   */
  private async handleCommand(input: string): Promise<void> {
    const parts = input.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const cmd = this.commands[command];
    if (!cmd) {
      console.log(`Unknown command: /${command}. Type /help for available commands.`);
      return;
    }

    try {
      await cmd.handler(args);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Command error: ${errorMsg}`);
    }
  }
}
