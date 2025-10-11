#!/bin/bash
set -e

echo "🔨 Building AnyGPT locally..."
npx nx build mcp

echo "🐳 Building Docker image from local artifacts..."
# Use local dockerignore that includes node_modules
cp .dockerignore .dockerignore.backup 2>/dev/null || true
cp .dockerignore.local .dockerignore
docker build -f Dockerfile.local -t anygpt-mcp:local .
# Restore original dockerignore
mv .dockerignore.backup .dockerignore 2>/dev/null || true

echo "✅ Done! Image: anygpt-mcp:local"
echo ""
echo "To run:"
echo "  docker run -v ~/.anygpt/anygpt.config.ts:/app/.anygpt/anygpt.config.ts:ro anygpt-mcp:local"
