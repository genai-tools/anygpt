import { Command } from 'commander';
import { conversationStartCommand } from './commands/conversation/start.js';
import { conversationEndCommand } from './commands/conversation/end.js';
import { conversationListCommand } from './commands/conversation/list.js';
import { conversationMessageCommand } from './commands/conversation/message.js';
import { conversationContextCommand } from './commands/conversation/context.js';
import { conversationCondenseCommand } from './commands/conversation/condense.js';
import { conversationForkCommand } from './commands/conversation/fork.js';
import { conversationSummarizeCommand } from './commands/conversation/summarize.js';
import { conversationShowCommand } from './commands/conversation/show.js';
import { conversationContinueCommand } from './commands/conversation/continue.js';
import { conversationDeleteCommand } from './commands/conversation/delete.js';
import { chatCommand } from './commands/chat.js';
import { configCommand } from './commands/config.js';
import { withCLIContext } from './utils/cli-context.js';


const program = new Command();


program
  .name('anygpt')
  .description('AnyGPT - Universal AI Gateway CLI')
  .version('0.0.1')
  .option('-c, --config <path>', 'path to config file')
  .option('-v, --verbose', 'verbose output');

// Stateless chat command
program
  .command('chat')
  .description('Send chat message (stateless)')
  .option('--provider <name>', 'provider name from config')
  .option('--type <type>', 'provider type (openai, anthropic, google)')
  .option('--url <url>', 'API endpoint URL')
  .option('--token <token>', 'API token')
  .option('--model <model>', 'model name (uses default from config if not specified)')
  .argument('<message>', 'message to send')
  .action(withCLIContext(chatCommand));

// Config inspection command
program
  .command('config')
  .description('Show resolved configuration')
  .option('--json', 'output as JSON')
  .action(withCLIContext(configCommand));

// Conversation commands
const conversation = program
  .command('conversation')
  .description('Manage stateful conversations');

conversation
  .command('start')
  .description('Start a new conversation')
  .option('--provider <name>', 'provider name from config (uses default from config if not specified)')
  .option('--model <model>', 'model name (uses default from config if not specified)')
  .option('--name <name>', 'conversation name')
  .action(async (options: any, command: any) => {
    const globalOpts = command.parent.parent.opts();
    
    try {
      await conversationStartCommand(options, globalOpts.config);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('end')
  .description('End the current conversation')
  .action(async () => {
    try {
      await conversationEndCommand();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('list')
  .description('List all conversations')
  .action(async () => {
    try {
      await conversationListCommand();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('continue <id>')
  .description('Continue a specific conversation')
  .action(async (id: string) => {
    try {
      await conversationContinueCommand(id);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('delete <id>')
  .description('Delete a conversation')
  .action(async (id: string) => {
    try {
      await conversationDeleteCommand(id);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('message <message>')
  .description('Send a message in the current conversation')
  .option('--conversation <id>', 'conversation ID to send message to')
  .action(async (message: string, options: any, command: any) => {
    const globalOpts = command.parent.parent.opts();
    
    try {
      await conversationMessageCommand(message, options, globalOpts.config);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('context')
  .description('Show detailed context statistics for the current conversation')
  .option('--conversation <id>', 'conversation ID to analyze')
  .action(async (options: any) => {
    try {
      await conversationContextCommand(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('condense')
  .description('Condense conversation context using AI summarization')
  .option('--conversation <id>', 'conversation ID to condense')
  .option('--keep-recent <number>', 'number of recent messages to keep', '3')
  .option('--dry-run', 'show what would be condensed without applying changes')
  .action(async (options: any) => {
    try {
      const condenseOptions = {
        ...options,
        keepRecent: parseInt(options.keepRecent) || 3
      };
      await conversationCondenseCommand(condenseOptions);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('fork')
  .description('Fork conversation - create new conversation with same history')
  .option('--conversation <id>', 'conversation ID to fork')
  .option('--model <model>', 'model for the new conversation')
  .option('--provider <provider>', 'provider for the new conversation')
  .option('--name <name>', 'name for the new conversation')
  .action(async (options: any) => {
    try {
      await conversationForkCommand(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('summarize')
  .description('Create new conversation with AI-generated summary')
  .option('--conversation <id>', 'conversation ID to summarize')
  .option('--keep-recent <number>', 'number of recent messages to keep', '3')
  .option('--model <model>', 'model for the new conversation')
  .option('--provider <provider>', 'provider for the new conversation')
  .option('--name <name>', 'name for the new conversation')
  .option('--dry-run', 'show what would be summarized without creating new conversation')
  .action(async (options: any) => {
    try {
      const summarizeOptions = {
        ...options,
        keepRecent: parseInt(options.keepRecent) || 3
      };
      await conversationSummarizeCommand(summarizeOptions);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

conversation
  .command('show')
  .description('Show full conversation history')
  .option('--conversation <id>', 'conversation ID to show')
  .option('--limit <number>', 'limit number of messages to show (shows last N messages)')
  .option('--format <format>', 'output format: full, compact, or json', 'full')
  .action(async (options: any) => {
    try {
      const showOptions = {
        ...options,
        limit: options.limit ? parseInt(options.limit) : undefined
      };
      await conversationShowCommand(showOptions);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
