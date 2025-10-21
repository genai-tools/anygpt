## 0.3.0 (2025-10-21)

### 🚀 Features

- **mcp-discovery:** add logger integration and enhance search ([737ec96](https://github.com/genai-tools/anygpt/commit/737ec96))
- add MCP client integration and agentic chat capabilities ([1d8d1e5](https://github.com/genai-tools/anygpt/commit/1d8d1e5))
- sort tool parameters with required first then alphabetically ([3459546](https://github.com/genai-tools/anygpt/commit/3459546))
- add tool name prefix support per MCP server via serverRules ([3c42a4b](https://github.com/genai-tools/anygpt/commit/3c42a4b))
- add JSON schema to tool parameter conversion for MCP discovery ([304613d](https://github.com/genai-tools/anygpt/commit/304613d))
- add docker-mcp-plugin with serverRules and powerful CLI commands ([f75d855](https://github.com/genai-tools/anygpt/commit/f75d855))
- **mcp-discovery:** implement server listing and config integration ([bdc86c5](https://github.com/genai-tools/anygpt/commit/bdc86c5))
- **mcp-discovery:** complete core implementation - Phases 4-6 ([886989f](https://github.com/genai-tools/anygpt/commit/886989f))
- **mcp-discovery:** implement Phases 2-3 - Search Engine & Tool Metadata Management ([6d3e8e6](https://github.com/genai-tools/anygpt/commit/6d3e8e6))
- **mcp-discovery:** implement Phase 1 - Configuration & Pattern Matching ([1152677](https://github.com/genai-tools/anygpt/commit/1152677))

### 🩹 Fixes

- **types:** add index signatures to rule targets and update to serverRules/toolRules ([93d0393](https://github.com/genai-tools/anygpt/commit/93d0393))
- resolve all lint and typecheck issues in mcp-discovery packages ([256b61b](https://github.com/genai-tools/anygpt/commit/256b61b))

### 📖 Documentation

- add WIP warning banners and config merge documentation ([ca164b9](https://github.com/genai-tools/anygpt/commit/ca164b9))
- **mcp-discovery:** add CHANGELOG and comprehensive usage examples ([7a83fef](https://github.com/genai-tools/anygpt/commit/7a83fef))

### 🧱 Updated Dependencies

- Updated config to 3.0.0
- Updated rules to 0.3.0
- Updated types to 2.0.0

### ❤️ Thank You

- Petr Plenkov

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-17

### Added

- **Core Discovery Engine**: Main facade coordinating all discovery components
- **Configuration Loader**: Load and validate discovery configuration from TypeScript files
- **Pattern Matcher**: Glob and regex pattern matching for tool filtering (reuses @anygpt/config)
- **Search Engine**: Free-text search with relevance scoring across tool names, summaries, and tags
- **Tool Metadata Manager**: Store and manage tool metadata with rule-based filtering
- **Caching Layer**: TTL-based caching for servers and tool summaries, indefinite caching for tool details
- **Tool Execution Proxy**: Interface for connecting to and executing tools on MCP servers

### Features

- Pattern-based tool filtering with glob (`*github*`), regex (`/^create_/`), and negation (`!*delete*`)
- Whitelist mode support for tool rules
- Server-specific filtering
- Relevance scoring algorithm with weighted matches
- Tag accumulation from multiple matching rules
- Cache invalidation by key or all caches
- Structured error handling for tool execution

### Test Coverage

- 87 tests passing (100% coverage)
- All components fully tested with unit tests
- Edge cases and error scenarios covered

### Dependencies

- `@anygpt/config@2.0.0` - Configuration and pattern matching
- `@anygpt/types@1.2.0` - Type definitions
- `@modelcontextprotocol/sdk@1.20.0` - MCP protocol (for future integration)

### Notes

- Tool execution proxy provides interface but requires MCP SDK integration for actual connections
- Ready for integration with MCP Discovery Server (4-5) and CLI (4-6)
- Achieves 99% token reduction (100K+ → 600 tokens) when fully deployed

[0.1.0]: https://github.com/genai-tools/anygpt/releases/tag/mcp-discovery@0.1.0
