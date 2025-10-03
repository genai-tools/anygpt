# AnyGPT Router

A secure, enterprise-ready router for AI providers with flexible configuration and MCP protocol support.

## 🎯 **Overview**

The AnyGPT Router provides a unified interface to AI providers with:
- **🔧 Flexible configuration** - Provider-based configuration system
- **🔒 Enterprise security** - Secure credential management and proxy support  
- **🎭 Provider abstraction** - Consistent API across different AI providers
- **📊 MCP compliance** - Seamless integration with MCP clients
- **🧪 Test-driven** - Comprehensive test coverage
- **⚡ TypeScript-first** - Full type safety and IntelliSense

## 🚀 **Quick Start**

### **Installation**
```bash
npm install @anygpt/router
```

### Basic Usage
```typescript
import { OpenAIConnector, createRouter } from '@anygpt/router';

// Create connector
const connector = new OpenAIConnector({
  apiKey: process.env.OPENAI_API_KEY
});

// Create router
const router = createRouter({
  providers: {
    openai: connector
  }
});

// Make request
const response = await connector.chatCompletion({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'gpt-4o'
});
```

### Configuration-Driven Approach
```typescript
import { defineConfig, createRouter } from '@anygpt/router';

// Define configuration
const config = defineConfig({
  providers: {
    openai: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.company.com/openai/v1'
    }
  }
});

// Create router with config
const router = createRouter(config);
```

## Documentation

| Document | Description |
|----------|-------------|
| **[Configuration Guide](docs/CONFIG.md)** | Provider configuration system, environment setup, customization |
| **[API Reference](docs/API.md)** | Complete API documentation, types, and examples |
| **[Architecture](docs/ARCHITECTURE.md)** | System design, patterns, and extension points |
| **[Connector Usage](docs/CONNECTOR_USAGE.md)** | Provider-specific usage and best practices |

## Supported Providers

| Provider | Models | Features |
|----------|--------|----------|
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5, o1 | Chat completion, function calling, vision |
| **Mock** | test-model | Development and testing |

## Configuration Examples

### Environment-Based
```bash
export OPENAI_API_KEY=sk-your-key
export ANYGPT_LOG_LEVEL=info
```

### Company Proxy
```typescript
import { defineConfig } from '@anygpt/router';

const config = defineConfig({
  providers: {
    openai: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.company.com/openai/v1',
      headers: { 'X-Company-ID': 'engineering' }
    }
  }
});
```

### Azure OpenAI
```typescript
import { defineConfig } from '@anygpt/router';

const config = defineConfig({
  providers: {
    azure: {
      type: 'openai',
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: 'https://resource.openai.azure.com/openai/deployments/gpt-4o',
      headers: { 'api-version': '2024-02-15-preview' }
    }
  }
});
```

## Architecture

```
MCP Client → @anygpt/mcp → @anygpt/router → AI Provider APIs
```

- **Router Layer** (this package): Provider abstraction, routing, security
- **MCP Layer** (separate package): MCP protocol implementation
- **Connector Pattern**: Extensible provider implementations
- **Configuration System**: Flexible provider-based configuration

## Development

### Setup
```bash
npm install
npm test          # Run tests
npm run build     # Build package
```

### Testing
- **Comprehensive test coverage** for all functionality
- **Mock connector** for development and testing
- **Type-safe** test utilities and fixtures

### Project Structure
```
src/
├── types/           # Core type definitions
├── connectors/      # Provider implementations
│   ├── base/        # Base connector interface
│   ├── openai/      # OpenAI connector implementation
│   └── registry.ts  # Connector registry
├── lib/             # Core router implementation
└── config.ts        # Configuration system
```

## Key Features

### **Flexible Configuration**
- Provider-based configuration system
- Easy customization and extension
- Environment variable support
- Company-specific configurations

### **Enterprise-Ready**
- Secure credential management
- Proxy and custom header support
- Comprehensive error handling
- Production-tested patterns

### **Developer Experience**
- Full TypeScript support
- Comprehensive documentation
- Test-driven development
- Clear error messages

## 🔮 **Roadmap**

- **Additional Providers**: Anthropic, Google, local models, custom endpoints
- **Advanced Features**: Request middleware, multi-provider fallback
- **Monitoring**: Metrics, logging, cost tracking
- **Enhanced MCP Integration**: Advanced MCP server features

## License

MIT - See [LICENSE](LICENSE) for details.

---

**Built with ❤️ for the MCP ecosystem** | [Documentation](docs/) | [API Reference](docs/API.md) | [Architecture](docs/ARCHITECTURE.md)
