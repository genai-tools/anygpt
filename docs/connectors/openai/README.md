# OpenAI Connector - Workspace Documentation

> **Note:** This is workspace documentation for contributors. For user documentation, see the [package README](../../../packages/connectors/openai/README.md).

## Overview

This directory contains workspace-specific documentation for the OpenAI connector that is not published to NPM.

## Documentation

- **[Refactoring Guide](./refactoring.md)** - How we refactored from 830 lines to a modular structure
- **[Hooks Architecture](./hooks-architecture.md)** - Deep dive into the hook system design

## Published Documentation

User-facing documentation is in the package directory:

- **[Package README](../../../packages/connectors/openai/README.md)** - Main package documentation
- **[Hooks Guide](../../../packages/connectors/openai/HOOKS.md)** - User guide for the hook system
- **[Changelog](../../../packages/connectors/openai/CHANGELOG.md)** - Version history

## Development

### File Structure

```
packages/connectors/openai/
├── src/                    # Source code
│   ├── index.ts           # Main connector (220 lines)
│   ├── hooks.ts           # Hook system (150 lines)
│   ├── request-builders.ts # Request builders (85 lines)
│   ├── response-converters.ts # Response converters (42 lines)
│   ├── error-handler.ts   # Error handling (100 lines)
│   └── models.ts          # Model metadata (30 lines)
│
├── README.md              # User documentation
├── HOOKS.md               # Hook system guide
└── CHANGELOG.md           # Version history
```

### Building

```bash
# Build the package
npx nx build openai

# Run tests
npx nx test openai

# Type check
npx nx typecheck openai
```

### Testing

```bash
# Run all tests
npx nx test openai

# Run tests in watch mode
npx nx test openai --watch

# Run tests with coverage
npx nx test openai --coverage
```

## Contributing

When making changes:

1. **Update code** in `src/`
2. **Add tests** for new functionality
3. **Update user docs** in package README or HOOKS.md if public API changes
4. **Update workspace docs** here if architecture changes
5. **Update CHANGELOG.md** with your changes

## Documentation Guidelines

### What Goes in Package Docs (Published to NPM)

✅ User-facing API documentation  
✅ Usage examples and guides  
✅ Configuration options  
✅ Hook system usage  
✅ Troubleshooting

### What Goes in Workspace Docs (Not Published)

✅ Architecture decisions  
✅ Refactoring history  
✅ Implementation details  
✅ Development workflows  
✅ Contributor guidelines

## Related Documentation

- [Main Workspace Docs](../../README.md)
- [Router Package](../../router/README.md)
- [Types Package](../../types/README.md)
