## 0.3.0 (2025-10-21)

### 🚀 Features

- **rules:** add type-safe rule engine package ([64d315b](https://github.com/genai-tools/anygpt/commit/64d315b))

### 📖 Documentation

- add WIP warning banners and config merge documentation ([ca164b9](https://github.com/genai-tools/anygpt/commit/ca164b9))

### ❤️ Thank You

- Petr Plenkov

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-10-19

### Added

- Initial release of @anygpt/rules
- Type-safe rule engine for matching and transforming objects
- Shortcut syntax for cleaner rules (direct values, regex, arrays)
- Mixed arrays support (combine regex and exact matches)
- Logical operators: `and`, `or`, `not`
- Implicit AND for multiple fields
- Default values at constructor level
- `push` operation for appending to arrays
- 100% test coverage (46 tests)
- Full TypeScript support with strict type constraints
- Zero dependencies - pure TypeScript implementation

### Features

- **Operators**: `eq`, `in`, `match` (regex/glob patterns)
- **Shortcuts**: Direct values, RegExp, arrays
- **Type Safety**: Only primitives and arrays allowed
- **Reserved Keys**: Prevents use of `and`, `or`, `not` as field names
