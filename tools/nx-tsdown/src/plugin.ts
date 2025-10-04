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
        outputs: [`{projectRoot}/dist`],
        cache: true,
        inputs: [
          `{projectRoot}/src/**/*.ts`,
          `{projectRoot}/tsconfig.lib.json`,
          `{projectRoot}/tsdown.config.ts`,
          `{projectRoot}/package.json`,
          { externalDependencies: ['tsdown'] },
        ],
        dependsOn: ['^build'],
      };

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

      // Check if project has vitest config
      const hasVitestConfig = existsSync(join(workspaceRoot, projectRoot, 'vitest.config.ts')) ||
                              existsSync(join(workspaceRoot, projectRoot, 'vite.config.ts'));

      const targets: Record<string, any> = {
        build: buildTarget,
        typecheck: typecheckTarget,
        watch: watchTarget,
        clean: cleanTarget,
      };

      // Add test target if vitest config exists
      if (hasVitestConfig) {
        targets.test = {
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
      }

      return [
        configFile,
        {
          projects: {
            [projectRoot]: {
              targets,
            },
          },
        },
      ];
    });
  },
];

