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
import { listModelsCommand } from './commands/list-models.js';
import { listTagsCommand } from './commands/list-tags.js';
import { benchmarkCommand } from './commands/benchmark.js';
import { 
  mcpListCommand,
  mcpSearchCommand,
  mcpToolsCommand,
  mcpInspectCommand,
  mcpExecuteCommand,
  mcpConfigShowCommand,
  mcpConfigValidateCommand,
  mcpConfigReloadCommand
} from './commands/mcp.js';
import { withCLIContext } from './utils/cli-context.js';

const program = new Command();

program
  .name('anygpt')
  .description('AnyGPT - Universal AI Gateway CLI')
  .version('0.0.1')
  .option('-c, --config <path>', 'path to config file')
  .option(
    '-v, --verbose [level]',
    'verbose output: no value = info (metrics), "debug" = debug logs'
  );

// Stateless chat command
program
  .command('chat')
  .description('Send chat message (stateless)')
  .option('--provider <name>', 'provider name from config')
  .option('--type <type>', 'provider type (openai, anthropic, google)')
  .option('--url <url>', 'API endpoint URL')
  .option('--token <token>', 'API token')
  .option(
    '--model <model>',
    'direct model name (no tag resolution, passed as-is to provider)'
  )
  .option(
    '--tag <tag>',
    'tag name for model resolution (e.g., "sonnet", "openai:gemini", "cody:opus")'
  )
  .option('--max-tokens <number>', 'maximum tokens to generate', parseInt)
  .option('--usage', 'show token usage statistics')
  .option('--stdin', 'read message from stdin instead of argument')
  .argument('[message]', 'message to send (optional if --stdin is used)')
  .action(withCLIContext(chatCommand));

// Config inspection command
program
  .command('config')
  .description('Show resolved configuration')
  .option('--json', 'output as JSON')
  .action(withCLIContext(configCommand));

// List models command
program
  .command('list-models')
  .description('List available models from a provider')
  .option(
    '--provider <name>',
    'provider name from config (uses default from config if not specified)'
  )
  .option('--tags', 'show resolved tags for each model')
  .option(
    '--filter-tags <tags>',
    'filter models by tags (comma-separated, use ! prefix to exclude). Examples: "reasoning", "!reasoning", "claude,sonnet"'
  )
  .option(
    '--enabled [value]',
    'filter by enabled status (true/false, default: true if flag present)',
    (val) => {
      if (val === 'false' || val === '0') return false;
      if (val === 'true' || val === '1') return true;
      return true; // Default to true if just --enabled is passed
    }
  )
  .option('--json', 'output as JSON')
  .action(withCLIContext(listModelsCommand));

// List tags command
program
  .command('list-tags')
  .description('List all available tags and their model mappings')
  .option('--provider <name>', 'filter by provider name')
  .option('--json', 'output as JSON')
  .action(withCLIContext(listTagsCommand));

// Benchmark command
program
  .command('benchmark')
  .description('Benchmark models across providers')
  .option('--provider <name>', 'benchmark all models from this provider')
  .option(
    '--model <model>',
    'specific model to benchmark (requires --provider)'
  )
  .option(
    '--models <list>',
    'comma-separated list of provider:model pairs (e.g., "openai:gpt-4o,anthropic:claude-3-5-sonnet")'
  )
  .option(
    '--prompt <text>',
    'prompt to use for benchmarking (default: "What is 2+2? Answer in one sentence.")'
  )
  .option('--stdin', 'read prompt from stdin')
  .option(
    '--max-tokens <number>',
    'maximum tokens to generate (optional, some models may not support this)',
    (val) => parseInt(val, 10)
  )
  .option(
    '--iterations <number>',
    'number of iterations per model',
    (val) => parseInt(val, 10),
    1
  )
  .option('--all', 'benchmark all models from all providers')
  .option(
    '--filter-tags <tags>',
    'filter models by tags (comma-separated, use ! prefix to exclude)'
  )
  .option('--parallel', 'run models in parallel instead of sequentially')
  .option(
    '--concurrency <number>',
    'max parallel requests when using --parallel (default: 3)',
    (val) => parseInt(val, 10),
    3
  )
  .option('--output <directory>', 'directory to save response files')
  .option('--json', 'output as JSON')
  .action(withCLIContext(benchmarkCommand));

// Conversation commands
const conversation = program
  .command('conversation')
  .description('Manage stateful conversations');

conversation
  .command('start')
  .description('Start a new conversation')
  .option(
    '--provider <name>',
    'provider name from config (uses default from config if not specified)'
  )
  .option(
    '--model <model>',
    'model name (uses default from config if not specified)'
  )
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
        keepRecent: parseInt(options.keepRecent) || 3,
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
  .option(
    '--dry-run',
    'show what would be summarized without creating new conversation'
  )
  .action(async (options: any) => {
    try {
      const summarizeOptions = {
        ...options,
        keepRecent: parseInt(options.keepRecent) || 3,
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
  .option(
    '--limit <number>',
    'limit number of messages to show (shows last N messages)'
  )
  .option('--format <format>', 'output format: full, compact, or json', 'full')
  .action(async (options: any) => {
    try {
      const showOptions = {
        ...options,
        limit: options.limit ? parseInt(options.limit) : undefined,
      };
      await conversationShowCommand(showOptions);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// MCP Discovery commands
const mcp = program
  .command('mcp')
  .description('Manage MCP servers and tools');

mcp
  .command('list')
  .description('List all configured MCP servers')
  .option('--tools', 'show tool list with descriptions')
  .option('--compact', 'show tools in compact comma-separated format (use with --tools)')
  .option('--enabled', 'show only enabled servers')
  .option('--disabled', 'show only disabled servers')
  .option('--all', 'show all servers (default)')
  .option('--json', 'output as JSON')
  .action(withCLIContext(mcpListCommand));

mcp
  .command('search <query>')
  .description('Search for tools across all MCP servers')
  .option('--server <name>', 'filter by server name')
  .option('--limit <number>', 'maximum number of results', parseInt, 10)
  .option('--json', 'output as JSON')
  .action(withCLIContext(mcpSearchCommand));

mcp
  .command('tools <server>')
  .description('List tools from a specific MCP server')
  .option('--all', 'show all tools including disabled')
  .option('--tags', 'show tool tags')
  .option('--json', 'output as JSON')
  .action(withCLIContext(mcpToolsCommand));

mcp
  .command('inspect <tool>')
  .description('Get detailed information about a tool (auto-resolves server if tool name is unique)')
  .option('--server <name>', 'specify server name (optional if tool is unique)')
  .option('--examples', 'show usage examples')
  .option('--json', 'output as JSON')
  .action(withCLIContext(mcpInspectCommand));

mcp
  .command('execute <tool> [args...]')
  .description('Execute a tool (auto-resolves server if tool name is unique)')
  .option('--server <name>', 'specify server name (optional if tool is unique)')
  .option('--args <json>', 'tool arguments as JSON string (overrides positional args)')
  .option('--json', 'output as JSON')
  .option('--stream', 'stream output (if supported)')
  .action(withCLIContext(mcpExecuteCommand));

// MCP config subcommands
const mcpConfig = mcp
  .command('config')
  .description('Manage MCP discovery configuration');

mcpConfig
  .command('show')
  .description('Show current configuration')
  .option('--json', 'output as JSON')
  .action(withCLIContext(mcpConfigShowCommand));

mcpConfig
  .command('validate')
  .description('Validate configuration')
  .option('--json', 'output as JSON')
  .action(withCLIContext(mcpConfigValidateCommand));

mcpConfig
  .command('reload')
  .description('Reload configuration')
  .option('--json', 'output as JSON')
  .action(withCLIContext(mcpConfigReloadCommand));

program.parse();
