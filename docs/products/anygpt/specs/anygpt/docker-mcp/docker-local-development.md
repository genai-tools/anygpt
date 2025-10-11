# Docker Local Development Specification

**Related Specs**:

- [Docker Container](./docker-container.md) - Container requirements
- [Docker MCP Toolkit](./docker-mcp-toolkit.md) - Integration overview

Specification for developing and testing AnyGPT MCP server locally using Docker Desktop's local catalog feature.

## Overview

This specification covers **local development workflow** using Docker Desktop's MCP Toolkit. This allows you to:

- Develop and test your MCP server locally
- Add it to a custom local catalog
- Use it with MCP clients (Claude, Cursor, Windsurf, etc.)
- Iterate quickly without registry submission

**Key Command**: `docker mcp catalog add <catalog> <server-name> <catalog-file>`

## Local Development Workflow

### 1. Build Container Locally

```bash
# Build the Docker image
docker build -t anygpt-mcp:local .

# Or with specific tag
docker build -t anygpt-mcp:dev .
```

### 2. Create Catalog File

Create a local catalog file `anygpt-catalog.yaml`:

```yaml
name: anygpt
image: anygpt-mcp:local
type: server
meta:
  category: ai-integration
  tags:
    - openai
    - anthropic
    - ai
    - llm
about:
  title: AnyGPT (Local Dev)
  description: Universal AI provider gateway - local development version
  icon: https://avatars.githubusercontent.com/u/YOUR_ORG?s=200&v=4
config:
  description: Configure AI provider API keys
  secrets:
    - name: anygpt.openai_api_key
      env: OPENAI_API_KEY
      example: sk-proj-...
    - name: anygpt.anthropic_api_key
      env: ANTHROPIC_API_KEY
      example: sk-ant-...
  env:
    - name: DEFAULT_PROVIDER
      example: openai
      value: '{{anygpt.default_provider}}'
    - name: DEFAULT_MODEL
      example: gpt-4o
      value: '{{anygpt.default_model}}'
    - name: LOG_LEVEL
      example: info
      value: '{{anygpt.log_level}}'
  parameters:
    type: object
    properties:
      default_provider:
        type: string
        description: Default AI provider to use
        default: openai
      default_model:
        type: string
        description: Default model to use
        default: gpt-4o
      log_level:
        type: string
        description: Logging level
        enum: [debug, info, warn, error]
        default: info
```

### 3. Add to Local Catalog

```bash
# Create a new local catalog and add your server
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml

# Or add to existing catalog
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml

# Force overwrite if server already exists
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml --force
```

### 4. Use in Docker Desktop

1. Open Docker Desktop
2. Go to **MCP Toolkit** section
3. Switch to your custom catalog (`my-dev-catalog`)
4. Find "AnyGPT (Local Dev)" in the list
5. Click **Configure**
6. Add your API keys and settings
7. Click **Enable**

### 5. Connect MCP Client

Configure your MCP client (Claude Desktop, Cursor, etc.) to use Docker Desktop's MCP Toolkit.

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

**Windsurf/VS Code/Cursor** (`.vscode/mcp.json` or `.windsurf/mcp.json`):

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

### 6. Test Your Server

```bash
# Check server is running
docker mcp server list

# View logs
docker mcp server logs anygpt

# Test with a simple request
docker mcp server exec anygpt tools/list
```

## Iteration Workflow

### Quick Rebuild and Update

```bash
# 1. Make code changes
# 2. Rebuild image
docker build -t anygpt-mcp:local .

# 3. Update catalog (force overwrite)
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml --force

# 4. Restart server in Docker Desktop
# Go to MCP Toolkit > Disable > Enable

# 5. Test changes
docker mcp server exec anygpt tools/list
```

### Script for Quick Iteration

Create `dev-update.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Building image..."
docker build -t anygpt-mcp:local .

echo "📦 Updating catalog..."
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml --force

echo "✅ Done! Restart the server in Docker Desktop MCP Toolkit"
```

Make it executable:

```bash
chmod +x dev-update.sh
./dev-update.sh
```

## Catalog File Structure

### Minimal Catalog

```yaml
name: anygpt
image: anygpt-mcp:local
type: server
meta:
  category: ai-integration
  tags:
    - ai
about:
  title: AnyGPT
  description: Universal AI provider gateway
  icon: https://example.com/icon.png
```

### With Configuration

```yaml
name: anygpt
image: anygpt-mcp:local
type: server
meta:
  category: ai-integration
  tags:
    - ai
about:
  title: AnyGPT
  description: Universal AI provider gateway
  icon: https://example.com/icon.png
config:
  secrets:
    - name: anygpt.openai_api_key
      env: OPENAI_API_KEY
      example: sk-...
  env:
    - name: DEFAULT_PROVIDER
      value: '{{anygpt.default_provider}}'
  parameters:
    type: object
    properties:
      default_provider:
        type: string
        default: openai
```

### With Multiple Providers

```yaml
name: anygpt
image: anygpt-mcp:local
type: server
meta:
  category: ai-integration
  tags:
    - openai
    - anthropic
    - google
about:
  title: AnyGPT
  description: Multi-provider AI gateway
  icon: https://example.com/icon.png
config:
  description: Configure AI provider API keys
  secrets:
    - name: anygpt.openai_api_key
      env: OPENAI_API_KEY
      example: sk-proj-...
    - name: anygpt.anthropic_api_key
      env: ANTHROPIC_API_KEY
      example: sk-ant-...
    - name: anygpt.google_api_key
      env: GOOGLE_API_KEY
      example: AIza...
  parameters:
    type: object
    properties:
      default_provider:
        type: string
        enum: [openai, anthropic, google]
        default: openai
```

## Docker Commands Reference

### Catalog Management

```bash
# List all catalogs
docker mcp catalog list

# Show catalog details
docker mcp catalog show my-dev-catalog

# Add server to catalog
docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml

# Remove server from catalog
docker mcp catalog remove my-dev-catalog anygpt

# Delete entire catalog
docker mcp catalog delete my-dev-catalog
```

### Server Management

```bash
# List running servers
docker mcp server list

# Show server details
docker mcp server show anygpt

# View server logs
docker mcp server logs anygpt

# Follow logs in real-time
docker mcp server logs anygpt --follow

# Execute command in server
docker mcp server exec anygpt tools/list

# Stop server
docker mcp server stop anygpt

# Start server
docker mcp server start anygpt

# Restart server
docker mcp server restart anygpt
```

### Testing Commands

```bash
# Test initialize
echo '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{}}' | \
  docker mcp server exec anygpt -

# Test tools list
docker mcp server exec anygpt tools/list

# Test chat completion
docker mcp server exec anygpt tools/call anygpt_chat_completion \
  '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Development Best Practices

### 1. Use Local Image Tags

Always use local tags for development:

```yaml
image: anygpt-mcp:local  # Good
image: anygpt-mcp:dev    # Good
image: anygpt-mcp:latest # Bad - conflicts with registry
```

### 2. Separate Dev and Prod Catalogs

```bash
# Development catalog
docker mcp catalog add dev-catalog anygpt ./anygpt-catalog.yaml

# Production catalog (from registry)
docker mcp catalog add prod-catalog anygpt https://...
```

### 3. Version Your Catalog Files

```bash
anygpt-catalog.yaml       # Current development
anygpt-catalog.v1.yaml    # Version 1
anygpt-catalog.v2.yaml    # Version 2
```

### 4. Use Environment-Specific Icons

```yaml
# Development
icon: https://example.com/icon-dev.png

# Production
icon: https://example.com/icon.png
```

### 5. Add Dev Suffix to Title

```yaml
about:
  title: AnyGPT (Local Dev) # Clear it's development version
```

## Debugging

### Check Container Logs

```bash
# View MCP server logs
docker mcp server logs anygpt

# Follow logs
docker mcp server logs anygpt --follow

# Show last 100 lines
docker mcp server logs anygpt --tail 100
```

### Test stdin/stdout

```bash
# Direct test
echo '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{}}' | \
  docker run -i anygpt-mcp:local
```

### Verify Image

```bash
# Check image exists
docker images | grep anygpt-mcp

# Inspect image
docker inspect anygpt-mcp:local

# Test entrypoint
docker run --rm anygpt-mcp:local --help
```

### Common Issues

**Issue**: Server not appearing in MCP Toolkit

**Solution**:

```bash
# Verify catalog was added
docker mcp catalog show my-dev-catalog

# Check server is in catalog
docker mcp catalog show my-dev-catalog | grep anygpt
```

**Issue**: Configuration not working

**Solution**:

```bash
# Validate catalog file syntax
cat anygpt-catalog.yaml | docker mcp catalog validate -

# Check server configuration
docker mcp server show anygpt
```

**Issue**: Server crashes on startup

**Solution**:

```bash
# Check logs
docker mcp server logs anygpt

# Test container directly
docker run -it --rm \
  -e OPENAI_API_KEY=test \
  anygpt-mcp:local
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Local MCP Server

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t anygpt-mcp:test .

      - name: Test container starts
        run: |
          echo '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{}}' | \
            docker run -i -e OPENAI_API_KEY=test anygpt-mcp:test

      - name: Validate catalog file
        run: |
          cat anygpt-catalog.yaml | docker mcp catalog validate -
```

## Migration to Registry

When ready to submit to Docker MCP Registry:

1. **Update catalog file** - Change image to registry path
2. **Test thoroughly** - Ensure everything works locally
3. **Follow registry submission** - See [docker-registry-submission.md](./docker-registry-submission.md)

```yaml
# Before (local)
image: anygpt-mcp:local

# After (registry)
image: mcp/anygpt  # Docker-built
# or
image: ghcr.io/YOUR_ORG/anygpt-mcp  # Self-hosted
```

## References

- [Docker MCP CLI Reference](https://docs.docker.com/reference/cli/docker/mcp/)
- [Docker MCP Catalog Docs](https://docs.docker.com/ai/mcp-catalog-and-toolkit/catalog/)
- [Docker MCP Toolkit Docs](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)
- [Docker Container Spec](./docker-container.md)
- [Docker Registry Submission](./docker-registry-submission.md)
