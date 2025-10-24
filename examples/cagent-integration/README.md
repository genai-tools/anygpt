# cagent + AnyGPT Integration Example

This example demonstrates how to use **Docker cagent** with **AnyGPT MCP Discovery Server** to create intelligent AI agents with 99% token reduction.

## What This Example Shows

1. **cagent agent** using AnyGPT MCP Discovery for intelligent tool discovery
2. **Token savings**: 100,000+ tokens → 600 tokens (99% reduction)
3. **Autonomous tool discovery**: Agent searches for tools based on user intent
4. **Multi-server access**: Single connection to 100+ MCP servers

## Prerequisites

### 1. Install cagent

```bash
# Using Homebrew (macOS/Linux)
brew install cagent

# Or download binary from releases
# https://github.com/docker/cagent/releases
```

### 2. Install Docker Desktop

Required for Docker MCP Gateway (provides containerized MCP servers).

Download from: https://www.docker.com/products/docker-desktop/

### 3. Set API Keys

```bash
# For OpenAI models
export OPENAI_API_KEY=your_api_key_here

# For Anthropic models
export ANTHROPIC_API_KEY=your_api_key_here

# For Gemini models
export GOOGLE_API_KEY=your_api_key_here
```

### 4. Initialize Docker MCP Catalog

```bash
# Initialize the Docker MCP Catalog
docker mcp catalog init

# Enable some useful servers
docker mcp server enable github-official filesystem duckduckgo

# Verify servers are enabled
docker mcp server ls
```

## Example Agents

### 1. Basic Agent with AnyGPT Discovery

**File**: `basic-agent.yaml`

Simple agent that uses AnyGPT MCP Discovery to find and use tools.

```bash
# Run the agent
cagent run basic-agent.yaml
```

**Try these prompts**:

- "Search the web for the latest TypeScript features"
- "Read the README.md file and summarize it"
- "Create a GitHub issue for implementing feature X"

### 2. Research Assistant

**File**: `research-assistant.yaml`

Specialized agent for research tasks with web search and file operations.

```bash
# Run the agent
cagent run research-assistant.yaml
```

**Try these prompts**:

- "Research Docker security best practices and save to research.md"
- "Find the top 5 TypeScript libraries for testing and create a comparison"
- "Search for MCP protocol documentation and summarize key concepts"

### 3. Development Team (Multi-Agent)

**File**: `dev-team.yaml`

Multi-agent team with coordinator and helper agents, all using AnyGPT Discovery.

```bash
# Run the team
cagent run dev-team.yaml
```

**Try these prompts**:

- "Create a new TypeScript project with tests"
- "Review the code in src/ and suggest improvements"
- "Write documentation for the API endpoints"

## How It Works

### Traditional Approach (Without AnyGPT Discovery)

```yaml
# ❌ Problem: Must list all tools explicitly
toolsets:
  - type: mcp
    ref: docker:github-official
  - type: mcp
    ref: docker:filesystem
  - type: mcp
    ref: docker:duckduckgo
  # ... 100+ more servers
```

**Result**: 100,000+ tokens per message, slow initialization, context overflow

### With AnyGPT Discovery

```yaml
# ✅ Solution: Single meta-tool connection
toolsets:
  - type: mcp
    command: npx
    args: ['-y', '@anygpt/mcp-discovery-server']
```

**Result**: 600 tokens per message, instant initialization, intelligent discovery

### Agent Workflow Example

```
User: "Search for TypeScript testing libraries and save results"

Agent thinks:
1. Need to search the web → search_tools("search web")
   → Finds: duckduckgo:search

2. Execute search → execute_tool(server: "duckduckgo", tool: "search", ...)
   → Gets results

3. Need to save file → search_tools("write file")
   → Finds: filesystem:write_file

4. Execute write → execute_tool(server: "filesystem", tool: "write_file", ...)
   → Saves results

Total tokens: ~1,000 (vs 500,000+ without discovery)
```

## E2E Test Scenario

### Scenario: GitHub Issue Creation from Research

**Goal**: Research a topic, analyze findings, create GitHub issue with recommendations.

**Steps**:

1. **Start the agent**:

   ```bash
   cagent run research-assistant.yaml
   ```

2. **Give the task**:

   ```
   Research the latest MCP protocol features, analyze their benefits,
   and create a GitHub issue in my repo with implementation recommendations.
   ```

3. **Agent autonomously**:

   - Searches for "mcp protocol" tools → finds `duckduckgo:search`
   - Executes web search → gets latest MCP info
   - Searches for "github issue" tools → finds `github-official:create_issue`
   - Creates issue with research findings

4. **Observe**:
   - Check token usage in logs (should be ~1,000 tokens)
   - Verify GitHub issue was created
   - Review agent's reasoning process

### Expected Output

```
Agent: I'll help you research MCP protocol features and create a GitHub issue.

[Searching for web search tools...]
Found: duckduckgo:search

[Executing web search...]
Results: [MCP protocol documentation, recent updates...]

[Analyzing findings...]
Key benefits identified:
- Standardized tool integration
- Security and isolation
- Dynamic discovery

[Searching for GitHub tools...]
Found: github-official:create_issue

[Creating GitHub issue...]
Issue created: #123 "Implement MCP Protocol Features"

Task completed! Token usage: 987 tokens (vs ~500,000 without discovery)
```

## Monitoring and Debugging

### View Available Tools

```bash
# List all MCP servers
docker mcp server ls

# Count available tools
docker mcp tools count

# List all tools
docker mcp tools ls

# Inspect specific tool
docker mcp tools inspect create_issue
```

### Check Agent Logs

cagent provides detailed logs showing:

- Tool discovery queries
- Tool execution calls
- Token usage per request
- Agent reasoning process

### Test Discovery Manually

```bash
# Test AnyGPT Discovery directly
npx @anygpt/cli mcp search "github issue"
npx @anygpt/cli mcp inspect create_issue
npx @anygpt/cli mcp execute search "typescript testing"
```

## Token Savings Analysis

### Without AnyGPT Discovery

```
Initial context: 100,000 tokens (all tools loaded)
Per message: 100,000 tokens
10 messages: 1,000,000 tokens
Cost (GPT-4): ~$30 per conversation
```

### With AnyGPT Discovery

```
Initial context: 600 tokens (5 meta-tools)
Per message: 600-1,500 tokens (only discovered tools)
10 messages: 6,000-15,000 tokens
Cost (GPT-4): ~$0.50 per conversation
```

**Savings**: 98-99% reduction in tokens and costs!

## Troubleshooting

### Agent can't find tools

**Problem**: `search_tools` returns no results

**Solution**:

```bash
# Verify Docker MCP servers are running
docker mcp server ls

# Enable required servers
docker mcp server enable github-official filesystem

# Test discovery manually
npx @anygpt/cli mcp search "your query"
```

### Connection errors

**Problem**: "Failed to connect to MCP server"

**Solution**:

```bash
# Ensure Docker Desktop is running
docker ps

# Restart Docker MCP Gateway
docker mcp gateway run --port 8080 --transport streaming
```

### High token usage

**Problem**: Still seeing high token counts

**Solution**:

- Verify agent is using AnyGPT Discovery (check `toolsets` in YAML)
- Check agent logs for tool loading patterns
- Ensure not loading tools manually

## Next Steps

1. **Customize agents**: Modify YAML configs for your use cases
2. **Add more servers**: Enable additional Docker MCP servers
3. **Create agent teams**: Build multi-agent workflows
4. **Share agents**: Push to Docker Hub with `cagent push`

## Resources

- **cagent Documentation**: https://github.com/docker/cagent
- **AnyGPT MCP Discovery**: https://github.com/your-org/openai-gateway-mcp
- **Docker MCP Catalog**: https://hub.docker.com/mcp
- **MCP Protocol Spec**: https://spec.modelcontextprotocol.io/

## Support

- **cagent Issues**: https://github.com/docker/cagent/issues
- **AnyGPT Issues**: https://github.com/your-org/openai-gateway-mcp/issues
- **Docker Community**: https://dockercommunity.slack.com/
