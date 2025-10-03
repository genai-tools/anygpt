# Gateway API Reference

Complete API reference for the GenAI Gateway.

## 📚 **Core Exports**

```typescript
import { 
  // Connectors
  OpenAIConnector,
  MockConnector,
  
  // Configuration
  ConfigLoader,
  getPreset,
  createCustomPreset,
  listPresets,
  
  // Types
  type GatewayProfile,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type ModelInfo
} from 'genai-gateway';
```

## 🔌 **Connectors**

### **OpenAIConnector**

#### **Constructor**
```typescript
new OpenAIConnector(config?: OpenAIConnectorConfig)
```

**Parameters:**
- `config.apiKey?: string` - OpenAI API key
- `config.baseURL?: string` - Custom API endpoint
- `config.timeout?: number` - Request timeout (default: 30000ms)
- `config.maxRetries?: number` - Max retry attempts (default: 3)
- `config.logger?: Logger` - Custom logger instance

#### **Methods**

##### **chatCompletion()**
```typescript
async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>
```

**Request Parameters:**
```typescript
interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;                    // Default: 'gpt-3.5-turbo'
  temperature?: number;              // 0-2, default: 0.7
  max_tokens?: number;               // Max tokens to generate
  top_p?: number;                    // 0-1, default: 1
  frequency_penalty?: number;        // -2 to 2, default: 0
  presence_penalty?: number;         // -2 to 2, default: 0
  stream?: boolean;                  // Default: false
  
  // OpenAI-specific
  verbosity?: 'low' | 'medium' | 'high';     // GPT-4o verbosity
  reasoningEffort?: 'low' | 'medium' | 'high'; // o1 reasoning effort
}
```

**Response:**
```typescript
interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

##### **listModels()**
```typescript
async listModels(): Promise<ModelInfo[]>
```

**Response:**
```typescript
interface ModelInfo {
  id: string;                        // Model identifier
  provider: string;                  // Provider name
  display_name: string;              // Human-readable name
  capabilities: ModelCapabilities;   // Model capabilities
}

interface ModelCapabilities {
  input: {
    text: boolean;
    image?: boolean;
    audio?: boolean;
  };
  output: {
    text: boolean;
    structured?: boolean;
    function_calling?: boolean;
    streaming?: boolean;
    verbosity_control?: boolean;
  };
  reasoning?: {
    enabled: boolean;
    effort_control?: boolean;
  };
}
```

##### **Other Methods**
```typescript
getProviderId(): string              // Returns 'openai'
getConfig(): OpenAIConnectorConfig   // Returns current config
isInitialized(): boolean             // Check if client is ready
```

### **MockConnector**

Test connector with predictable responses.

```typescript
new MockConnector(config?: MockConnectorConfig)
```

**Configuration:**
- `config.delay?: number` - Artificial delay (ms)
- `config.failureRate?: number` - Failure probability (0-1)
- `config.logger?: Logger` - Custom logger

## ⚙️ **Configuration System**

### **ConfigLoader**

#### **Static Methods**

##### **loadFromEnv()**
```typescript
static loadFromEnv(): GatewayConfig
```

**Environment Variables:**
- `GATEWAY_PRESET` - Preset name to use
- `GATEWAY_BASE_URL` - Custom API endpoint
- `GATEWAY_MODEL` - Model identifier
- `GATEWAY_API_KEY` - API key
- `GATEWAY_TEMPERATURE` - Temperature setting
- `GATEWAY_STREAMING` - Enable streaming
- `GATEWAY_LOG_LEVEL` - Log level

##### **createCustomConfig()**
```typescript
static createCustomConfig(
  basePreset: string,
  customizations: {
    baseURL?: string;
    modelId?: string;
    modelPrefix?: string;
    parameters?: Record<string, any>;
  }
): GatewayProfile
```

##### **generateExampleConfig()**
```typescript
static generateExampleConfig(): GatewayConfig
```

### **Preset Functions**

#### **getPreset()**
```typescript
function getPreset(slug: string): GatewayProfile | undefined
```

**Available Presets:**
- `openai-gpt-4o` - GPT-4o flagship model
- `openai-o1` - o1 reasoning model
- `openai-gpt-4o-mini` - Efficient GPT-4o mini
- `openai-gpt-3-5-turbo` - Legacy GPT-3.5
- `openai-coding-assistant` - Code generation (low temp)
- `openai-creative-writer` - Creative writing (high temp)
- `openai-reasoning-expert` - Complex reasoning (o1)

#### **listPresets()**
```typescript
function listPresets(): GatewayProfile[]
```

#### **createCustomPreset()**
```typescript
function createCustomPreset(
  basePreset: string,
  overrides: Partial<GatewayProfile>
): GatewayProfile
```

## 🎯 **Type Definitions**

### **GatewayProfile**
```typescript
interface GatewayProfile {
  slug: string;                      // Unique identifier
  name: string;                      // Display name
  description?: string;              // Description
  provider: ProviderConfig;          // Provider settings
  model: ModelConfig;                // Model settings
  parameters?: RequestParameters;    // Default parameters
  context?: ContextConfig;           // Context settings
}
```

### **ProviderConfig**
```typescript
interface ProviderConfig {
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  baseURL?: string;                  // API endpoint
  apiKey?: string;                   // API key (supports ${VAR})
  headers?: Record<string, string>;  // Custom headers
  timeout?: number;                  // Request timeout
  maxRetries?: number;               // Retry attempts
}
```

### **ModelConfig**
```typescript
interface ModelConfig {
  id: string;                        // Model identifier
  displayName?: string;              // Override display name
  prefix?: string;                   // Model prefix
}
```

### **RequestParameters**
```typescript
interface RequestParameters {
  temperature?: number;              // 0-2
  maxTokens?: number;                // Max output tokens
  topP?: number;                     // 0-1
  frequencyPenalty?: number;         // -2 to 2
  presencePenalty?: number;          // -2 to 2
  streaming?: boolean;               // Enable streaming
  verbosity?: 'low' | 'medium' | 'high';     // OpenAI verbosity
  reasoningEffort?: 'low' | 'medium' | 'high'; // OpenAI reasoning
}
```

### **ContextConfig**
```typescript
interface ContextConfig {
  systemPrompt?: string;             // System message
  contextWindow?: number;            // Context window size
  memory?: {
    enabled: boolean;
    maxMessages?: number;
    summarizeAfter?: number;
  };
}
```

## 🔧 **Usage Examples**

### **Basic Usage**
```typescript
import { OpenAIConnector } from 'genai-gateway';

const connector = new OpenAIConnector({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await connector.chatCompletion({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'gpt-4o'
});
```

### **Using Presets**
```typescript
import { getPreset, ConfigLoader } from 'genai-gateway';

// Use preset as-is
const preset = getPreset('openai-gpt-4o');

// Customize preset
const custom = ConfigLoader.createCustomConfig('openai-gpt-4o', {
  baseURL: 'https://api.company.com/openai/v1',
  parameters: { temperature: 0.3 }
});
```

### **Environment Configuration**
```bash
export GATEWAY_PRESET=openai-gpt-4o
export OPENAI_API_KEY=sk-your-key
```

```typescript
import { ConfigLoader } from 'genai-gateway';

const config = ConfigLoader.loadFromEnv();
```

## ❌ **Error Handling**

### **Common Errors**
- `OpenAI client not initialized` - Missing API key
- `Model not found` - Invalid model ID
- `Rate limit exceeded` - API rate limiting
- `Invalid request` - Malformed request

### **Error Format**
```typescript
// Errors follow the pattern: "{provider} {operation} failed: {message}"
throw new Error('openai chat completion failed: Rate limit exceeded');
```

## 🧪 **Testing**

### **Mock Connector**
```typescript
import { MockConnector } from 'genai-gateway';

const mock = new MockConnector({
  delay: 100,        // 100ms delay
  failureRate: 0.1   // 10% failure rate
});
```

### **Test Utilities**
```typescript
// All connectors implement the same interface
function testConnector(connector: BaseConnector) {
  // Test implementation
}
```

This API reference covers all public interfaces and methods available in the GenAI Gateway.
