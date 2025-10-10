# Configuration

AnyGPT uses TypeScript-based configuration files for flexible provider setup.

## Quick Start

See the **[@anygpt/config package documentation](../../../packages/config/README.md)** for complete configuration guide.

## Key Concepts

- **Private config folder** (`.anygpt/`) - Git-ignored for security
- **Multiple providers** - OpenAI, Anthropic, custom gateways
- **Factory config** - Modern API with type safety
- **Model rules** - Pattern-based configuration

## Documentation

- **[User Guide](../../../packages/config/docs/USER_GUIDE.md)** - Complete configuration guide with examples
- **[Package README](../../../packages/config/README.md)** - API reference and features
- **[Model Rules Guide](../../../packages/config/docs/MODEL_RULES.md)** - Advanced pattern-based configuration
- **[CLI Config Command](../../../packages/cli/docs/config.md)** - CLI configuration management

## Security

**Never commit `.anygpt/` folder** - it's automatically excluded from git to protect:

- API keys
- Company gateway URLs
- Internal service endpoints
- Authentication tokens

Use environment variables for sensitive data and share config templates, not actual config files.
