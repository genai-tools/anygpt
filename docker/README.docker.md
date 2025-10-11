# Docker Local Development Guide

Quick guide for running AnyGPT MCP server locally with Docker Desktop.

## Prerequisites

- Docker Desktop with MCP Toolkit enabled
- Docker daemon running

## Quick Start

### 1. Build the Container

```bash
./docker-build.sh
```

Or manually:

```bash
docker build -t anygpt-mcp:local .
```

### 2. Add to Local Catalog

```bash
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml
```

### 3. Configure in Docker Desktop

1. Open **Docker Desktop**
2. Go to **MCP Toolkit** section
3. Switch to **my-dev-catalog**
4. Find **AnyGPT (Local Dev)**
5. Click **Configure**
6. Add your API keys:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (optional)
7. Set defaults (optional):
   - `default_provider`: `openai` or `anthropic`
   - `default_model`: `gpt-4o`, `claude-3-5-sonnet-20241022`, etc.
   - `log_level`: `info`, `debug`, `warn`, or `error`
8. Click **Enable**

### 4. Connect MCP Client

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "anygpt": {
      "command": "docker",
      "args": ["mcp", "proxy", "anygpt"]
    }
  }
}
```

**Windsurf** (`.windsurf/mcp.json`):

```json
{
  "mcpServers": {
    "anygpt": {
      "command": "docker",
      "args": ["mcp", "proxy", "anygpt"]
    }
  }
}
```

**VS Code/Cursor** (`.vscode/mcp.json`):

```json
{
  "mcpServers": {
    "anygpt": {
      "command": "docker",
      "args": ["mcp", "proxy", "anygpt"]
    }
  }
}
```

## Development Workflow

### Make Changes and Update

```bash
# 1. Make code changes
# 2. Rebuild and update
./docker-build.sh
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml --force

# 3. Restart in Docker Desktop (Disable > Enable)
```

### View Logs

```bash
# View server logs
docker mcp server logs anygpt

# Follow logs in real-time
docker mcp server logs anygpt --follow
```

### Test Server

```bash
# List available tools
docker mcp server exec anygpt tools/list

# Test chat completion
docker mcp server exec anygpt tools/call anygpt_chat_completion \
  '{"messages":[{"role":"user","content":"Hello"}]}'

# List models
docker mcp server exec anygpt tools/call anygpt_list_models '{}'

# List providers
docker mcp server exec anygpt tools/call anygpt_list_providers '{}'
```

## Troubleshooting

### Container won't build

```bash
# Check Docker is running
docker ps

# Check build logs
docker build -t anygpt-mcp:local . 2>&1 | tee build.log
```

### Server not appearing in MCP Toolkit

```bash
# Verify catalog was added
docker mcp catalog list
docker mcp catalog show my-dev-catalog

# Re-add with force
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml --force
```

### Server crashes on startup

```bash
# Check logs
docker mcp server logs anygpt

# Test container directly
docker run -it --rm \
  -e OPENAI_API_KEY=sk-test \
  anygpt-mcp:local
```

### Configuration not working

```bash
# Check server configuration
docker mcp server show anygpt

# Validate catalog file
cat anygpt-catalog.yaml
```

## Files

- `Dockerfile` - Container build instructions
- `.dockerignore` - Files to exclude from build
- `anygpt-catalog.yaml` - MCP server catalog definition
- `docker-build.sh` - Quick build script
- `README.docker.md` - This file

## Next Steps

- See [docs/products/anygpt/specs/anygpt/docker-local-development.md](docs/products/anygpt/specs/anygpt/docker-local-development.md) for detailed documentation
- See [docs/products/anygpt/specs/anygpt/docker-container.md](docs/products/anygpt/specs/anygpt/docker-container.md) for container requirements
- See [docs/products/anygpt/specs/anygpt/docker-registry-submission.md](docs/products/anygpt/specs/anygpt/docker-registry-submission.md) for registry submission
