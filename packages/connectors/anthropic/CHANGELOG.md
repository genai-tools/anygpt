## 0.2.0 (2025-10-14)

### 🚀 Features

- **connectors:** add Anthropic connector with API model listing ([072032b](https://github.com/genai-tools/anygpt/commit/072032b))

### 🩹 Fixes

- resolve router lint and anthropic test failures ([f41ced4](https://github.com/genai-tools/anygpt/commit/f41ced4))
- resolve typecheck failures and tsgo race conditions ([88b3915](https://github.com/genai-tools/anygpt/commit/88b3915))

### 🧱 Updated Dependencies

- Updated router to 0.5.0

### ❤️ Thank You

- Petr Plenkov

# Changelog

All notable changes to the @anygpt/anthropic package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-11

### Added

- Initial release of @anygpt/anthropic connector
- Native Anthropic API support using @anthropic-ai/sdk v0.65.0 (latest)
- Support for Claude Sonnet, Opus, and Haiku models
- Custom endpoint support for corporate gateways
- Extended thinking support via extra_body parameters
- Proper max_tokens parameter handling (Anthropic-style)
- Factory function `anthropic()` for cleaner configuration
- Full TypeScript support with type definitions
- Comprehensive error handling and logging
- Basic test suite

### Features

- Chat completion support with native Anthropic Messages API
- System prompt handling (separate from messages)
- Model listing with static Claude model definitions
- Custom headers support for authentication
- Configurable timeout and retry settings
- Provider ID override for custom gateway names
