/**
 * Helper to create test configurations with fixtures
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Fixture } from '@anygpt/mock';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create a temporary config file with mock connector and fixtures
 * Creates it in the e2e/cli directory so it can resolve workspace packages
 */
/**
 * Serialize fixtures to TypeScript code, handling RegExp patterns
 */
function serializeFixtures(fixtures: Fixture[]): string {
  const serialized = fixtures.map(fixture => {
    const parts: string[] = [];
    parts.push(`  {`);
    parts.push(`    name: ${JSON.stringify(fixture.name)},`);
    
    // Serialize matcher
    if (fixture.matcher.type === 'exact') {
      parts.push(`    matcher: { type: 'exact', content: ${JSON.stringify(fixture.matcher.content)} },`);
    } else if (fixture.matcher.type === 'pattern') {
      const pattern = fixture.matcher.pattern as RegExp;
      parts.push(`    matcher: { type: 'pattern', pattern: ${pattern.toString()} },`);
    } else if (fixture.matcher.type === 'contains') {
      parts.push(`    matcher: { type: 'contains', substring: ${JSON.stringify(fixture.matcher.substring)} },`);
    }
    
    // Serialize response
    if (typeof fixture.response === 'string') {
      parts.push(`    response: ${JSON.stringify(fixture.response)}`);
    } else {
      parts.push(`    response: ${JSON.stringify(fixture.response)}`);
    }
    
    parts.push(`  }`);
    return parts.join('\n');
  });
  
  return `[\n${serialized.join(',\n')}\n]`;
}

export async function createTestConfig(fixtures: Fixture[]): Promise<string> {
  const testDir = join(__dirname, '..', 'tmp', `test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });

  const configPath = join(testDir, 'test.config.ts');
  
  // Serialize fixtures to TypeScript code with proper RegExp handling
  const fixturesCode = serializeFixtures(fixtures);
  
  const configContent = `
import { config } from '@anygpt/config';
import { mock } from '@anygpt/mock';

const fixtures = ${fixturesCode};

export default config({
  defaults: {
    provider: 'mock',
    model: 'mock-gpt-4'
  },
  providers: {
    mock: {
      name: 'Mock Provider for E2E Testing',
      connector: mock({ fixtures })
    }
  }
});
`;

  await writeFile(configPath, configContent, 'utf-8');
  return configPath;
}

/**
 * Create a config with custom settings
 */
export async function createCustomConfig(options: {
  fixtures?: Fixture[];
  delay?: number;
  failureRate?: number;
}): Promise<string> {
  const testDir = join(__dirname, '..', 'tmp', `test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });

  const configPath = join(testDir, 'test.config.ts');
  
  const configOptions = {
    ...(options.fixtures && { fixtures: options.fixtures }),
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.failureRate !== undefined && { failureRate: options.failureRate })
  };
  
  const configContent = `
import { config } from '@anygpt/config';
import { mock } from '@anygpt/mock';

export default config({
  defaults: {
    provider: 'mock',
    model: 'mock-gpt-4'
  },
  providers: {
    mock: {
      name: 'Mock Provider for E2E Testing',
      connector: mock(${JSON.stringify(configOptions, null, 2)})
    }
  }
});
`;

  await writeFile(configPath, configContent, 'utf-8');
  return configPath;
}
