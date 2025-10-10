# Context Optimization

## The Problem

Long conversations hit token limits (e.g., GPT-4's 128k limit). Each message includes full history, costs multiply. A 50-message conversation might use 100k tokens per request. No built-in way to manage context size without losing important information.

## The Solution

Conversation forking, summarization, and context condensing to manage token usage.

## Example

```bash
# Fork conversation to try different approach
anygpt conversation fork --name "alternative-approach"

# Original conversation preserved, new one starts fresh
# Summarization reduces token usage while preserving context
```

## Why Existing Solutions Fall Short

- **Manual truncation**: Lose important context
- **No forking**: Can't experiment without losing history
- **No summarization**: Full history or nothing

## Expected Results

**Scenario:** Long debugging session with 50 messages.

**Without optimization:**
- Each request sends full history: 100k tokens
- Cost per request: $3.00
- 10 more messages: $30.00
- Eventually hits 128k token limit, conversation breaks

**With forking/summarization:**
- Fork at key decision points, keep relevant context
- Summarize old messages: 100k → 20k tokens
- Cost per request: $0.60
- 10 more messages: $6.00
- Can continue indefinitely

**Measurable Impact:**
- Reduce token usage by ~80% in long conversations
- Save $24 per 10-message continuation
- Never hit token limits
- Experiment with different approaches without losing history
