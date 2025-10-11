#!/bin/bash
set -e

echo "🔨 Building AnyGPT locally..."
npx nx build mcp

echo "🐳 Building minimal dev Docker image..."
docker build -f Dockerfile.dev -t anygpt-mcp:dev .

echo "✅ Done! Image: anygpt-mcp:dev"
echo ""
echo "🚀 Running with mounted workspace..."
docker run --rm \
  -v "$(pwd):/workspace:ro" \
  -v "$HOME/.config/Cody-nodejs:/home/anygpt/.config/Cody-nodejs:ro" \
  anygpt-mcp:dev
