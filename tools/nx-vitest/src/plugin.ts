import { type CreateNodesV2, logger, workspaceRoot } from '@nx/devkit';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

function isVerbose(): boolean {
  if (process.argv.includes('--verbose')) {
    return true;
  }

  if (process.env.NX_VERBOSE_LOGGING === 'true') {
    return true;
  }

  try {
    const envPath = join(workspaceRoot, '.env');
    if (existsSync(envPath)) {
      const envContent = require('fs').readFileSync(envPath, 'utf-8');
      return envContent.includes('NX_VERBOSE_LOGGING=true');
    }
  } catch (_e) {
    void _e;
  }

  return false;
}

function logDebug(message: string) {
  if (isVerbose()) {
    logger.info(`[nx-vitest] ${message}`);
  }
}

export const createNodesV2: CreateNodesV2 = [
  '**/vitest.config.ts',
  (configFiles, _options, _context) => {
    void _options;
    void _context;
    const verbose = isVerbose();

    if (verbose) {
      logger.info(
        `[nx-vitest] Processing ${configFiles.length} vitest config files`
      );
    }

    return configFiles.map((configFile) => {
      const projectRoot = dirname(configFile);
      logDebug(`Found vitest.config.ts in ${projectRoot}`);

      const testTarget = {
        executor: 'nx:run-commands',
        options: {
          command: 'npx vitest run',
          cwd: projectRoot,
        },
        cache: true,
        inputs: [
          `{projectRoot}/src/**/*.ts`,
          `{projectRoot}/src/**/*.spec.ts`,
          `{projectRoot}/src/**/*.test.ts`,
          `{projectRoot}/vitest.config.ts`,
          `{projectRoot}/vite.config.ts`,
          `{projectRoot}/tsconfig.json`,
          { externalDependencies: ['vitest'] },
        ],
        dependsOn: ['^build'],
      };

      return [
        configFile,
        {
          projects: {
            [projectRoot]: {
              targets: {
                test: testTarget,
              },
            },
          },
        },
      ];
    });
  },
];
