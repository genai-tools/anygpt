import { type CreateNodesV2, logger, workspaceRoot } from '@nx/devkit';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

function isVerbose(): boolean {
  // Check for --verbose flag in process arguments
  if (process.argv.includes('--verbose')) {
    return true;
  }

  // Check NX_VERBOSE_LOGGING environment variable
  if (process.env.NX_VERBOSE_LOGGING === 'true') {
    return true;
  }

  // Check for .env file with NX_VERBOSE_LOGGING
  try {
    const envPath = join(workspaceRoot, '.env');
    if (existsSync(envPath)) {
      const envContent = require('fs').readFileSync(envPath, 'utf-8');
      return envContent.includes('NX_VERBOSE_LOGGING=true');
    }
  } catch (_e) {
    void _e;
    // Ignore errors
  }

  return false;
}

function logDebug(message: string) {
  if (isVerbose()) {
    logger.info(`[nx-tsdown] ${message}`);
  }
}

export const createNodesV2: CreateNodesV2 = [
  '**/tsdown.config.ts',
  (configFiles, _options, _context) => {
    void _options;
    void _context;
    const verbose = isVerbose();

    if (verbose) {
      logger.info(
        `[nx-tsdown] Processing ${configFiles.length} tsdown config files`
      );
    }

    return configFiles.map((configFile) => {
      const projectRoot = dirname(configFile);
      logDebug(`Found tsdown.config.ts in ${projectRoot}`);

      const buildTarget = {
        executor: 'nx:run-commands',
        options: {
          command: 'npx tsdown',
          cwd: projectRoot,
        },
        outputs: [
          // All build artifacts in dist directory
          `{projectRoot}/dist`,
          // Explicitly list key outputs for better cache granularity
          `{projectRoot}/dist/**/*.js`,
          `{projectRoot}/dist/**/*.d.ts`,
          `{projectRoot}/dist/**/*.map`,
        ],
        cache: true,
        inputs: [
          // Project source files
          `{projectRoot}/src/**/*.ts`,
          `{projectRoot}/tsconfig.lib.json`,
          `{projectRoot}/tsdown.config.ts`,
          `{projectRoot}/package.json`,
          // Include dependency source files to invalidate cache when dependencies change
          // This ensures that changes in @anygpt/types, @anygpt/router, etc. invalidate dependent packages
          `^production`,
          { externalDependencies: ['tsdown'] },
        ],
        dependsOn: ['^build'],
      };

      const watchTarget = {
        executor: 'nx:run-commands',
        options: {
          command: 'npx tsdown --watch',
          cwd: projectRoot,
        },
      };

      const cleanTarget = {
        executor: 'nx:run-commands',
        options: {
          command: 'rm -rf dist',
          cwd: projectRoot,
        },
      };

      const cleanNmpTarget = {
        executor: 'nx:run-commands',
        options: {
          command: 'rm -rf node_modules',
          cwd: projectRoot,
        },
      };

      return [
        configFile,
        {
          projects: {
            [projectRoot]: {
              targets: {
                build: buildTarget,
                watch: watchTarget,
                clean: cleanTarget,
                clean_npm: cleanNmpTarget,
              },
            },
          },
        },
      ];
    });
  },
];
