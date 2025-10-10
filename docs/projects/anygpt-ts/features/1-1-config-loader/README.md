# Configuration Loader

|                      |                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Status**           | 🔄 In Progress                                                                           |
| **Progress**         | 16/20 tasks (80%)                                                                        |
| **Package**          | [`@anygpt/config`](../../../../packages/config/)                                         |
| **Spec**             | [Configuration Loader](../../../../products/anygpt/specs/README.md#configuration-loader) |
| **Use Case**         | [Flexible Configuration](../../../../products/anygpt/cases/flexible-configuration.md)    |
| **Architecture**     | [System Design](../../architecture.md)                                                   |
| **Roadmap**          | [Feature List](../../roadmap.md)                                                         |
| **Technical Design** | [design.md](./design.md)                                                                 |
| **Testing Strategy** | [tests.md](./tests.md)                                                                   |
| **Audit**            | [AUDIT.md](./AUDIT.md) - Implementation audit (2025-10-10)                               |

---

## Overview

Configuration loader that searches multiple locations, supports multiple formats (TypeScript, JavaScript, JSON, TOML), validates configuration, and dynamically loads connectors at runtime.

**Key Features Implemented**:

- ✅ Multi-location config search with priority
- ✅ TypeScript/JavaScript support via jiti (Node.js 22+ native TS)
- ✅ JSON and TOML (Codex compatibility) support
- ✅ Dynamic connector loading with caching
- ✅ Factory config pattern with model rules
- ✅ Default config fallback
- ✅ Codex migration support

## Status

**Last Updated**: 2025-10-10  
**Current Phase**: Testing & Error Handling

### Recent Updates

- 2025-10-10: **Implementation audit completed** - Feature is 80% complete
- 2025-10-10: Documentation reorganized (moved user guide to package)
- 2025-10-10: Dropped YAML and Zod requirements (not needed)
- 2025-01-10: Created feature documentation, ready to start

## Implementation Plan

### Setup (3/3 ✅)

- [x] Create config package structure (`packages/config/`)
- [x] Install dependencies (@anygpt/types, jiti for TS support)
- [x] Setup test infrastructure (Vitest)

### Phase 1: Basic Loading (5/6 - 83%)

- [x] Implement ConfigSearcher (file system search, path resolution) - `loader.ts`
- [ ] Write ConfigSearcher tests - **TODO**
- [x] Implement ConfigParser (JSON, TS/JS, TOML) - `loader.ts`
- [x] Implement ConfigValidator (basic validation) - `loader.ts:validateConfig()`
- [x] Implement basic loadConfig (orchestrate search → parse → validate) - `loader.ts`
- [x] Write integration tests - `loader.test.ts` (6 tests passing)

### Phase 2: Format Support (2/2 ✅)

- [x] Add TypeScript config support (jiti with tryNative) - `loader.ts:loadTSConfig()`
- [x] Write TypeScript config tests - `loader.test.ts` (6 tests)
- [x] **BONUS**: TOML support for Codex migration - `codex-parser.ts`
- ~~Add YAML config support~~ - **DROPPED** (not needed)
- ~~Write YAML config tests~~ - **DROPPED**

### Phase 3: Connector Loading (2/4 - 50%)

- [x] Implement ConnectorLoader (factory functions, dynamic loading) - `connector-loader.ts`
- [ ] Write ConnectorLoader tests - **TODO**
- [x] Integrate connector loading into loadConfig - `setup.ts`
- [ ] Write integration tests with connectors - **TODO**

### Phase 4: Error Handling (2/4 - 50%)

- [ ] Create custom error types (ConfigNotFoundError, ConfigParseError, etc.) - **TODO**
- [x] Add helpful error messages - Partial (using generic Error)
- [x] Implement default config fallback - `defaults.ts:getDefaultConfig()`
- [ ] Write error handling tests - **TODO**

### Documentation (1/1 ✅)

- [x] Write API documentation (JSDoc, README, examples) - `packages/config/README.md`

### Bonus Features (Not in Original Plan)

- [x] Factory config pattern - `factory.ts`
- [x] Model pattern resolver - `model-pattern-resolver.ts` (17 tests!)
- [x] Model resolver (tags, aliases) - `model-resolver.ts`
- [x] Tag registry - `tag-registry.ts`
- [x] Glob pattern matching - `glob-matcher.ts`
- [x] Setup utilities - `setup.ts`
- [x] Codex migration - `migrate.ts`, `codex-parser.ts`

**Total Progress**: 16/20 core tasks (80%)

## Remaining Work

### Critical (Must Complete)

1. **Custom Error Types** (2-3 hours)

   - Create `packages/config/src/errors.ts`
   - Define: ConfigNotFoundError, ConfigParseError, ConfigValidationError, ConnectorLoadError
   - Update all throw sites in loader.ts, connector-loader.ts

2. **Test Coverage** (6-8 hours)
   - Expand `loader.test.ts` - test all search paths, error cases
   - Create `connector-loader.test.ts` - test dynamic loading, caching
   - Add integration tests - test full config loading flow
   - Target: >60% coverage (currently 21%)

### Optional (Nice to Have)

- Zod schema validation (dropped for now)
- YAML support (dropped for now)
- E2E tests with real file system

## Dependencies

| Type            | Dependency                                               | Description             | Status       |
| --------------- | -------------------------------------------------------- | ----------------------- | ------------ |
| 📦 **Internal** | [@anygpt/types](../../../../packages/types/)             | Shared type definitions | ✅ Installed |
| 🌐 **External** | [jiti](https://www.npmjs.com/package/jiti)               | TypeScript loading      | ✅ Used      |
| 🌐 **External** | [@iarna/toml](https://www.npmjs.com/package/@iarna/toml) | TOML parsing (Codex)    | ✅ Used      |

## Test Coverage

**Current**: 26 tests passing, 20.91% coverage  
**Target**: >60% coverage

**Test Files**:

- ✅ `loader.test.ts` - 6 tests (TypeScript loading with jiti)
- ✅ `model-pattern-resolver.test.ts` - 17 tests (pattern matching)
- ✅ `setup.test.ts` - 3 tests (router setup)
- ❌ `connector-loader.test.ts` - **Missing**
- ❌ Integration tests - **Needs expansion**

**Coverage by File**:

```
loader.ts               15.55% ← Needs tests
connector-loader.ts      3.7%  ← Needs tests
setup.ts                  43%  ← Needs tests
model-pattern-resolver   84%  ✅ Good
glob-matcher.ts          56%  ← Needs tests
model-resolver.ts         0%  ← Needs tests
tag-registry.ts           0%  ← Needs tests
```

## Error Handling

**Current**: Using generic `Error` with descriptive messages  
**Planned**: Custom error types

- **ConfigNotFoundError**: No configuration file found (TODO)
- **ConfigParseError**: Failed to parse file (TODO)
- **ConfigValidationError**: Schema validation failed (TODO)
- **ConnectorLoadError**: Failed to load connector (TODO)

All errors will include clear messages and suggestions for fixing.

## Implementation Files

**Core Files** (`packages/config/src/`):

- `loader.ts` - Config search, parsing, loading (227 lines)
- `connector-loader.ts` - Dynamic connector loading (151 lines)
- `defaults.ts` - Default config and Codex conversion (135 lines)
- `setup.ts` - Router setup utilities (156 lines)
- `factory.ts` - Factory config pattern (124 lines)
- `model-pattern-resolver.ts` - Pattern-based model config (7,419 bytes)
- `model-resolver.ts` - Tag/alias resolution (8,085 bytes)
- `tag-registry.ts` - Pre-computed tag mappings (5,029 bytes)
- `glob-matcher.ts` - Glob pattern matching (3,430 bytes)
- `migrate.ts` - Codex migration (3,387 bytes)
- `codex-parser.ts` - TOML parsing (2,246 bytes)
- `index.ts` - Public API exports (77 lines)

**Total**: ~12 source files, ~2,500 lines of code
