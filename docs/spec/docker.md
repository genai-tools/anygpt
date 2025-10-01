# Docker Container Specification

## Overview

This document specifies Docker containerization requirements for the GenAI Gateway MCP system.

## Container Requirements

### Base Image
- **Runtime**: `node:18-alpine`
- **Architecture**: Multi-stage build for optimization
- **Size Target**: <200MB

### Image Tags
- **Production**: `ghcr.io/theplenkov/genai-gateway:mcp`
- **Development**: `ghcr.io/theplenkov/genai-gateway:mcp-dev`

## Container Configuration

### Environment Variables

#### Required Variables
- `GATEWAY_URL`: GenAI gateway service URL
- `GATEWAY_API_KEY`: Authentication token

#### Optional Variables  
- `PROVIDER_TYPE`: Default AI provider
- `DEFAULT_MODEL`: Default model name
- `TIMEOUT`: Request timeout in seconds
- `LOG_LEVEL`: Logging level

### Volume Mounts
- **Configuration**: `/app/config` (read-only)
- **Logs**: `/app/logs` (optional)
- **Cache**: `/app/cache` (optional)

### Network Requirements
- **Transport**: stdin/stdout for MCP protocol
- **Health Check**: Port 3000 (optional)
- **Outbound**: HTTPS to gateway service

## MCP Client Integration

### Docker Command Requirements
- **Interactive Mode**: `-i` flag required for stdin/stdout
- **TTY**: `-t` flag recommended  
- **Environment**: Configuration via `-e` flags
- **Cleanup**: `--rm` flag for temporary containers

### Resource Limits
- **Memory**: 512MB limit, 256MB reservation
- **CPU**: 1.0 limit, 0.5 reservation
- **Restart Policy**: `unless-stopped` for production

## Security Requirements

### Container Security
- **Non-root user**: Run as user ID 1001
- **Read-only filesystem**: Root filesystem mounted read-only
- **Capability dropping**: Drop all capabilities except NET_BIND_SERVICE
- **No new privileges**: Security option enabled

### Secrets Management
- **Environment files**: Support for `.env` file loading
- **Docker secrets**: Integration with Docker secrets API
- **File-based secrets**: Support for `*_FILE` environment variables

## Health Check Requirements

### Health Check Interface
- **Endpoint**: HTTP GET `/health` on port 3000
- **Interval**: 30 seconds
- **Timeout**: 5 seconds  
- **Retries**: 3 attempts
- **Start Period**: 10 seconds

### Health Check Response
- **Success**: HTTP 200 with JSON status
- **Failure**: Non-200 status or timeout
- **Dependencies**: Gateway connectivity validation
