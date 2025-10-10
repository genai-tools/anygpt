# Docker MCP Toolkit Integration

**Official Docker Feature**: [Docker MCP Toolkit](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)

## The Problem

Developers using multiple AI-powered tools (Windsurf, VS Code, Cursor, Kilocode) must configure MCP servers separately in each tool. This creates:

- **Duplicated effort**: Configure the same providers 4+ times
- **Scattered credentials**: API keys in multiple config files across tools
- **Inconsistent behavior**: Different configurations lead to different results
- **Maintenance burden**: Update provider settings in 4+ places
- **Security risk**: API keys scattered across filesystem

**Example**: Adding Anthropic Claude support requires:
1. Configure in Windsurf: `~/.windsurf/mcp.json`
2. Configure in VS Code: `~/.vscode/mcp.json`
3. Configure in Cursor: `~/.cursor/mcp.json`
4. Configure in Kilocode: `~/.REDACTED/mcp.json`

Each with its own API key, model settings, and configuration format.

## The Solution

Run AnyGPT MCP server once in Docker Desktop MCP Toolkit. All tools connect to the same centralized server.

## Example

### Before: Per-Tool Configuration

**Windsurf config** (`~/.windsurf/mcp.json`):
```json
{
  "mcpServers": {
    "openai": { "command": "...", "env": { "OPENAI_API_KEY": "..." } },
    "anthropic": { "command": "...", "env": { "ANTHROPIC_API_KEY": "..." } }
  }
}
```

**VS Code config** (`~/.vscode/mcp.json`):
```json
{
  "mcpServers": {
    "openai": { "command": "...", "env": { "OPENAI_API_KEY": "..." } },
    "anthropic": { "command": "...", "env": { "ANTHROPIC_API_KEY": "..." } }
  }
}
```

**Cursor config** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "openai": { "command": "...", "env": { "OPENAI_API_KEY": "..." } },
    "anthropic": { "command": "...", "env": { "ANTHROPIC_API_KEY": "..." } }
  }
}
```

**Result**: 4 separate configs, 4 sets of API keys, 4 maintenance points.

### After: Centralized Docker Server

**Docker Desktop MCP Toolkit** (one config):
```yaml
services:
  anygpt-mcp:
    image: anygpt/mcp-server
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
```

**All tools connect to same server**:
```json
{
  "mcpServers": {
    "anygpt": {
      "command": "docker",
      "args": ["exec", "anygpt-mcp", "anygpt-mcp"]
    }
  }
}
```

**Result**: 1 config, 1 set of credentials, 1 maintenance point.

## Why Existing Solutions Fall Short

- **Per-tool configuration**: Current approach requires duplicate setup in every tool
- **Shared config files**: Not supported by MCP protocol - each tool expects its own config
- **Environment variables**: Still requires per-tool MCP server setup
- **Manual synchronization**: Keeping configs in sync is error-prone

## Expected Results

**Scenario**: Developer using 4 AI-powered tools (Windsurf, VS Code, Cursor, Kilocode) with 3 providers (OpenAI, Anthropic, Ollama).

**Before: Per-Tool Setup**
- Initial setup: 30 min/tool × 4 tools = 2 hours
- Add new provider: 10 min/tool × 4 tools = 40 minutes
- Update API key: 5 min/tool × 4 tools = 20 minutes
- Credentials stored in: 4 different locations
- Configuration drift: High (tools get out of sync)

**After: Centralized Docker Setup**
- Initial setup: 5 minutes (one Docker config)
- Add new provider: 2 minutes (update Docker config)
- Update API key: 1 minute (update Docker env)
- Credentials stored in: 1 location (Docker secrets)
- Configuration drift: Zero (all tools use same server)

**Measurable Impact:**
- Reduce initial setup time by 96% (2 hours → 5 minutes)
- Reduce provider updates by 95% (40 minutes → 2 minutes)
- Reduce credential management by 75% (4 locations → 1 location)
- Eliminate configuration drift completely
- Improve security with centralized credential management

## Additional Benefits

**Local Development**:
- Start Docker Desktop → all tools have AI access
- No per-project configuration needed
- Consistent behavior across all development environments

**Team Collaboration**:
- Share Docker config with team
- Everyone has identical AI setup
- No "works on my machine" issues

**Security**:
- API keys in Docker secrets, not scattered config files
- Single point for credential rotation
- Easier to audit and secure
