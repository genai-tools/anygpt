# AnyGPT CLI

A powerful command-line interface for interacting with AI providers through the AnyGPT Router. Supports both stateless chat and stateful conversation management.

## 🎯 **Overview**

The AnyGPT CLI provides:
- **💬 Stateless Chat** - Quick one-off interactions with AI models
- **🗣️ Conversation Management** - Persistent, stateful conversations
- **🔧 Flexible Configuration** - Support for multiple providers and models
- **📊 Context Management** - Smart conversation context handling
- **🔀 Advanced Features** - Fork, summarize, and condense conversations
- **⚡ TypeScript-first** - Built with full type safety

## 🚀 **Quick Start**

### **Installation**
```bash
npm install -g @anygpt/cli
```

### **Basic Usage**
```bash
# Quick chat (stateless)
anygpt chat --model gpt-4o --token $OPENAI_API_KEY "Hello, world!"

# Start a conversation (stateful)
anygpt conversation start --model gpt-4o
anygpt conversation message "Hello, how are you?"
anygpt conversation message "Tell me about TypeScript"
```

## 📋 **Commands**

### **Chat Command (Stateless)**
Send a single message without maintaining conversation state.

```bash
anygpt chat [options] <message>
```

**Options:**
- `--provider <name>` - Provider name from config
- `--type <type>` - Provider type (openai, anthropic, google)
- `--url <url>` - API endpoint URL
- `--token <token>` - API token
- `--model <model>` - Model name (required)

**Examples:**
```bash
# Using OpenAI directly
anygpt chat --type openai --model gpt-4o --token $OPENAI_API_KEY "Explain quantum computing"

# Using custom endpoint
anygpt chat --url https://api.company.com/v1 --model gpt-4o --token $TOKEN "Hello"
```

### **Conversation Commands (Stateful)**

#### **Start a Conversation**
```bash
anygpt conversation start [options]
```

**Options:**
- `--provider <name>` - Provider name from config
- `--model <model>` - Model name
- `--name <name>` - Conversation name

**Examples:**
```bash
anygpt conversation start --model gpt-4o --name "coding-session"
anygpt conversation start --provider openai --model gpt-3.5-turbo
```

#### **Send Messages**
```bash
anygpt conversation message <message> [options]
```

**Options:**
- `--conversation <id>` - Specific conversation ID

**Examples:**
```bash
anygpt conversation message "How do I implement a binary tree?"
anygpt conversation message "Explain the time complexity" --conversation conv-123
```

#### **List Conversations**
```bash
anygpt conversation list
```

#### **Continue a Conversation**
```bash
anygpt conversation continue <id>
```

#### **Show Conversation History**
```bash
anygpt conversation show [options]
```

**Options:**
- `--conversation <id>` - Conversation ID to show
- `--limit <number>` - Limit number of messages
- `--format <format>` - Output format: full, compact, or json

**Examples:**
```bash
anygpt conversation show --limit 10
anygpt conversation show --format json --conversation conv-123
```

#### **Fork a Conversation**
Create a new conversation with the same history.

```bash
anygpt conversation fork [options]
```

**Options:**
- `--conversation <id>` - Conversation ID to fork
- `--model <model>` - Model for new conversation
- `--provider <provider>` - Provider for new conversation
- `--name <name>` - Name for new conversation

#### **Summarize a Conversation**
Create a new conversation with AI-generated summary.

```bash
anygpt conversation summarize [options]
```

**Options:**
- `--conversation <id>` - Conversation ID to summarize
- `--keep-recent <number>` - Number of recent messages to keep (default: 3)
- `--model <model>` - Model for new conversation
- `--provider <provider>` - Provider for new conversation
- `--name <name>` - Name for new conversation
- `--dry-run` - Show what would be summarized without creating

#### **Condense a Conversation**
Reduce conversation context using AI summarization.

```bash
anygpt conversation condense [options]
```

**Options:**
- `--conversation <id>` - Conversation ID to condense
- `--keep-recent <number>` - Number of recent messages to keep (default: 3)
- `--dry-run` - Show what would be condensed without applying

#### **Context Analysis**
Show detailed context statistics for a conversation.

```bash
anygpt conversation context [options]
```

**Options:**
- `--conversation <id>` - Conversation ID to analyze

#### **Delete a Conversation**
```bash
anygpt conversation delete <id>
```

#### **End Current Conversation**
```bash
anygpt conversation end
```

## ⚙️ **Configuration**

### **Configuration File**
Create a configuration file to define providers and default settings:

```bash
anygpt --config /path/to/config.toml
```

**Example config.toml:**
```toml
[providers.openai]
type = "openai"
api_key = "${OPENAI_API_KEY}"
base_url = "https://api.openai.com/v1"

[providers.company]
type = "openai"
api_key = "${COMPANY_API_KEY}"
base_url = "https://api.company.com/openai/v1"

[defaults]
provider = "openai"
model = "gpt-4o"
```

### **Environment Variables**
```bash
export OPENAI_API_KEY=sk-your-key
export ANYGPT_CONFIG_PATH=/path/to/config.toml
export ANYGPT_LOG_LEVEL=info
```

## 🏗️ **Architecture**

The CLI is built on top of the AnyGPT Router:

```
CLI Commands → @anygpt/cli → @anygpt/router → AI Provider APIs
```

- **Command Layer**: User interface and command parsing
- **Router Integration**: Leverages the router for provider abstraction
- **State Management**: Persistent conversation storage
- **Configuration**: Flexible provider and model configuration

## 💡 **Use Cases**

### **Development Workflow**
```bash
# Start a coding session
anygpt conversation start --name "api-development" --model gpt-4o

# Ask for help
anygpt conversation message "How do I implement JWT authentication in Node.js?"

# Continue the conversation
anygpt conversation message "Show me the middleware code"

# Fork for a different approach
anygpt conversation fork --name "api-development-v2"
```

### **Research and Learning**
```bash
# Quick questions
anygpt chat --model gpt-4o "What is the difference between REST and GraphQL?"

# Deep dive conversation
anygpt conversation start --name "learning-rust"
anygpt conversation message "I'm new to Rust. Where should I start?"
anygpt conversation message "Explain ownership and borrowing"
```

### **Content Creation**
```bash
# Start a writing session
anygpt conversation start --name "blog-post" --model gpt-4o

# Brainstorm ideas
anygpt conversation message "Help me brainstorm ideas for a blog post about TypeScript"

# Develop content
anygpt conversation message "Write an outline for the TypeScript generics topic"
```

## 🔧 **Development**

### **Setup**
```bash
npm install
npm run build
npm link  # For local development
```

### **Project Structure**
```
src/
├── commands/           # Command implementations
│   ├── chat.ts        # Stateless chat command
│   └── conversation/  # Conversation management commands
├── lib/               # Shared utilities
├── types/             # Type definitions
└── index.ts           # Main CLI entry point
```

## 🔮 **Roadmap**

- **Configuration UI**: Interactive configuration setup
- **Plugin System**: Extensible command plugins
- **Export/Import**: Conversation backup and restore
- **Templates**: Pre-defined conversation templates
- **Collaboration**: Shared conversations and workspaces
- **Integration**: IDE plugins and extensions

## 📝 **Examples**

### **Coding Assistant**
```bash
# Start a coding session
anygpt conversation start --name "debugging" --model gpt-4o

# Get help with an error
anygpt conversation message "I'm getting 'Cannot read property of undefined'. Here's my code: [paste code]"

# Ask for improvements
anygpt conversation message "How can I make this code more efficient?"
```

### **Learning Session**
```bash
# Start learning about a topic
anygpt conversation start --name "machine-learning" --model gpt-4o

# Ask questions
anygpt conversation message "Explain neural networks in simple terms"
anygpt conversation message "What's the difference between supervised and unsupervised learning?"

# Summarize for later review
anygpt conversation summarize --name "ml-summary"
```

## 📚 **Documentation**

For comprehensive documentation, see:
- **[Complete CLI Guide](./docs/README.md)** - Detailed usage documentation
- **[Chat Command](./docs/chat.md)** - Stateless AI interactions
- **[Conversation Command](./docs/conversation.md)** - Stateful conversations with advanced features
- **[Config Command](./docs/config.md)** - Configuration management

## 📄 **License**

MIT - See [LICENSE](LICENSE) for details.

---

**Built with ❤️ for developers** | Part of the AnyGPT ecosystem
