#!/usr/bin/env -S node --experimental-strip-types
/**
 * Check if there are releasable changes
 * 
 * This script runs `nx release version --dry-run` to check if there are
 * any changes that would trigger a release based on conventional commits.
 * 
 * Runs directly with Node 24's native TypeScript support - no build needed!
 */

import * as core from '@actions/core';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  try {
    core.info('Checking for releasable changes...');

    // Run nx release in dry-run mode
    const { stdout, stderr } = await execAsync('npx nx release version --dry-run', {
      cwd: process.cwd(),
    });

    const output = stdout + stderr;
    core.debug(`nx release output: ${output}`);

    // Check if there are no changes
    const hasNoChanges = output.includes('No changes were detected');

    if (hasNoChanges) {
      core.info('No releasable changes found');
      core.setOutput('has_changes', 'false');
      console.log('has_changes=false');
    } else {
      core.info('Found releasable changes');
      core.setOutput('has_changes', 'true');
      console.log('has_changes=true');
    }
  } catch (error) {
    // nx release might exit with non-zero even on success in dry-run
    // Check the error output
    interface ExecError extends Error {
      stdout?: string;
      stderr?: string;
    }
    
    if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
      const execError = error as ExecError;
      const output = (execError.stdout || '') + (execError.stderr || '');
      const hasNoChanges = output.includes('No changes were detected');

      if (hasNoChanges) {
        core.info('No releasable changes found');
        core.setOutput('has_changes', 'false');
        console.log('has_changes=false');
        return;
      }
    }

    // Real error
    if (error instanceof Error) {
      core.setFailed(`Failed to check for changes: ${error.message}`);
    } else {
      core.setFailed('Unknown error occurred');
    }
    process.exit(1);
  }
}

main();
