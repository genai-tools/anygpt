# AnyGPT Troubleshooting Guide

This document covers common issues, recent fixes, and troubleshooting steps for the AnyGPT ecosystem.

## Recent Fixes & Enhancements

### ✅ Factory Configuration Support (Fixed Oct 2025)

**Problem**: Factory-style configurations with direct connector instances were not working with CLI commands.

**Error**: `Provider 'provider1' not configured`

**Root Cause**: The `setupRouterFromFactory()` function wasn't populating the router's provider configuration for validation, causing the router to reject requests even though connectors were properly registered.

**Solution**: Updated factory configuration setup to:
1. Populate router provider entries for validation
2. Use provider ID as connector type for proper resolution
3. Maintain factory pattern while ensuring validation passes

**Example Factory Config**:
```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    model: 'ml-asset:static-model/gemini-2_5-flash-lite'
  },
  providers: {
    provider1: {
      name: 'Company GenAI Gateway',
      connector: openai({
        baseURL: 'https://company-ai-gateway.example.com/v1',
      }, "provider1")
    }
  }
});
**Files Modified**: `/packages/config/src/setup.ts`

### ✅ Conversation Command Factory Config Support (Fixed Oct 2025)

**Problem**: Conversation commands were using old config loading system that didn't understand factory configurations.

**Error**: `No connector registered for provider: openai`

**Root Cause**: The conversation command was using `loadConfig()` from `utils/config.js` which hardcoded `type: 'openai'` for all providers, instead of using the CLI context setup.

**Solution**: Updated conversation commands to use the same CLI context setup as chat commands:
1. Replaced old config loading with `setupCLIContext()`
2. Used router directly instead of creating separate gateway
3. Ensured consistent behavior across all CLI commands

**Files Modified**: `/packages/cli/src/commands/conversation/message.ts`

### ✅ Auto-Start Conversations (New Feature Oct 2025)

**Enhancement**: Automatically start new conversations when users send messages without an active conversation.

**Before**: Users had to manually run `npx anygpt conversation start`

**After**: Conversations auto-start with clear user feedback

**Example**:
```bash
npx anygpt conversation message "Hello!"

# Output:
🚀 No active conversation found. Starting a new one...
🎯 Started new conversation: provider1/ml-asset:static-model/gemini-2_5-flash-lite - 10/3/2025, 4:41:12 PM
📝 Conversation ID: conv_1759502472315_qqx8eocbt
🔄 provider1/ml-asset:static-model/gemini-2_5-flash-lite - 10/3/2025, 4:41:12 PM
👤 Hello!
🤖 Hello! How can I assist you today?
```

**Files Modified**: `/packages/cli/src/commands/conversation/message.ts`

## Common Issues & Solutions

### Provider Configuration Issues

#### Issue: "Provider 'X' not configured"

**Symptoms**:
- CLI commands fail with provider not found errors
- Factory configurations not working

**Diagnosis**:
1. Check your configuration file location: `.anygpt/anygpt.config.ts`
2. Verify provider names match between config and usage
3. Ensure you're using the correct configuration pattern

**Solutions**:

**For Factory Configs** (Recommended):
```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'my-provider',  // This must match the key below
    model: 'gpt-4o'
  },
  providers: {
    'my-provider': {  // Provider ID (used in commands)
      name: 'My Provider',
      connector: openai({  // Connector type (openai-compatible)
        baseURL: 'https://api.example.com/v1',
        apiKey: process.env.API_KEY
      })
    }
  }
});
```

**For Standard Configs**:
```typescript
import type { AnyGPTConfig } from '@anygpt/config';

const config: AnyGPTConfig = {
  providers: {
    'my-provider': {
      connector: {
        connector: '@anygpt/openai',
        config: {
          baseURL: 'https://api.example.com/v1',
          apiKey: process.env.API_KEY
        }
      }
    }
  },
  settings: {
    defaultProvider: 'my-provider'
  }
};

export default config;
```

#### Issue: "No connector registered for provider: openai"

**Symptoms**:
- Error mentions "openai" even though your provider has a different name
- Conversation commands fail while chat commands work

**Root Cause**: Using old config loading system that doesn't understand factory configs

**Solution**: This was fixed in the recent updates. Ensure you're using the latest version.

### Conversation Management Issues

#### Issue: "No active conversation. Use --conversation <id> or start a conversation first."

**Symptoms**:
- Cannot send messages without manually starting conversations

**Solution**: This is now automatically handled. The system will auto-start conversations with clear feedback.

#### Issue: Conversation context not maintained

**Symptoms**:
- AI doesn't remember previous messages in conversation
- Each message seems isolated

**Diagnosis**:
1. Check if conversation is properly created and active
2. Verify message storage is working

**Solution**:
```bash
# Check active conversations
npx anygpt conversation list

# Check conversation details
npx anygpt conversation show <conversation-id>

# Start fresh conversation if needed
npx anygpt conversation start --name "new-session"
```

### Configuration Loading Issues

#### Issue: Config file not found or not loading

**Symptoms**:
- Falls back to default/mock provider
- Environment variables not recognized

**Diagnosis**:
1. Check file location: `.anygpt/anygpt.config.ts` (relative to current directory)
2. Verify file syntax and exports
3. Check environment variables are set

**Solution**:
```bash
# Verify config location
ls -la .anygpt/

# Test config loading
npx anygpt config

# Check environment variables
echo $OPENAI_API_KEY
```

## Debugging Commands

### Configuration Debugging

```bash
# Show current configuration
npx anygpt config

# Show configuration with verbose output
VERBOSE=true npx anygpt config

# Test basic chat (uses default provider)
npx anygpt chat "test message"
```

### Conversation Debugging

```bash
# List all conversations
npx anygpt conversation list

# Show conversation details
npx anygpt conversation show <conversation-id>

# Show current active conversation
npx anygpt conversation state

# Start new conversation with specific settings
npx anygpt conversation start --provider my-provider --model gpt-4o --name debug-session
```

### Build and Development Issues

```bash
# Rebuild all packages (NX handles dependencies)
npx nx build cli

# Clean build cache
npx nx reset

# Run with verbose output
VERBOSE=true npx anygpt chat "test"
```

## Best Practices

### Configuration Management

1. **Use Factory Configs**: Preferred for direct connector instantiation
2. **Environment Variables**: Store sensitive data in environment variables
3. **Private Configs**: Keep configs in `.anygpt/` folder (git-ignored)
4. **Default Settings**: Always set default provider and model

### Development Workflow

1. **Test Configuration**: Use `npx anygpt config` to verify setup
2. **Incremental Builds**: NX automatically handles package dependencies
3. **Clean Rebuilds**: Use `npx nx reset` if experiencing cache issues

### Security

1. **Never Commit Secrets**: `.anygpt/` folder is automatically git-ignored
2. **Use Environment Variables**: For API keys and sensitive URLs
3. **Validate Configs**: Test with non-sensitive endpoints first

## Getting Help

### Diagnostic Information

When reporting issues, include:

```bash
# Configuration status
npx anygpt config

# Package versions
npm list @anygpt/cli @anygpt/config @anygpt/router

# Node.js version
node --version

# Environment check
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}"
```

### Common Error Patterns

| Error Pattern | Likely Cause | Solution |
|---------------|--------------|----------|
| `Provider 'X' not configured` | Config/provider mismatch | Check provider names and config format |
| `No connector registered for provider: openai` | Old config loading system | Update to latest version |
| `No active conversation` | Missing conversation state | Auto-start feature now handles this |
| `Failed to initialize router` | Config loading failure | Check config file syntax and location |

### Recent Changes Summary

- **Factory Config Support**: Direct connector instantiation now works properly
- **Conversation Auto-Start**: No more manual conversation management
- **Unified CLI Context**: Consistent behavior across all commands
- **Improved Error Messages**: Clearer diagnostics and troubleshooting info

For additional help, check the package-specific README files and architecture documentation.
