/**
 * Helper to run CLI commands for E2E testing
 */

import { execa } from 'execa';

export interface CLIResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface CLIOptions {
  configPath?: string;
  cwd?: string;
  env?: Record<string, string>;
}

/**
 * Run a CLI command and capture output
 */
export async function runCLI(args: string[], options: CLIOptions = {}): Promise<CLIResult> {
  const { configPath, cwd = process.cwd(), env = {} } = options;

  const fullArgs = configPath ? ['--config', configPath, ...args] : args;

  try {
    const result = await execa('npx', ['anygpt', ...fullArgs], {
      cwd,
      env: { ...process.env, ...env },
      reject: false, // Don't throw on non-zero exit
      timeout: 30000 // 30 second timeout
    });

    return {
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'exitCode' in error) {
      return {
        exitCode: (error as { exitCode: number }).exitCode,
        stdout: (error as { stdout?: string }).stdout || '',
        stderr: (error as { stderr?: string }).stderr || ''
      };
    }
    throw new Error(`Failed to run CLI: ${error}`);
  }
}
