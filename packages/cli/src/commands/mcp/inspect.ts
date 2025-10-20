import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { ServerProgress } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';
import logUpdate from 'log-update';
import chalk from 'chalk';

interface InspectOptions {
  server?: string;
  tools?: boolean; // Show tools when inspecting server or listing all
  compact?: boolean; // Compact tool format
  args?: boolean; // Show detailed parameter schemas
  examples?: boolean; // Show usage examples
  enabled?: boolean; // Filter: only enabled servers
  disabled?: boolean; // Filter: only disabled servers
  all?: boolean; // Filter: all servers (default)
  json?: boolean;
}

/**
 * Unified inspect command:
 * - No target: List all servers (like old mcp list)
 * - <server> target: Inspect server config + tools (like old mcp tools)
 * - <tool> target: Inspect tool details (old mcp inspect)
 */
export async function mcpInspectCommand(
  context: CLIContext,
  target?: string,
  options: InspectOptions = {}
): Promise<void> {
  const { config, logger } = context;

  // Initialize discovery engine
  const discoveryConfig = config.discovery || {
    enabled: true,
    cache: { enabled: true, ttl: 3600 },
  };

  const engine = new DiscoveryEngine(discoveryConfig, config.mcp?.servers);

  try {
    // Case 1: --server flag provided (inspect specific server)
    if (options.server && !target) {
      await inspectServer(engine, config, options.server, options);
      return;
    }

    // Case 2: No target (list all servers)
    if (!target) {
      await listAllServers(engine, config, options);
      return;
    }

    // Case 3: Target provided - need to resolve if it's a server or tool
    await resolveAndInspect(engine, config, target, options);
  } catch (error) {
    logUpdate.clear();
    logger.error('Failed to inspect:', error);
    throw error;
  } finally {
    // Always cleanup: disconnect from all MCP servers
    await engine.dispose();

    // Force exit if process is hanging
    setTimeout(() => {
      if (!process.exitCode) {
        process.exit(0);
      }
    }, 100);
  }
}

/**
 * List all servers (Case 1: no target)
 */
async function listAllServers(
  engine: DiscoveryEngine,
  config: unknown,
  options: InspectOptions
): Promise<void> {
  const allServerNames = Object.keys(config.mcp?.servers || {});
  const serverNames = allServerNames.filter((name) => {
    const serverConfig = config.mcp?.servers?.[name];
    const isDisabled = serverConfig?.enabled === false;

    if (options.enabled) return !isDisabled;
    if (options.disabled) return isDisabled;
    return true;
  });

  const serverCount = serverNames.length;
  const serverStatus = new Map<
    string,
    {
      status: string;
      error?: string;
      toolCount?: number;
    }
  >();

  // Handle Ctrl+C gracefully
  const cleanup = () => {
    logUpdate.clear();
    engine.dispose().catch(() => {
      /* ignore */
    });
    process.exit(130);
  };

  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);

  // Render dashboard during progress
  const renderDashboard = () => {
    const lines = ['\n📦 MCP Servers\n'];

    for (const name of serverNames) {
      const status = serverStatus.get(name);

      let icon = '🟡';
      let statusText = 'Waiting...';

      if (status) {
        if (status.status === 'connecting') {
          icon = '🟡';
          statusText = 'Connecting...';
        } else if (status.status === 'discovering') {
          icon = '🟡';
          statusText = 'Discovering...';
        } else if (status.status === 'connected') {
          icon = '🟢';
          statusText = `${status.toolCount} tools`;
        } else if (status.status === 'error') {
          icon = '🔴';
          statusText = 'unavailable';
        }
      }

      const serverConfig = config.mcp?.servers?.[name];
      const source = serverConfig?.source;
      const isDisabled = serverConfig?.enabled === false;

      if (isDisabled) {
        icon = '⚪';
        const toolCount = serverConfig?.metadata?.toolCount;
        statusText =
          toolCount !== undefined
            ? chalk.gray(`${toolCount} tools (disabled)`)
            : chalk.gray('disabled');
      }

      const plainTextName = source ? `${name}(${source})` : name;
      const paddingNeeded = Math.max(0, 45 - plainTextName.length);

      const serverNameWithSource = source
        ? `${name}${chalk.gray(`(${source})`)}`
        : name;
      const serverName = isDisabled
        ? chalk.gray(serverNameWithSource)
        : chalk.bold.cyan(serverNameWithSource);

      lines.push(
        `  ${icon} ${serverName}${' '.repeat(paddingNeeded)} ${statusText}`
      );

      if (status?.status === 'error' && status.error && !isDisabled) {
        const errorLines = status.error
          .split('\n')
          .map((line) => (line.trim() ? chalk.red(`     ${line}`) : ''))
          .filter((line) => line);

        lines.push(...errorLines);

        const cmd = `${serverConfig.command} ${
          serverConfig.args?.join(' ') || ''
        }`.trim();
        lines.push(chalk.gray(`     Command: ${cmd}`));
      }
    }

    const disabledCount = serverNames.filter((name) => {
      const serverConfig = config.mcp?.servers?.[name];
      return serverConfig?.enabled === false;
    }).length;

    const completed = Array.from(serverStatus.values()).filter(
      (s) => s.status === 'connected' || s.status === 'error'
    ).length;
    const connected = Array.from(serverStatus.values()).filter(
      (s) => s.status === 'connected'
    ).length;

    if (completed < serverCount) {
      lines.push(`\n  Progress: ${completed}/${serverCount}`);
    } else {
      const actualFailed = serverCount - connected - disabledCount;
      const totalActive = serverCount - disabledCount;

      if (options.disabled && disabledCount > 0) {
        lines.push(
          `\n  ${chalk.gray(
            `${disabledCount} disabled ${
              disabledCount === 1 ? 'server' : 'servers'
            }`
          )}`
        );
      } else if (options.enabled) {
        if (actualFailed === 0) {
          lines.push(`\n  ${chalk.green(`✓ All ${connected} servers loaded`)}`);
        } else {
          lines.push(
            `\n  ${chalk.yellow(
              `⚠ ${connected}/${totalActive} servers loaded`
            )} ${chalk.gray(`(${actualFailed} failed)`)}`
          );
        }
      } else {
        if (actualFailed === 0 && disabledCount === 0) {
          lines.push(
            `\n  ${chalk.green(`✓ All ${serverCount} servers loaded`)}`
          );
        } else if (actualFailed === 0 && disabledCount > 0) {
          lines.push(
            `\n  ${chalk.green(
              `✓ All ${totalActive} servers loaded`
            )} ${chalk.gray(`(${disabledCount} disabled)`)}`
          );
        } else {
          const failedText =
            actualFailed > 0 ? chalk.gray(`${actualFailed} failed`) : '';
          const disabledText =
            disabledCount > 0 ? chalk.gray(`${disabledCount} disabled`) : '';
          const parts = [failedText, disabledText].filter(Boolean).join(', ');
          lines.push(
            `\n  ${chalk.yellow(
              `⚠ ${connected}/${totalActive} servers loaded`
            )} ${chalk.gray(`(${parts})`)}`
          );
        }
      }
    }

    logUpdate(lines.join('\n'));
  };

  renderDashboard();

  await engine.initialize((progress: ServerProgress) => {
    serverStatus.set(progress.server, {
      status: progress.status,
      error: progress.error,
      toolCount: progress.toolCount,
    });
    renderDashboard();
  });

  const servers = await engine.listServers();

  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');

  renderDashboard();

  if (options.json) {
    logUpdate.clear();
    console.log(JSON.stringify(servers, null, 2));
    return;
  }

  if (servers.length === 0) {
    logUpdate.clear();
    console.log('No MCP servers configured.');
    console.log(
      '\nTo add MCP servers, configure them in your AnyGPT config file.'
    );
    return;
  }

  // Show tools if --tools flag is used
  if (options.tools) {
    console.log('');
    for (const server of servers) {
      if (server.status === 'connected') {
        const tools = await engine.listTools(server.name, true);
        if (tools.length > 0) {
          const enabledCount = tools.filter((t) => t.enabled).length;
          const totalCount = tools.length;

          console.log(`  ${chalk.bold.cyan(server.name)}:`);

          if (options.compact) {
            const statsText =
              enabledCount === totalCount
                ? chalk.green(`(${enabledCount}/${totalCount} enabled)`)
                : chalk.yellow(`(${enabledCount}/${totalCount} enabled)`);

            const toolNames = tools.map((t) =>
              t.enabled ? t.name : chalk.gray(t.name)
            );
            console.log(`     ${toolNames.join(', ')} ` + statsText);
          } else {
            const statsText =
              enabledCount === totalCount
                ? chalk.green(`(${enabledCount}/${totalCount} enabled)`)
                : chalk.yellow(`(${enabledCount}/${totalCount} enabled)`);
            console.log(`     ${statsText}`);

            for (const tool of tools) {
              const toolName = tool.enabled
                ? chalk.white(tool.name)
                : chalk.gray(tool.name);
              const description =
                tool.description || tool.summary || 'No description';
              console.log(`       • ${toolName}`);
              console.log(chalk.gray(`         ${description}`));
            }
          }
          console.log('');
        }
      }
    }
  }
}

/**
 * Initialize engine with timeout
 */
async function initializeWithTimeout(
  engine: DiscoveryEngine,
  timeoutMs = 10000
): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Initialization timeout')), timeoutMs);
  });

  try {
    await Promise.race([engine.initialize(), timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Initialization timeout') {
      console.log(
        chalk.yellow(
          '\n⚠ Initialization timed out after 10s, showing available servers only\n'
        )
      );
    } else {
      throw error;
    }
  }
}

/**
 * Inspect specific server (Case 2: --server or server target)
 */
async function inspectServer(
  engine: DiscoveryEngine,
  config: unknown,
  serverName: string,
  options: InspectOptions
): Promise<void> {
  // Initialize silently with timeout
  process.stdout.write('🔄 Initializing MCP servers...');
  await initializeWithTimeout(engine);
  process.stdout.write('\r\x1b[K');

  const serverConfig = config.mcp?.servers?.[serverName];
  if (!serverConfig) {
    console.log(`\n✗ Server "${serverName}" not found in configuration\n`);
    return;
  }

  if (options.json) {
    const tools = await engine.listTools(serverName, true);
    console.log(
      JSON.stringify(
        { server: serverName, config: serverConfig, tools },
        null,
        2
      )
    );
    return;
  }

  // Human-friendly output
  console.log(`\n📦 Server: ${chalk.bold.cyan(serverName)}\n`);

  const isDisabled = serverConfig.enabled === false;
  console.log(
    `  Status: ${isDisabled ? chalk.gray('disabled') : chalk.green('enabled')}`
  );

  // Show full command line
  const fullCommand =
    serverConfig.args && serverConfig.args.length > 0
      ? `${serverConfig.command} ${serverConfig.args.join(' ')}`
      : serverConfig.command;
  console.log(`  Command: ${fullCommand}`);

  if (serverConfig.source) {
    console.log(`  Source: ${chalk.gray(serverConfig.source)}`);
  }

  // Show tools if requested or by default
  if (options.tools !== false) {
    try {
      const tools = await engine.listTools(serverName, true);

      if (tools.length === 0) {
        console.log(`\n  No tools available`);
      } else {
        const enabledCount = tools.filter((t) => t.enabled).length;
        const totalCount = tools.length;

        console.log(`\n  Tools (${enabledCount}/${totalCount} enabled):\n`);

        for (const tool of tools) {
          const toolName = tool.enabled
            ? chalk.white(tool.name)
            : chalk.gray(tool.name);
          const description =
            tool.description || tool.summary || 'No description';
          console.log(`    • ${toolName}`);
          console.log(chalk.gray(`      ${description}`));
        }
      }
    } catch (error) {
      console.log(`\n  ${chalk.red('Failed to load tools')}`);
      if (error instanceof Error) {
        console.log(chalk.gray(`  ${error.message}`));
      }
    }
  }

  console.log('');
}

/**
 * Inspect specific tool (Case 3: tool target)
 */
async function inspectTool(
  engine: DiscoveryEngine,
  toolName: string,
  serverName: string,
  options: InspectOptions
): Promise<void> {
  const tool = await engine.getToolDetails(serverName, toolName);

  if (!tool) {
    console.log(`\nTool "${toolName}" not found in server "${serverName}"`);
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(tool, null, 2));
    return;
  }

  // Human-friendly output
  console.log(`\n🔍 Tool: ${chalk.bold.cyan(tool.name)}\n`);
  console.log(`  Server: ${tool.server}`);

  const description = tool.description || tool.summary;
  if (description) {
    console.log(`  Description: ${description}`);
  }

  console.log(
    `  Enabled: ${tool.enabled ? chalk.green('✓ Yes') : chalk.gray('✗ No')}`
  );

  if (tool.tags.length > 0) {
    console.log(`  Tags: ${tool.tags.join(', ')}`);
  }

  // Parameters (always show by default)
  if (tool.parameters && tool.parameters.length > 0) {
    console.log(`\n  Parameters:`);
    for (const param of tool.parameters) {
      const required = param.required
        ? chalk.yellow('(required)')
        : chalk.gray('(optional)');
      console.log(
        `    • ${chalk.white(param.name)}: ${chalk.cyan(
          param.type
        )} ${required}`
      );
      if (param.description) {
        console.log(chalk.gray(`      ${param.description}`));
      }
      // Show defaults by default (not just with --args)
      if (param.default !== undefined) {
        console.log(
          chalk.gray(`      Default: ${JSON.stringify(param.default)}`)
        );
      }
    }
  }

  // Examples (only with --examples)
  if (options.examples && tool.examples && tool.examples.length > 0) {
    console.log(`\n  Examples:`);
    for (const example of tool.examples) {
      console.log(`    ${example.description}`);
      console.log(
        `    Parameters: ${JSON.stringify(example.parameters, null, 2)}`
      );
      console.log('');
    }
  }

  console.log('');
}

/**
 * Resolve target and inspect (Case 3: target provided)
 */
async function resolveAndInspect(
  engine: DiscoveryEngine,
  config: unknown,
  target: string,
  options: InspectOptions
): Promise<void> {
  // Initialize silently with timeout
  process.stdout.write('🔄 Initializing MCP servers...');
  await initializeWithTimeout(engine);
  process.stdout.write('\r\x1b[K');

  // Check if target is a server name
  const serverConfig = config.mcp?.servers?.[target];
  if (serverConfig) {
    // Target is a server
    await inspectServer(engine, config, target, options);
    return;
  }

  // Target might be a tool - search for it
  let resolvedServer: string | undefined;

  if (options.server) {
    // Server explicitly provided via --server flag
    resolvedServer = options.server;
  } else {
    // Auto-resolve: search for tool across all servers
    process.stdout.write('🔍 Searching for tool across servers...');
    const allServers = await engine.listServers();
    process.stdout.write('\r\x1b[K');
    const matchingTools: Array<{ server: string; tool: string }> = [];

    for (const server of allServers) {
      if (server.status === 'connected') {
        const tools = await engine.listTools(server.name, false);
        const exactMatch = tools.find((t) => t.name === target);
        if (exactMatch) {
          matchingTools.push({ server: server.name, tool: target });
        }
      }
    }

    if (matchingTools.length === 1) {
      resolvedServer = matchingTools[0].server;
      console.log(
        `\n${chalk.gray(`Auto-resolved from server "${resolvedServer}"`)}`
      );
    } else if (matchingTools.length > 1) {
      console.log(
        `\n${chalk.yellow(
          '⚠ Ambiguous:'
        )} "${target}" matches multiple items:\n`
      );
      for (const match of matchingTools) {
        console.log(
          `  ${chalk.cyan('Tool:')} ${target} ${chalk.gray(
            `(server: ${match.server})`
          )}`
        );
      }
      console.log(
        `\n${chalk.gray('Use:')} anygpt mcp inspect ${target} --server=<name>\n`
      );
      return;
    } else {
      console.log(
        `\n${chalk.red('✗')} "${target}" not found (not a server or tool)\n`
      );
      return;
    }
  }

  // Inspect the tool
  await inspectTool(engine, target, resolvedServer, options);
}
