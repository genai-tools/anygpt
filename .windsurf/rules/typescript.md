# TypeScript Rules

## Type Safety
- ❌ Never `any` | ✅ `unknown` OK (must narrow)
- ❌ Avoid `!` assertions | ✅ Use type guards, optional chaining
- ✅ Discriminated unions, `satisfies`, `as const`

## Modern Node.js
- ✅ `node:` protocol: `import { readFile } from 'node:fs/promises'`
- ✅ Native `fetch`, ESM, async APIs
- ❌ No deprecated/legacy APIs, callbacks, sync operations

## Dependencies
- ✅ Latest stable version always
- ✅ Evaluate: maintenance, TypeScript support, minimal deps, security
- ❌ No unmaintained (>1yr), vulnerable, or random versions

## Async by Default
- ✅ `async`/`await`, `Promise.all()` for parallel
- ✅ `Promise.allSettled()` for partial failures
- ❌ No sequential when parallel possible

## Error Handling
- ✅ Custom error classes with context
- ✅ `Result<T, E>` pattern for expected failures
- ✅ Type guards: `error is NodeJS.ErrnoException`
- ❌ Never swallow errors silently

## Advanced TypeScript
- ✅ Generics with constraints: `<T extends Config>`
- ✅ Conditional types: `T extends Promise<infer U> ? U : T`
- ✅ Mapped types: `{ readonly [K in keyof T]: T[K] }`
- ✅ Builder patterns with type safety

## Code Organization
- ✅ Readonly by default: `readonly string[]`, `readonly` properties
- ✅ Immutable patterns: return new objects
- ✅ Clear exports: `export type { }`, `export { }`

## Checklist
- [ ] No `any`, no `!` without justification
- [ ] Generics where appropriate
- [ ] `node:` protocol for built-ins
- [ ] Async operations, proper error handling
- [ ] Latest dependency versions
- [ ] Type guards for `unknown`
