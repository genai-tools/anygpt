# Chat Command

The `chat` command provides **stateless**, one-off interactions with AI models. Each chat is independent with no memory of previous messages.

## Concept

Chat is the simplest way to interact with AI models through AnyGPT:
- **Stateless**: No conversation history or context
- **Immediate**: Send a message, get a response, done
- **Lightweight**: No storage or session management
- **Fast**: Perfect for quick questions or one-time tasks

## Basic Usage

```bash
# Simple chat using default configuration
npx anygpt chat "What is TypeScript?"

# Output:
👤 What is TypeScript?
🤖 TypeScript is a strongly typed programming language that builds on JavaScript...
📊 Usage: 4 input + 89 output = 93 tokens
```

## Command Syntax

```bash
npx anygpt chat [options] <message>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `message` | The message to send to the AI | Yes |

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--provider <name>` | Provider name from config | From config defaults |
| `--model <model>` | Model name | From config defaults |
| `--type <type>` | Provider type (openai, anthropic, google) | Auto-detected |
| `--url <url>` | API endpoint URL | From provider config |
| `--token <token>` | API token | From provider config |

## Examples

### Using Default Configuration

```bash
# Uses default provider and model from your config
npx anygpt chat "Explain async/await in JavaScript"
```

### Override Provider

```bash
# Use a specific provider from your config
npx anygpt chat "Write a Python function" --provider openai
```

### Override Model

```bash
# Use a specific model
npx anygpt chat "Translate to Spanish: Hello world" --model gpt-4o
```

### Direct API Access

```bash
# Bypass config and use direct API parameters
npx anygpt chat "What's the weather?" \
  --type openai \
  --url "https://api.openai.com/v1" \
  --token "sk-..." \
  --model "gpt-3.5-turbo"
```

## When to Use Chat vs Conversation

| Use Case | Chat | Conversation |
|----------|------|--------------|
| **Quick questions** | ✅ Perfect | ❌ Overkill |
| **One-off tasks** | ✅ Perfect | ❌ Overkill |
| **Code snippets** | ✅ Good | ✅ Good |
| **Multi-step discussions** | ❌ No context | ✅ Perfect |
| **Iterative development** | ❌ No memory | ✅ Perfect |
| **Long conversations** | ❌ No history | ✅ Perfect |
| **Context-dependent tasks** | ❌ No context | ✅ Perfect |

## Output Format

The chat command provides structured output:

```bash
npx anygpt chat "Hello!"

# Output format:
👤 Hello!                           # Your message
🤖 Hello! How can I help you today? # AI response  
📊 Usage: 2 input + 10 output = 12 tokens  # Token usage
```

### Token Usage Information

- **Input tokens**: Tokens in your message
- **Output tokens**: Tokens in the AI response
- **Total tokens**: Sum of input + output tokens

This helps you:
- Monitor API usage costs
- Understand message complexity
- Optimize prompt efficiency

## Configuration Integration

The chat command respects your AnyGPT configuration:

```typescript
// .anygpt/anygpt.config.ts
export default config({
  defaults: {
    provider: 'openai',     // Default for chat command
    model: 'gpt-4o'        // Default model
  },
  providers: {
    openai: {
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }
});
```

## Error Handling

Common errors and solutions:

### Provider Not Configured
```bash
Error: Provider 'xyz' not configured
```
**Solution**: Check your config file or use `--provider` with a valid provider name.

### Missing API Key
```bash
Error: API key not provided
```
**Solution**: Set environment variables or use `--token` parameter.

### Model Not Available
```bash
Error: Model 'xyz' not found
```
**Solution**: Check available models for your provider or use `--model` with a valid model.

## Best Practices

### 1. Use for Quick Tasks
```bash
# Good: Quick factual questions
npx anygpt chat "What's the capital of France?"

# Good: Simple code snippets  
npx anygpt chat "Write a JavaScript function to reverse a string"
```

### 2. Avoid for Complex Discussions
```bash
# Bad: Multi-step problem solving
npx anygpt chat "Help me design a database schema"
npx anygpt chat "Actually, let's add user authentication"  # No context!

# Good: Use conversation instead
npx anygpt conversation message "Help me design a database schema"
npx anygpt conversation message "Actually, let's add user authentication"
```

### 3. Optimize Prompts
```bash
# Good: Clear, specific prompts
npx anygpt chat "Explain the difference between let and const in JavaScript"

# Less optimal: Vague prompts
npx anygpt chat "Tell me about JavaScript"
```

## Integration with Other Commands

### Transition to Conversation
If your chat needs follow-up, easily switch to conversation mode:

```bash
# Start with chat
npx anygpt chat "How do I implement authentication in Node.js?"

# If you need follow-up, switch to conversation
npx anygpt conversation message "Can you show me a complete example with JWT?"
```

### Configuration Check
Verify your setup before using chat:

```bash
# Check current configuration
npx anygpt config

# Then use chat with confidence
npx anygpt chat "Hello world!"
```

## Performance Characteristics

| Aspect | Performance |
|--------|-------------|
| **Startup time** | Fast (~100ms) |
| **Memory usage** | Minimal |
| **Storage** | None |
| **Network** | Single request |
| **Concurrency** | Fully parallel |

The chat command is optimized for speed and simplicity, making it ideal for automation, scripting, and quick interactions.
