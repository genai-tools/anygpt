# Conversation Command Specification

**Related Use Cases**: [Conversations](../../use-cases/conversations.md), [Context Optimization](../../use-cases/context-optimization.md)

Stateful multi-turn AI interaction with persistent history and context management.

## Command Syntax

```bash
anygpt conversation <subcommand> [arguments] [options]
```

## Subcommands

### `start`
Create a new conversation.

**Syntax**: `anygpt conversation start [--name <name>]`

**Options**:
- `--name <name>`: Optional conversation name

**Example**:
```bash
anygpt conversation start --name "coding-help"
```

**Output**:
```
Started conversation: coding-help (ID: conv_abc123)
```

### `message`
Send message to active conversation.

**Syntax**: `anygpt conversation message <text>`

**Example**:
```bash
anygpt conversation message "How do I implement a binary tree?"
```

**Output**:
```
You: How do I implement a binary tree?

AI: A binary tree can be implemented using a Node class...

📊 Usage: 12 input + 150 output = 162 tokens (Total: 162)
```

### `list`
Show all conversations.

**Syntax**: `anygpt conversation list`

**Output**:
```
Conversations:

* coding-help (conv_abc123) - Active
  Last message: 2 minutes ago
  Messages: 5, Tokens: 1,234

  debugging-session (conv_def456)
  Last message: 1 hour ago
  Messages: 12, Tokens: 3,456
```

### `show`
Display conversation history.

**Syntax**: `anygpt conversation show [<name-or-id>]`

**Example**:
```bash
anygpt conversation show coding-help
```

**Output**:
```
Conversation: coding-help (conv_abc123)
Created: 2025-01-10 10:30:00
Messages: 5
Total tokens: 1,234

---

You: How do I implement a binary tree?

AI: A binary tree can be implemented...

---

You: Show me the insertion method

AI: Here's the insertion method...
```

### `end`
Terminate active conversation.

**Syntax**: `anygpt conversation end`

**Output**:
```
Ended conversation: coding-help (conv_abc123)
```

### `fork`
Create a copy of conversation to explore alternatives.

**Syntax**: `anygpt conversation fork --name <new-name>`

**Example**:
```bash
anygpt conversation fork --name "alternative-approach"
```

**Output**:
```
Forked conversation: alternative-approach (conv_xyz789)
Copied 5 messages from coding-help
```

### `delete`
Permanently remove conversation.

**Syntax**: `anygpt conversation delete <name-or-id>`

**Example**:
```bash
anygpt conversation delete old-conversation
```

**Output**:
```
Deleted conversation: old-conversation (conv_old123)
```

## Exit Codes

- `0`: Success
- `1`: Invalid arguments
- `2`: Conversation not found
- `3`: No active conversation
- `4`: API error

## Behavior

### Auto-Start
If no active conversation exists and user sends a message, automatically create a new conversation and display notification:

```
No active conversation. Starting new conversation...

Started conversation: conv_abc123

You: Hello

AI: Hi! How can I help you today?
```

### Active Conversation
Only one conversation can be active at a time. Use `conversation start` or `conversation continue` to switch active conversation.

### Persistence
All conversations are stored persistently. They survive process restarts and can be resumed later.

### Fork Behavior
Fork creates an exact copy of conversation history. Both conversations evolve independently after forking.

