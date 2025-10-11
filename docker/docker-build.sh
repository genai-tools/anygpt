#!/bin/bash
# Quick script to build and update local Docker MCP server

set -e

echo "🔨 Building Docker image..."
docker build -t anygpt-mcp:local .

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Next steps:"
echo "1. Add to Docker MCP catalog:"
echo "   docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml"
echo ""
echo "2. Open Docker Desktop > MCP Toolkit"
echo "3. Switch to 'my-dev-catalog'"
echo "4. Find 'AnyGPT (Local Dev)' and configure it"
echo "5. Enable the server"
echo ""
echo "🔄 To update after code changes:"
echo "   ./docker-build.sh && docker mcp catalog add my-dev-catalog anygpt ./anygpt-catalog.yaml --force"
