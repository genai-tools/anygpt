import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { ServerProgress } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';
import logUpdate from 'log-update';
import chalk from 'chalk';

interface ListOptions {
  tools?: boolean;   // Show tool list
  compact?: boolean; // Show tools in compact comma-separated format
  json?: boolean;
  enabled?: boolean;  // Show only enabled servers
  disabled?: boolean; // Show only disabled servers
  all?: boolean;      // Show all servers (default)
}

/**
 * List all configured MCP servers
 */
export async function mcpListCommand(
  context: CLIContext,
  options: ListOptions
): Promise<void> {
  const { config, logger } = context;

  // Initialize discovery engine
  const discoveryConfig = config.discovery || {
    enabled: true,
    cache: { enabled: true, ttl: 3600 }
  };
  
  const engine = new DiscoveryEngine(discoveryConfig, config.mcpServers);

  // Filter servers based on options
  const allServerNames = Object.keys(config.mcpServers || {});
  const serverNames = allServerNames.filter(name => {
    const serverConfig = config.mcpServers?.[name];
    const isDisabled = serverConfig?.enabled === false;
    
    // If --enabled flag is set, only show enabled servers
    if (options.enabled) {
      return !isDisabled;
    }
    
    // If --disabled flag is set, only show disabled servers
    if (options.disabled) {
      return isDisabled;
    }
    
    // Default (or --all): show all servers
    return true;
  });
  
  const serverCount = serverNames.length;
  const serverStatus = new Map<string, { 
    status: string; 
    error?: string;
    toolCount?: number;
  }>();

  try {
    // Handle Ctrl+C gracefully
    const cleanup = () => {
      logUpdate.clear();
      engine.dispose().catch(() => {/* ignore */});
      process.exit(130);
    };
    
    process.once('SIGINT', cleanup);
    process.once('SIGTERM', cleanup);
    
    // Render dashboard during progress (no tools shown yet)
    const renderDashboard = () => {
      const lines = ['\n📦 MCP Servers\n'];
      
      for (const name of serverNames) {
        const status = serverStatus.get(name);
        
        // Always use same format: icon + name + status
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
        
        // Get source info and check if disabled
        const serverConfig = config.mcpServers?.[name];
        const source = serverConfig?.source;
        const isDisabled = serverConfig?.enabled === false;
        
        // Override status for disabled servers
        if (isDisabled) {
          icon = '⚪';  // White circle (filled)
          const toolCount = serverConfig?.metadata?.toolCount;
          statusText = toolCount !== undefined 
            ? chalk.gray(`${toolCount} tools (disabled)`)
            : chalk.gray('disabled');
        }
        
        // Calculate plain text length for padding (without ANSI codes)
        const plainTextName = source ? `${name}(${source})` : name;
        const paddingNeeded = Math.max(0, 45 - plainTextName.length);
        
        // Format: name(source) in bold cyan with gray source (or gray if disabled)
        const serverNameWithSource = source 
          ? `${name}${chalk.gray(`(${source})`)}`
          : name;
        const serverName = isDisabled 
          ? chalk.gray(serverNameWithSource)
          : chalk.bold.cyan(serverNameWithSource);
        
        lines.push(`  ${icon} ${serverName}${' '.repeat(paddingNeeded)} ${statusText}`);
        
        // Show error details on next line (but not for disabled servers)
        if (status?.status === 'error' && status.error && !isDisabled) {
          // Colorize error output in red
          const errorLines = status.error.split('\n').map(line => 
            line.trim() ? chalk.red(`     ${line}`) : ''
          ).filter(line => line);
          
          lines.push(...errorLines);
          
          // Show the command that was attempted
          const cmd = `${serverConfig.command} ${serverConfig.args?.join(' ') || ''}`.trim();
          lines.push(chalk.gray(`     Command: ${cmd}`));
        }
      }
      
      // Show progress or final summary
      // Count disabled servers separately
      const disabledCount = serverNames.filter(name => {
        const serverConfig = config.mcpServers?.[name];
        return serverConfig?.enabled === false;
      }).length;
      
      const completed = Array.from(serverStatus.values()).filter(
        s => s.status === 'connected' || s.status === 'error'
      ).length;
      const connected = Array.from(serverStatus.values()).filter(
        s => s.status === 'connected'
      ).length;
      
      if (completed < serverCount) {
        // Still loading
        lines.push(`\n  Progress: ${completed}/${serverCount}`);
      } else {
        // All done - show final summary
        const actualFailed = serverCount - connected - disabledCount;
        const totalActive = serverCount - disabledCount;
        
        // Special case: showing only disabled servers
        if (options.disabled && disabledCount > 0) {
          lines.push(`\n  ${chalk.gray(`${disabledCount} disabled ${disabledCount === 1 ? 'server' : 'servers'}`)}`);
        }
        // Special case: showing only enabled servers
        else if (options.enabled) {
          if (actualFailed === 0) {
            lines.push(`\n  ${chalk.green(`✓ All ${connected} servers loaded`)}`);
          } else {
            lines.push(`\n  ${chalk.yellow(`⚠ ${connected}/${totalActive} servers loaded`)} ${chalk.gray(`(${actualFailed} failed)`)}`);
          }
        }
        // Default: showing all servers
        else {
          if (actualFailed === 0 && disabledCount === 0) {
            lines.push(`\n  ${chalk.green(`✓ All ${serverCount} servers loaded`)}`);
          } else if (actualFailed === 0 && disabledCount > 0) {
            lines.push(`\n  ${chalk.green(`✓ All ${totalActive} servers loaded`)} ${chalk.gray(`(${disabledCount} disabled)`)}`);
          } else {
            const failedText = actualFailed > 0 ? chalk.gray(`${actualFailed} failed`) : '';
            const disabledText = disabledCount > 0 ? chalk.gray(`${disabledCount} disabled`) : '';
            const parts = [failedText, disabledText].filter(Boolean).join(', ');
            lines.push(`\n  ${chalk.yellow(`⚠ ${connected}/${totalActive} servers loaded`)} ${chalk.gray(`(${parts})`)}`);
          }
        }
      }
      
      logUpdate(lines.join('\n'));
    };
    
    // Initial render
    renderDashboard();
    
    // Initialize with progress callback - keeps rewriting
    await engine.initialize((progress: ServerProgress) => {
      serverStatus.set(progress.server, { 
        status: progress.status, 
        error: progress.error,
        toolCount: progress.toolCount
      });
      renderDashboard();
    });
    
    // Get all servers for final state
    const servers = await engine.listServers();
    
    // Remove signal handlers
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    
    // Final render - just leave it on screen (don't call done() as it prints again)
    renderDashboard();
    
    if (options.json) {
      logUpdate.clear();
      console.log(JSON.stringify(servers, null, 2));
      return;
    }
    
    if (servers.length === 0) {
      logUpdate.clear();
      console.log('No MCP servers configured.');
      console.log('\nTo add MCP servers, configure them in your AnyGPT config file.');
      return;
    }
    
    // Show tools after dashboard if --tools flag is used
    if (options.tools) {
      console.log(''); // Add blank line
      for (const server of servers) {
        if (server.status === 'connected') {
          const tools = await engine.listTools(server.name, true);
          if (tools.length > 0) {
            const enabledCount = tools.filter(t => t.enabled).length;
            const totalCount = tools.length;
            
            console.log(`  ${chalk.bold.cyan(server.name)}:`);
            
            if (options.compact) {
              // Compact format: comma-separated on one line
              const statsText = enabledCount === totalCount 
                ? chalk.green(`(${enabledCount}/${totalCount} enabled)`)
                : chalk.yellow(`(${enabledCount}/${totalCount} enabled)`);
              
              const toolNames = tools.map(t => t.enabled ? t.name : chalk.gray(t.name));
              console.log(`     ${toolNames.join(', ')} ` + statsText);
            } else {
              // Detailed format: one tool per line with description
              const statsText = enabledCount === totalCount 
                ? chalk.green(`(${enabledCount}/${totalCount} enabled)`)
                : chalk.yellow(`(${enabledCount}/${totalCount} enabled)`);
              console.log(`     ${statsText}`);
              
              for (const tool of tools) {
                const toolName = tool.enabled ? chalk.white(tool.name) : chalk.gray(tool.name);
                const description = tool.description || tool.summary || 'No description';
                console.log(`       • ${toolName}`);
                console.log(chalk.gray(`         ${description}`));
              }
            }
            console.log(''); // Blank line between servers
          }
        }
      }
    }
  } catch (error) {
    logUpdate.clear();
    logger.error('Failed to list MCP servers:', error);
    throw error;
  } finally {
    // Always cleanup: disconnect from all MCP servers
    await engine.dispose();
    
    // Force exit if process is hanging (MCP servers might keep it alive)
    // Give a small delay for cleanup to complete
    setTimeout(() => {
      if (!process.exitCode) {
        process.exit(0);
      }
    }, 100);
  }
}
