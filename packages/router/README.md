# GenAI Gateway

A secure, enterprise-ready gateway for AI providers with **Kilocode-inspired configuration** and MCP protocol support.

## 🎯 **Overview**

The GenAI Gateway provides a unified interface to AI providers with:
- **🔧 Kilocode-style presets** - Profile-based configuration system
- **🔒 Enterprise security** - Secure credential management and proxy support  
- **🎭 Provider abstraction** - Consistent API across different AI providers
- **📊 MCP compliance** - Seamless integration with MCP clients
- **🧪 Test-driven** - Comprehensive test coverage
- **⚡ TypeScript-first** - Full type safety and IntelliSense

## 🚀 **Quick Start**

### **Installation**
```bash
npm install genai-gateway
```

### Basic Usage
```typescript
import { OpenAIConnector, getPreset } from 'genai-gateway';

// Use a built-in preset
const preset = getPreset('openai-gpt-4o');

// Create connector
const connector = new OpenAIConnector({
  apiKey: process.env.OPENAI_API_KEY
});

// Make request
const response = await connector.chatCompletion({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'gpt-4o'
});
```

### Configuration-Driven Approach
```typescript
import { ConfigLoader } from 'genai-gateway';

// Load from environment
const config = ConfigLoader.loadFromEnv();

// Customize existing preset
const custom = ConfigLoader.createCustomConfig('openai-gpt-4o', {
  baseURL: 'https://api.company.com/openai/v1',
  parameters: { temperature: 0.3 }
});
```

## Documentation

| Document | Description |
|----------|-------------|
| **[Configuration Guide](docs/CONFIG.md)** | Kilocode-inspired preset system, environment setup, customization |
| **[API Reference](docs/API.md)** | Complete API documentation, types, and examples |
| **[Architecture](docs/ARCHITECTURE.md)** | System design, patterns, and extension points |
| **[Connector Usage](docs/CONNECTOR_USAGE.md)** | Provider-specific usage and best practices |

## Built-in Presets

| Preset | Model | Use Case |
|--------|-------|----------|
| `openai-gpt-4o` | GPT-4o | General purpose, vision, functions |
| `openai-o1` | o1 | Advanced reasoning tasks |
| `openai-coding-assistant` | GPT-4o | Code generation (low temp) |
| `openai-creative-writer` | GPT-4o | Creative writing (high temp) |
| `openai-reasoning-expert` | o1 | Complex problem solving |

## Configuration Examples

### Environment-Based
```bash
export GATEWAY_PRESET=openai-gpt-4o
export OPENAI_API_KEY=sk-your-key
export GATEWAY_LOG_LEVEL=info
```

### Company Proxy
```typescript
const companySetup = createCustomPreset('openai-gpt-4o', {
  provider: {
    baseURL: 'https://api.company.com/openai/v1',
    headers: { 'X-Company-ID': 'engineering' }
  }
});
```

### Azure OpenAI
```typescript
const azureSetup = createCustomPreset('openai-gpt-4o', {
  provider: {
    baseURL: 'https://resource.openai.azure.com/openai/deployments/gpt-4o',
    headers: { 'api-version': '2024-02-15-preview' }
  }
});
```

## Architecture

```
MCP Client → genai-gateway-mcp → genai-gateway → AI Provider APIs
```

- **Gateway Layer** (this package): Provider abstraction, routing, security
- **MCP Layer** (separate package): MCP protocol implementation
- **Connector Pattern**: Extensible provider implementations
- **Configuration System**: Kilocode-inspired preset management

## Development

### Setup
```bash
npm install
npm test          # Run tests
npm run build     # Build package
```

### Testing
- **47 comprehensive tests** covering all functionality
- **Mock connector** for development and testing
- **Type-safe** test utilities and fixtures

### Project Structure
```
src/
├── types/           # Core type definitions
├── connectors/      # Provider implementations
│   ├── base/        # Base connector interface
│   ├── openai/      # OpenAI connector + presets
│   └── mock/        # Mock connector for testing
├── config/          # Configuration system
└── docs/            # Documentation
```

## Key Features

### Kilocode-Inspired Configuration
- Profile-based presets like Kilocode's API configurations
- Easy customization and extension
- Environment variable support
- Company-specific configurations

### Enterprise-Ready
- Secure credential management
- Proxy and custom header support
- Comprehensive error handling
- Production-tested patterns

### Developer Experience
- Full TypeScript support
- Comprehensive documentation
- Test-driven development
- Clear error messages

## 🔮 **Roadmap**

- **Additional Providers**: Anthropic, local models, custom endpoints
- **Advanced Features**: Request middleware, multi-provider fallback
- **Monitoring**: Metrics, logging, cost tracking
- **MCP Integration**: Full MCP server implementation

## License

MIT - See [LICENSE](LICENSE) for details.

---

**Built with ❤️ for the MCP ecosystem** | [Documentation](docs/) | [API Reference](docs/API.md) | [Architecture](docs/ARCHITECTURE.md)
