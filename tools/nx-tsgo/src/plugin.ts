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
    logger.info(`[nx-tsgo] ${message}`);
  }
}

export const createNodesV2: CreateNodesV2 = [
  '**/tsconfig.lib.json',
  (configFiles, _options, _context) => {
    void _options;
    void _context;
    const verbose = isVerbose();

    if (verbose) {
      logger.info(
        `[nx-tsgo] Processing ${configFiles.length} tsconfig.lib.json files`
      );
    }

    return configFiles.map((configFile) => {
      const projectRoot = dirname(configFile);
      logDebug(`Found tsconfig.lib.json in ${projectRoot}`);

      // Determine which tsconfig to use (prefer tsconfig.lib.json, fallback to tsconfig.json)
      const tsconfigPath = existsSync(join(workspaceRoot, projectRoot, 'tsconfig.lib.json'))
        ? 'tsconfig.lib.json'
        : 'tsconfig.json';

      const typecheckTarget = {
        executor: 'nx:run-commands',
        options: {
          command: `npx tsgo --noEmit --project ${tsconfigPath}`,
          cwd: projectRoot,
        },
        cache: true,
        inputs: [
          `{projectRoot}/src/**/*.ts`,
          `{projectRoot}/tsconfig.lib.json`,
          `{projectRoot}/tsconfig.json`,
          `{projectRoot}/package.json`,
          { externalDependencies: ['@typescript/native-preview'] },
        ],
      };

      return [
        configFile,
        {
          projects: {
            [projectRoot]: {
              targets: {
                typecheck: typecheckTarget,
              },
            },
          },
        },
      ];
    });
  },
];
