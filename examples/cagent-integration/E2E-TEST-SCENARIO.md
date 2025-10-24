# E2E Test Scenario: cagent + AnyGPT Integration

This document provides step-by-step instructions for testing the cagent + AnyGPT integration with real-world scenarios.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] cagent installed (`brew install cagent` or binary from releases)
- [ ] Docker Desktop running
- [ ] Docker MCP Catalog initialized (`docker mcp catalog init`)
- [ ] At least one API key set (OpenAI, Anthropic, or Google)
- [ ] Docker MCP servers enabled (see below)

### Setup Docker MCP Servers

```bash
# Initialize catalog
docker mcp catalog init

# Enable useful servers for testing
docker mcp server enable github-official filesystem duckduckgo

# Verify servers are enabled
docker mcp server ls

# Expected output:
# NAME                STATUS    TOOLS
# github-official     enabled   49
# filesystem          enabled   15
# duckduckgo          enabled   2
```

### Set API Keys

```bash
# Choose at least one:
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="..."
```

## Test Scenario 1: Basic Tool Discovery

**Goal**: Verify agent can discover and use tools autonomously.

**Agent**: `basic-agent.yaml`

### Step 1: Start the Agent

```bash
cd examples/cagent-integration
cagent run basic-agent.yaml
```

### Step 2: Test Web Search

**Prompt**:

```
Search the web for "TypeScript 5.0 new features" and summarize the top 3 findings.
```

**Expected Behavior**:

1. Agent uses `search_tools` to find web search capability
2. Discovers `duckduckgo:search` tool
3. Uses `get_tool_details` to understand parameters
4. Executes `execute_tool` with the search query
5. Summarizes results

**Verification**:

- [ ] Agent found the search tool without being told
- [ ] Search executed successfully
- [ ] Results summarized clearly
- [ ] Token usage shown in logs (~1,000 tokens vs 100,000+)

### Step 3: Test File Operations

**Prompt**:

```
Read the README.md file in the current directory and tell me what this project is about.
```

**Expected Behavior**:

1. Agent searches for "read file" tool
2. Discovers `filesystem:read_file`
3. Executes tool with file path
4. Summarizes content

**Verification**:

- [ ] Agent discovered file reading tool
- [ ] File read successfully
- [ ] Content summarized accurately

### Step 4: Test Error Handling

**Prompt**:

```
Read a file that doesn't exist: nonexistent.txt
```

**Expected Behavior**:

1. Agent attempts to read file
2. Receives error from tool
3. Reports error gracefully to user

**Verification**:

- [ ] Error handled gracefully
- [ ] User informed clearly about the issue

## Test Scenario 2: Research Workflow

**Goal**: Test complex multi-step research task with file output.

**Agent**: `research-assistant.yaml`

### Step 1: Start the Agent

```bash
cagent run research-assistant.yaml
```

### Step 2: Research Task

**Prompt**:

```
Research the Model Context Protocol (MCP) and create a summary document.
Include:
1. What is MCP?
2. Key benefits
3. Popular implementations
4. Use cases

Save the results to mcp-research.md
```

**Expected Behavior**:

1. Agent searches for web search tool
2. Executes multiple searches for MCP information
3. Analyzes and synthesizes findings
4. Searches for file writing tool
5. Creates mcp-research.md with organized content

**Verification**:

- [ ] Multiple searches executed
- [ ] Information synthesized coherently
- [ ] File created with proper markdown formatting
- [ ] Sources cited (if available)
- [ ] Content is accurate and well-organized

### Step 3: Verify Output

```bash
# Check if file was created
ls -la mcp-research.md

# View content
cat mcp-research.md
```

**Expected File Structure**:

```markdown
# Model Context Protocol (MCP) Research

## What is MCP?

[Content from research]

## Key Benefits

[Content from research]

## Popular Implementations

[Content from research]

## Use Cases

[Content from research]

## Sources

[Citations if available]
```

### Step 4: Follow-up Task

**Prompt**:

```
Based on the research, create a list of 3 implementation recommendations
and append them to the mcp-research.md file.
```

**Expected Behavior**:

1. Agent reads existing file
2. Analyzes content
3. Generates recommendations
4. Appends to file

**Verification**:

- [ ] File updated with new content
- [ ] Recommendations are relevant
- [ ] Original content preserved

## Test Scenario 3: Multi-Agent Coordination

**Goal**: Test multi-agent team with task delegation.

**Agent**: `dev-team.yaml`

### Step 1: Start the Team

```bash
cagent run dev-team.yaml
```

### Step 2: Complex Development Task

**Prompt**:

```
Create a simple TypeScript utility function that validates email addresses.
Include:
1. The function implementation in email-validator.ts
2. Unit tests in email-validator.test.ts
3. Documentation in EMAIL_VALIDATOR.md
```

**Expected Behavior**:

1. Root agent analyzes task
2. Root agent delegates code writing to helper
3. Helper agent searches for file writing tools
4. Helper creates implementation file
5. Helper creates test file
6. Root agent creates documentation
7. Root agent coordinates final delivery

**Verification**:

- [ ] Three files created
- [ ] Implementation is correct
- [ ] Tests are comprehensive
- [ ] Documentation is clear
- [ ] Task coordination visible in logs

### Step 3: Code Review Task

**Prompt**:

```
Review the email-validator.ts file and suggest improvements.
```

**Expected Behavior**:

1. Root agent delegates to helper
2. Helper reads file
3. Helper analyzes code
4. Helper provides detailed review
5. Root agent summarizes findings

**Verification**:

- [ ] File read successfully
- [ ] Review is thorough
- [ ] Suggestions are actionable
- [ ] Delegation visible in logs

## Test Scenario 4: GitHub Integration

**Goal**: Test GitHub tool discovery and usage.

**Agent**: `research-assistant.yaml`

**Prerequisites**: GitHub token configured in Docker MCP

### Step 1: Configure GitHub

```bash
# Set GitHub token in Docker MCP
docker mcp secret set github-official GITHUB_TOKEN "ghp_..."

# Verify configuration
docker mcp server inspect github-official
```

### Step 2: Start Agent

```bash
cagent run research-assistant.yaml
```

### Step 3: Create Issue

**Prompt**:

```
Create a GitHub issue in the repository "owner/repo" with:
Title: "Implement MCP Discovery Integration"
Body: "Based on our research, we should integrate MCP Discovery for better tool management."
Labels: enhancement, documentation
```

**Expected Behavior**:

1. Agent searches for "github issue" tool
2. Discovers `github-official:create_issue`
3. Gets tool details to understand parameters
4. Executes tool with provided information
5. Reports issue number and URL

**Verification**:

- [ ] Issue created successfully
- [ ] Title and body correct
- [ ] Labels applied
- [ ] Issue URL returned

## Performance Metrics

### Token Usage Comparison

**Without AnyGPT Discovery** (loading all tools):

```
Initial context: ~100,000 tokens
Per message: ~100,000 tokens
10 messages: ~1,000,000 tokens
Cost (GPT-4): ~$30
```

**With AnyGPT Discovery** (on-demand loading):

```
Initial context: ~600 tokens (5 meta-tools)
Per message: ~600-1,500 tokens
10 messages: ~6,000-15,000 tokens
Cost (GPT-4): ~$0.50
```

**Savings**: 98-99% reduction!

### How to Verify Token Usage

1. **Check cagent logs**: Look for token counts in output
2. **Monitor API usage**: Check your provider's dashboard
3. **Compare with baseline**: Run same task without discovery

### Expected Token Counts

| Scenario            | Without Discovery | With Discovery | Savings |
| ------------------- | ----------------- | -------------- | ------- |
| Basic chat          | 100,000           | 600            | 99.4%   |
| Web search          | 100,000           | 1,200          | 98.8%   |
| File operations     | 100,000           | 1,500          | 98.5%   |
| GitHub integration  | 100,000           | 2,000          | 98.0%   |
| Multi-step research | 500,000           | 5,000          | 99.0%   |

## Troubleshooting

### Issue: Agent can't find tools

**Symptoms**: `search_tools` returns empty results

**Solutions**:

```bash
# 1. Verify Docker MCP servers are running
docker mcp server ls

# 2. Enable required servers
docker mcp server enable github-official filesystem duckduckgo

# 3. Test discovery manually
npx @anygpt/cli mcp search "your query"

# 4. Check Docker Desktop is running
docker ps
```

### Issue: High token usage

**Symptoms**: Token counts still high (>10,000 per message)

**Solutions**:

1. Verify agent YAML uses AnyGPT Discovery:

   ```yaml
   toolsets:
     - type: mcp
       command: npx
       args: ['-y', '@anygpt/mcp-discovery-server']
   ```

2. Check agent isn't loading tools manually
3. Review agent logs for tool loading patterns

### Issue: Connection errors

**Symptoms**: "Failed to connect to MCP server"

**Solutions**:

```bash
# 1. Ensure Docker Desktop is running
docker ps

# 2. Restart Docker MCP Gateway
docker mcp gateway run --port 8080 --transport streaming

# 3. Check npx can run the discovery server
npx -y @anygpt/mcp-discovery-server --help
```

### Issue: Tool execution fails

**Symptoms**: Tool found but execution fails

**Solutions**:

1. Check tool parameters with `get_tool_details`
2. Verify required secrets are configured
3. Test tool manually:
   ```bash
   docker mcp tools call tool_name arg1 arg2
   ```

## Success Criteria

### ✅ Test Passed If:

1. **Tool Discovery**:

   - [ ] Agent finds tools without being told which server
   - [ ] Search queries return relevant results
   - [ ] Tool details retrieved successfully

2. **Tool Execution**:

   - [ ] Tools execute successfully
   - [ ] Results returned correctly
   - [ ] Errors handled gracefully

3. **Token Efficiency**:

   - [ ] Initial context < 1,000 tokens
   - [ ] Per-message usage < 2,000 tokens
   - [ ] 98%+ reduction vs traditional approach

4. **Multi-Agent Coordination** (dev-team only):

   - [ ] Tasks delegated appropriately
   - [ ] Agents coordinate effectively
   - [ ] Final results are coherent

5. **User Experience**:
   - [ ] Agent responses are helpful
   - [ ] Tasks completed successfully
   - [ ] No manual tool configuration needed

## Next Steps After Testing

1. **Customize agents**: Modify YAML files for your use cases
2. **Add more servers**: Enable additional Docker MCP servers
3. **Create templates**: Build reusable agent configurations
4. **Share results**: Push agents to Docker Hub
5. **Integrate into workflows**: Use agents in CI/CD pipelines

## Reporting Issues

If you encounter issues:

1. **Collect logs**: Save cagent output
2. **Document steps**: What you tried, what happened
3. **Check versions**: cagent, Docker Desktop, Node.js
4. **Report**:
   - cagent issues: https://github.com/docker/cagent/issues
   - AnyGPT issues: https://github.com/your-org/openai-gateway-mcp/issues

## Additional Resources

- **cagent Documentation**: https://github.com/docker/cagent
- **AnyGPT MCP Discovery**: Package README
- **Docker MCP Catalog**: https://hub.docker.com/mcp
- **MCP Protocol**: https://spec.modelcontextprotocol.io/
