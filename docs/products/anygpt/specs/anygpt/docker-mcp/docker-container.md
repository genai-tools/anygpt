# Docker Container Specification

**Related Use Case**: [Docker MCP Toolkit Integration](../use-cases/docker-mcp-toolkit.md)  
**Related Spec**: [Docker Registry Submission](./docker-registry-submission.md)

Specification for building AnyGPT as a Docker container compatible with Docker MCP Registry and Docker Desktop MCP Toolkit.

## Overview

The AnyGPT MCP server must be packaged as a Docker container that:

- Runs the MCP server on stdin/stdout
- Accepts configuration via environment variables
- Logs to stderr only (never stdout)
- Supports Docker exec communication
- Works with Docker Desktop MCP Toolkit

## Dockerfile Requirements

### Base Image

Use official Node.js LTS image:

```dockerfile
FROM node:20-alpine
```

**Rationale**: Alpine for minimal size, Node 20 LTS for stability

### Working Directory

```dockerfile
WORKDIR /app
```

### Dependencies

Install only production dependencies:

```dockerfile
COPY package*.json ./
RUN npm ci --only=production
```

### Application Files

```dockerfile
COPY dist/ ./dist/
COPY packages/mcp/package.json ./packages/mcp/
```

**Note**: Only copy built artifacts, not source code

### User

Run as non-root user for security:

```dockerfile
RUN addgroup -g 1001 -S anygpt && \
    adduser -S anygpt -u 1001 -G anygpt

USER anygpt
```

### Entrypoint

```dockerfile
ENTRYPOINT ["node", "dist/packages/mcp/index.js"]
```

**Critical**: Must start MCP server directly, no shell wrapper

### Labels

Add OCI labels for metadata:

```dockerfile
LABEL org.opencontainers.image.title="AnyGPT MCP Server"
LABEL org.opencontainers.image.description="Universal AI provider gateway"
LABEL org.opencontainers.image.source="https://github.com/YOUR_ORG/openai-gateway-mcp"
LABEL org.opencontainers.image.licenses="MIT"
```

## Complete Dockerfile Example

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY packages/mcp/package.json ./packages/mcp/

# Create non-root user
RUN addgroup -g 1001 -S anygpt && \
    adduser -S anygpt -u 1001 -G anygpt

USER anygpt

# Metadata
LABEL org.opencontainers.image.title="AnyGPT MCP Server"
LABEL org.opencontainers.image.description="Universal AI provider gateway with multi-provider support"
LABEL org.opencontainers.image.source="https://github.com/YOUR_ORG/openai-gateway-mcp"
LABEL org.opencontainers.image.licenses="MIT"

# Start MCP server
ENTRYPOINT ["node", "dist/packages/mcp/index.js"]
```

## Runtime Requirements

### stdin/stdout Communication

**Critical Requirement**: The container MUST:

- Read JSON-RPC requests from stdin
- Write JSON-RPC responses to stdout
- **NEVER** write anything else to stdout (no logs, no debug output)

**Validation**:

```bash
echo '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{}}' | \
  docker run -i anygpt-mcp
```

Expected: Valid JSON-RPC response on stdout

### Logging

All logs MUST go to stderr:

```typescript
// Good
console.error('[INFO]', message);
process.stderr.write(logMessage);

// Bad - breaks MCP protocol
console.log('[INFO]', message); // Goes to stdout!
```

**Implementation**: Use logger that writes to stderr only

### Environment Variables

Container MUST support these environment variables:

#### Required (at least one provider)

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_API_KEY` - Google AI API key

#### Optional

- `DEFAULT_PROVIDER` - Default provider name (e.g., "openai")
- `DEFAULT_MODEL` - Default model name (e.g., "gpt-4o")
- `LOG_LEVEL` - Logging level: "debug", "info", "warn", "error"
- `CONFIG_FILE` - Path to config file (if using file-based config)

### Configuration File Support

Container MAY support mounted config file:

```bash
docker run -v ./anygpt.config.yaml:/config/anygpt.config.yaml:ro \
  -e CONFIG_FILE=/config/anygpt.config.yaml \
  anygpt-mcp
```

**Note**: Environment variables should override config file settings

### Exit Codes

- `0` - Clean shutdown
- `1` - Configuration error (missing API keys, invalid config)
- `2` - Initialization error (failed to start MCP server)
- `3` - Fatal runtime error

### Signal Handling

Container MUST handle signals gracefully:

- `SIGTERM` - Graceful shutdown (complete in-flight requests)
- `SIGINT` - Graceful shutdown
- `SIGKILL` - Force kill (handled by Docker)

**Implementation**:

```typescript
process.on('SIGTERM', async () => {
  console.error('[INFO] Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});
```

## Docker Exec Communication

Container MUST work with `docker exec -i`:

```bash
docker run -d --name anygpt-mcp \
  -e OPENAI_API_KEY=sk-... \
  anygpt-mcp

echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  docker exec -i anygpt-mcp node dist/packages/mcp/index.js
```

**Note**: This is how Docker Desktop MCP Toolkit communicates with servers

## Health Check

Container SHOULD support health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "process.exit(0)"
```

**Alternative**: If CLI supports validation:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD anygpt config validate || exit 1
```

## Security Requirements

### No Network Ports

Container MUST NOT expose network ports:

- No HTTP server
- No WebSocket server
- Communication via stdin/stdout only

### Secrets Management

API keys MUST be provided via:

1. Environment variables (basic)
2. Docker secrets (recommended)
3. Mounted secret files (advanced)

**Never**:

- Hardcode API keys in image
- Log API keys to stderr
- Include API keys in error messages

### Read-Only Filesystem

Container SHOULD work with read-only filesystem:

```bash
docker run --read-only anygpt-mcp
```

**Exception**: May need writable `/tmp` for temp files

### Non-Root User

Container MUST run as non-root user (see Dockerfile example)

## Build Requirements

### Multi-Stage Build

Use multi-stage build to minimize image size:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
# ... rest of Dockerfile
```

### Image Size

Target image size: **< 100MB**

**Optimization**:

- Use Alpine base image
- Multi-stage build
- Only production dependencies
- No source code in final image

### Build Arguments

Support build-time configuration:

```dockerfile
ARG VERSION=latest
LABEL org.opencontainers.image.version="${VERSION}"
```

## Testing Requirements

### Local Testing

Test container locally before submission:

```bash
# Build
docker build -t anygpt-mcp .

# Test stdin/stdout
echo '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{}}' | \
  docker run -i -e OPENAI_API_KEY=test anygpt-mcp

# Test with Docker exec
docker run -d --name test-mcp -e OPENAI_API_KEY=test anygpt-mcp
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  docker exec -i test-mcp node dist/packages/mcp/index.js
docker rm -f test-mcp
```

### Automated Testing

Container MUST pass these tests:

1. **Starts successfully** with valid config
2. **Fails with exit code 1** with invalid config
3. **Responds to initialize** request
4. **Lists tools** correctly
5. **Handles chat completion** request
6. **Logs to stderr only** (stdout is clean JSON-RPC)
7. **Shuts down gracefully** on SIGTERM

## Registry Compatibility

### Docker Hub

If using Docker-built images:

- Image published to `mcp/anygpt`
- Automatic security scanning
- SBOM generation
- Provenance tracking

### GitHub Container Registry

If self-hosting:

- Image published to `ghcr.io/YOUR_ORG/anygpt-mcp`
- Manual security scanning
- Manual SBOM generation

### Image Tags

Support semantic versioning:

- `latest` - Latest stable release
- `1.0.0` - Specific version
- `1.0` - Minor version
- `1` - Major version

## Platform Support

Container MUST support:

- `linux/amd64` (required)
- `linux/arm64` (recommended)

**Build for multiple platforms**:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t anygpt-mcp .
```

## Documentation Requirements

Container image MUST include:

- README with usage instructions
- LICENSE file
- Example configuration
- Troubleshooting guide

## Non-Goals

- HTTP/REST API (MCP protocol only)
- Web UI (CLI/MCP only)
- Persistent storage (stateless)
- Database (stateless)
- Caching (stateless)

## Validation Checklist

Before submission, verify:

- [ ] Dockerfile follows all requirements
- [ ] Container starts with valid config
- [ ] Container fails gracefully with invalid config
- [ ] stdin/stdout communication works
- [ ] Logging goes to stderr only
- [ ] Docker exec communication works
- [ ] Health check passes
- [ ] Runs as non-root user
- [ ] No network ports exposed
- [ ] Image size < 100MB
- [ ] Multi-platform support
- [ ] Security scan passes
- [ ] All tests pass

## References

- [Docker MCP Registry](https://github.com/docker/mcp-registry)
- [Docker MCP Toolkit Docs](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)
- [MCP Protocol Spec](https://modelcontextprotocol.io/introduction)
- [OCI Image Spec](https://github.com/opencontainers/image-spec)
