# Gateway Architecture

This document describes the architecture and design principles of the GenAI Gateway.

## 🏗️ **Core Architecture**

```
MCP Client → genai-gateway-mcp → genai-gateway → AI Provider APIs
```

### **Components:**

#### **1. Gateway Layer (This Package)**
- **Purpose**: Secure proxy service managing AI provider credentials and routing
- **Responsibilities**:
  - Provider abstraction and routing
  - Request/response transformation
  - Authentication and authorization
  - Rate limiting and monitoring
  - Error handling and retry logic

#### **2. MCP Layer (Separate Package)**
- **Purpose**: Protocol translator converting MCP requests to AI provider API calls
- **Responsibilities**:
  - MCP protocol implementation
  - Request validation and sanitization
  - Response formatting for MCP clients
  - Tool and resource management

## 🎯 **Design Principles**

### **1. Provider Abstraction**
```typescript
interface BaseConnector {
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  listModels(): Promise<ModelInfo[]>;
}
```

### **2. Configuration-Driven**
```typescript
// Kilocode-inspired preset system
const preset = getPreset('openai-gpt-4o');
const custom = createCustomPreset('openai-gpt-4o', {
  provider: { baseURL: 'https://api.company.com/openai/v1' }
});
```

### **3. Type Safety**
- Full TypeScript support
- Validated interfaces
- Compile-time error checking

### **4. Testability**
- Unit tests for all components
- Mock connectors for testing
- Integration test support

## 📦 **Package Structure**

```
src/
├── types/           # Core type definitions
├── connectors/      # Provider implementations
│   ├── base/        # Base connector interface
│   ├── openai/      # OpenAI connector + presets
│   └── mock/        # Mock connector for testing
├── config/          # Configuration system
│   ├── types.ts     # Config type definitions
│   ├── presets.ts   # Built-in presets
│   └── loader.ts    # Config loading utilities
└── index.ts         # Main exports
```

## 🔌 **Connector Pattern**

### **Base Connector**
```typescript
abstract class BaseConnector {
  protected abstract client: any;
  
  abstract chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  abstract listModels(): Promise<ModelInfo[]>;
  
  // Common functionality
  protected validateRequest(request: ChatCompletionRequest): ChatCompletionRequest;
  protected handleError(error: unknown, operation: string): never;
}
```

### **Provider Implementation**
```typescript
class OpenAIConnector extends BaseConnector {
  private client: OpenAI | null = null;
  
  constructor(config?: OpenAIConnectorConfig) {
    super(config);
    if (config?.apiKey) {
      this.client = new OpenAI(config);
    }
  }
  
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Implementation
  }
}
```

## 🎛️ **Configuration System**

### **Preset Architecture**
```typescript
// Presets live with their connectors
src/connectors/openai/presets.ts  // OpenAI-specific presets
src/config/presets.ts             // Aggregated presets
```

### **Customization Layers**
1. **Built-in presets** - Ready-to-use configurations
2. **Custom presets** - Extended from built-ins
3. **Environment overrides** - Runtime configuration
4. **Dynamic configuration** - Programmatic setup

## 🔒 **Security Considerations**

### **API Key Management**
- Environment variable references (`${OPENAI_API_KEY}`)
- No hardcoded credentials
- Secure credential resolution

### **Request Validation**
- Input sanitization
- Parameter validation and clamping
- Model capability checking

### **Error Handling**
- No sensitive data in error messages
- Proper error propagation
- Logging without credential exposure

## 🚀 **Performance Optimizations**

### **Connection Management**
- HTTP client reuse
- Connection pooling
- Timeout configuration

### **Request Optimization**
- Parameter validation before API calls
- Efficient model selection
- Streaming support where available

### **Caching Strategy**
- Model list caching
- Configuration caching
- Response caching (future)

## 🧪 **Testing Strategy**

### **Unit Tests**
- Connector functionality
- Configuration system
- Type validation
- Error handling

### **Integration Tests**
- End-to-end request flow
- Provider compatibility
- Configuration loading

### **Mock Testing**
- MockConnector for development
- Predictable responses
- Error simulation

## 🔮 **Future Extensions**

### **Additional Providers**
```typescript
// Easy to add new providers
src/connectors/anthropic/
src/connectors/local/
src/connectors/custom/
```

### **Advanced Features**
- Request/response middleware
- Advanced routing logic
- Multi-provider fallback
- Cost optimization
- Usage analytics

## 📊 **Monitoring & Observability**

### **Logging**
- MCP-compliant logging (stderr)
- Structured log format
- Configurable log levels

### **Metrics** (Future)
- Request/response metrics
- Provider performance
- Error rates
- Cost tracking

This architecture provides a solid foundation for the GenAI Gateway while maintaining flexibility for future enhancements.
