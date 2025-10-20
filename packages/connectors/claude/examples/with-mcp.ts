import { claudeAgent } from '../src/index.js';

/**
 * Example using Claude Agent with MCP servers
 */
async function main() {
  // Create connector with MCP servers
  const connector = claudeAgent({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4',
    mcpServers: {
      'filesystem': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
      },
    },
    permissions: {
      read: 'allow',  // Allow reading files
      bash: 'ask',    // Ask before running commands
    },
  });

  // Agent can now use filesystem tools
  const response = await connector.chatCompletion({
    messages: [
      { role: 'user', content: 'Read the README.md file and summarize it' }
    ],
    model: 'claude-sonnet-4',
  });

  console.log('Response:', response.choices[0].message.content);
}

main().catch(console.error);
