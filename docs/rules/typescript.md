# TypeScript Development Rules

## Type Safety

### Strict Typing Requirements
- **Full Type Coverage**: Everything must be fully typed
  - ❌ **NEVER** use `any`
  - ✅ `unknown` is acceptable when type is genuinely unknown (must be narrowed before use)
  - ❌ Avoid non-null assertions (`!`) - use proper type guards or optional chaining
  - ✅ Use discriminated unions for complex type scenarios
  - ✅ Leverage `satisfies` operator for type validation without widening
  - ✅ Prefer `as const` for literal types over explicit type annotations

### Type Guards & Narrowing
```typescript
// ✅ Good - Proper type narrowing
function process(value: unknown): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  throw new TypeError('Expected string');
}

// ❌ Bad - Using any or non-null assertion
function process(value: any): string {
  return value!.toUpperCase();
}
```

## Modern Node.js Standards

### Latest APIs Only
- ✅ Use `node:` protocol for built-in imports
  ```typescript
  import { readFile } from 'node:fs/promises';
  import { join } from 'node:path';
  import { EventEmitter } from 'node:events';
  ```
- ✅ Use native `fetch` instead of `axios`/`node-fetch`
- ✅ Use `node:test` or modern frameworks (Vitest) over legacy test runners
- ✅ Prefer ESM (`import`/`export`) over CommonJS
- ❌ Avoid deprecated APIs - check [Node.js documentation](https://nodejs.org/api/deprecations.html)

### File System Operations
```typescript
// ✅ Good - Modern async APIs
import { readFile, writeFile } from 'node:fs/promises';

async function loadConfig(): Promise<Config> {
  const data = await readFile('config.json', 'utf-8');
  return JSON.parse(data);
}

// ❌ Bad - Legacy callback or sync APIs
import * as fs from 'fs';
const data = fs.readFileSync('config.json', 'utf-8');
```

## Dependency Management

### Choosing Dependencies
- **Evaluate Before Adding**: Consider these factors
  - ✅ Active maintenance (recent commits, issue responses)
  - ✅ Strong TypeScript support (native types, not just `@types/*`)
  - ✅ Minimal dependency tree
  - ✅ Good documentation and community
  - ❌ Avoid packages with security vulnerabilities
  - ❌ Avoid unmaintained packages (>1 year without updates)

### Version Selection
- **Always Latest Stable**: When adding new dependencies
  - ✅ Use latest stable version (check npm/GitHub releases)
  - ✅ Specify exact version or caret range (`^1.2.3`)
  - ❌ Never use random/outdated versions
  - ✅ Document version choice if pinning to specific version

```bash
# ✅ Good - Check latest version first
npm view <package> version
npm install <package>@latest

# ❌ Bad - Random version
npm install <package>@1.0.0  # without checking if newer exists
```

## Async Programming

### Async by Default
- **Prefer Async Operations**: Default to async patterns
  - ✅ Use `async`/`await` for asynchronous operations
  - ✅ Return `Promise<T>` for async functions
  - ✅ Use `Promise.all()` for parallel operations
  - ✅ Use `Promise.allSettled()` when some failures are acceptable
  - ❌ Avoid blocking synchronous operations in async contexts

```typescript
// ✅ Good - Async by default with parallel execution
async function loadMultipleConfigs(
  paths: readonly string[]
): Promise<Config[]> {
  const promises = paths.map(path => loadConfig(path));
  return Promise.all(promises);
}

// ✅ Good - Handling partial failures
async function loadConfigsSafely(
  paths: readonly string[]
): Promise<Array<Config | Error>> {
  const results = await Promise.allSettled(
    paths.map(path => loadConfig(path))
  );
  
  return results.map(result =>
    result.status === 'fulfilled' ? result.value : result.reason
  );
}

// ❌ Bad - Sequential when parallel is possible
async function loadMultipleConfigs(paths: string[]): Promise<Config[]> {
  const configs: Config[] = [];
  for (const path of paths) {
    configs.push(await loadConfig(path));  // Sequential!
  }
  return configs;
}
```

## Exception Handling

### Proper Error Handling
- **Explicit Error Management**: Handle errors at appropriate boundaries
  - ✅ Use custom error classes for domain-specific errors
  - ✅ Catch and handle errors at service boundaries
  - ✅ Provide context in error messages
  - ✅ Use `Result<T, E>` pattern for expected failures
  - ❌ Never swallow errors silently
  - ❌ Avoid generic `catch (error)` without proper handling

```typescript
// ✅ Good - Custom error classes
class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// ✅ Good - Proper error handling with context
async function loadConfig(path: string): Promise<Config> {
  try {
    const data = await readFile(path, 'utf-8');
    return parseConfig(data);
  } catch (error) {
    throw new ConfigurationError(
      `Failed to load configuration from ${path}`,
      path,
      error instanceof Error ? error : undefined
    );
  }
}

// ✅ Good - Result pattern for expected failures
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

async function tryLoadConfig(path: string): Promise<Result<Config>> {
  try {
    const config = await loadConfig(path);
    return { success: true, value: config };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// ❌ Bad - Silent error swallowing
async function loadConfig(path: string): Promise<Config | null> {
  try {
    const data = await readFile(path, 'utf-8');
    return parseConfig(data);
  } catch {
    return null;  // Lost error context!
  }
}
```

### Error Type Guards
```typescript
// ✅ Good - Type-safe error handling
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  );
}

async function safeReadFile(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new ConfigurationError(`File not found: ${path}`, path, error);
    }
    throw error;
  }
}
```

## Advanced TypeScript Features

### Generic Functions
- **Leverage Generics**: Use TypeScript's full power
  - ✅ Write reusable, type-safe generic functions
  - ✅ Use constraints to restrict generic types
  - ✅ Infer types when possible
  - ✅ Use conditional types for advanced scenarios

```typescript
// ✅ Good - Generic with constraints
async function fetchJson<T>(
  url: string,
  validator: (data: unknown) => data is T
): Promise<T> {
  const response = await fetch(url);
  const data: unknown = await response.json();
  
  if (!validator(data)) {
    throw new TypeError('Invalid response format');
  }
  
  return data;
}

// ✅ Good - Generic utility with inference
function pick<T, K extends keyof T>(
  obj: T,
  ...keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

// ✅ Good - Conditional types
type Awaited<T> = T extends Promise<infer U> ? U : T;
type UnwrapArray<T> = T extends Array<infer U> ? U : T;

// ✅ Good - Mapped types
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};
```

### Advanced Type Patterns
```typescript
// ✅ Discriminated unions
type Result<T, E = Error> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: E }
  | { status: 'loading' };

function handleResult<T>(result: Result<T>): void {
  switch (result.status) {
    case 'success':
      console.log(result.data);  // Type: T
      break;
    case 'error':
      console.error(result.error);  // Type: Error
      break;
    case 'loading':
      console.log('Loading...');
      break;
  }
}

// ✅ Builder pattern with type safety
class QueryBuilder<T, TSelected = T> {
  private constructor(
    private readonly query: string,
    private readonly params: unknown[]
  ) {}

  static create<T>(): QueryBuilder<T, T> {
    return new QueryBuilder('', []);
  }

  where(condition: string, ...params: unknown[]): QueryBuilder<T, TSelected> {
    return new QueryBuilder(
      `${this.query} WHERE ${condition}`,
      [...this.params, ...params]
    );
  }

  select<K extends keyof T>(
    ...fields: readonly K[]
  ): QueryBuilder<T, Pick<T, K>> {
    const fieldList = fields.join(', ');
    return new QueryBuilder(
      `SELECT ${fieldList} FROM ${this.query}`,
      this.params
    ) as QueryBuilder<T, Pick<T, K>>;
  }

  async execute(): Promise<TSelected[]> {
    // Execute query
    return [] as TSelected[];
  }
}

// Usage
const users = await QueryBuilder.create<User>()
  .where('age > ?', 18)
  .select('id', 'name')  // Type: Pick<User, 'id' | 'name'>[]
  .execute();
```

## Code Organization

### Module Structure
```typescript
// ✅ Good - Clear exports with types
export type { Config, ConfigOptions } from './types.js';
export { loadConfig, validateConfig } from './loader.js';
export { ConfigurationError } from './errors.js';

// ✅ Good - Barrel exports with explicit re-exports
export * from './public-api.js';
export type * from './types.js';
```

### Immutability
```typescript
// ✅ Good - Readonly by default
interface Config {
  readonly host: string;
  readonly port: number;
  readonly options: readonly string[];
}

function updateConfig(config: Config, port: number): Config {
  return { ...config, port };  // Return new object
}

// ✅ Good - Readonly parameters
function processItems(items: readonly string[]): string[] {
  return items.map(item => item.toUpperCase());
}
```

## Testing

### Type-Safe Tests
```typescript
// ✅ Good - Fully typed test utilities
import { describe, it, expect } from 'vitest';

describe('loadConfig', () => {
  it('should load valid configuration', async () => {
    const config = await loadConfig('test-config.json');
    
    expect(config).toMatchObject({
      host: expect.any(String),
      port: expect.any(Number)
    });
    
    // Type-safe assertions
    expect(config.host).toBe('localhost');
    expect(config.port).toBeGreaterThan(0);
  });

  it('should throw ConfigurationError for invalid file', async () => {
    await expect(
      loadConfig('nonexistent.json')
    ).rejects.toThrow(ConfigurationError);
  });
});
```

## Performance Considerations

### Efficient Type Usage
```typescript
// ✅ Good - Use const assertions for performance
const ROUTES = [
  { path: '/api/users', method: 'GET' },
  { path: '/api/posts', method: 'POST' }
] as const;

type Route = typeof ROUTES[number];

// ✅ Good - Lazy evaluation
type LazyConfig = () => Config;

function createLazyConfig(path: string): LazyConfig {
  let cached: Config | undefined;
  return () => {
    if (!cached) {
      cached = loadConfigSync(path);
    }
    return cached;
  };
}
```

## Summary Checklist

Before committing TypeScript code, verify:

- [ ] No `any` types used
- [ ] No non-null assertions (`!`) without justification
- [ ] All functions are properly typed with generics where appropriate
- [ ] Using `node:` protocol for Node.js built-ins
- [ ] Async operations use `async`/`await`
- [ ] Errors are properly handled with context
- [ ] New dependencies are latest stable versions
- [ ] No deprecated Node.js APIs used
- [ ] Proper type guards for `unknown` values
- [ ] Immutable data structures where possible
