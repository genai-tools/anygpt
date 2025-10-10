# Chat Command Specification

**Related Use Case**: [Provider Agnostic Chat](../../use-cases/provider-agnostic-chat.md)

Stateless single-turn AI interaction. No conversation history, no persistent state.

## Command Syntax

```bash
anygpt chat <message> [options]
```

## Required Arguments

### `<message>`
Text message to send to AI.

**Examples**:
```bash
anygpt chat "What is the capital of France?"
anygpt chat "Write a Python function to sort a list"
```

## Optional Arguments

### `--provider <name>`
Override configured provider.

**Format**: Provider name from configuration

**Examples**:
```bash
--provider openai
--provider anthropic
```

### `--model <name>`
Override configured model.

**Examples**:
```bash
--model gpt-4o
--model claude-sonnet-4
```

## Output Format

### Success Output

```
What is the capital of France?

Paris is the capital of France.

📊 Usage: 8 input + 7 output = 15 tokens
```

### Error Output

```
Error: Provider 'invalid' not found in configuration

Available providers:
  - openai
  - anthropic
  - ollama

Run 'anygpt config show' to see full configuration.
```

## Exit Codes

- `0`: Success
- `1`: Invalid arguments
- `2`: Configuration error (provider/model not found)
- `3`: API error (authentication, rate limit, etc.)
- `4`: Network error

## Behavior

### Stateless
Each invocation is independent. No history, no state, no memory of previous calls.

### Configuration
Uses configuration from standard locations (see Configuration Loader spec). Command-line options override config.

### Error Handling
On error, display clear message with:
- What went wrong
- Available alternatives (if applicable)
- Suggestion for next action

## Examples

### Basic Usage
```bash
anygpt chat "Explain quantum computing in simple terms"
```

### With Provider Override
```bash
anygpt chat "Write a haiku about AI" --provider anthropic
```

### With Model Override
```bash
anygpt chat "Translate 'hello' to Spanish" --model gpt-3.5-turbo
```

### Automation/Scripting
```bash
#!/bin/bash
response=$(anygpt chat "What is 2+2?")
echo "AI says: $response"
```
