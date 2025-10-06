#!/bin/bash
set -e

echo "🚀 Testing AnyGPT MCP Server"
echo "================================"
echo ""

# Build the MCP server
echo "📦 Building MCP server..."
npx nx build mcp
echo "✅ Build complete"
echo ""

# Test 1: List available tools
echo "🔧 Test 1: Listing available tools..."
RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node packages/mcp/dist/index.js 2>/dev/null)
echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Verify tools are present
CHAT_TOOL=$(echo "$RESPONSE" | jq -r '.result.tools[] | select(.name=="chat_completion") | .name')
LIST_MODELS_TOOL=$(echo "$RESPONSE" | jq -r '.result.tools[] | select(.name=="list_models") | .name')

if [ "$CHAT_TOOL" == "chat_completion" ] && [ "$LIST_MODELS_TOOL" == "list_models" ]; then
    echo "✅ Both tools found: chat_completion and list_models"
else
    echo "❌ Tools not found correctly"
    exit 1
fi
echo ""

# Test 2: Verify tool schema
echo "🔍 Test 2: Verifying chat_completion tool schema..."
SCHEMA=$(echo "$RESPONSE" | jq '.result.tools[] | select(.name=="chat_completion") | .inputSchema')
echo "Schema:"
echo "$SCHEMA" | jq '.'

HAS_MESSAGES=$(echo "$SCHEMA" | jq -r '.properties.messages != null')
HAS_MODEL=$(echo "$SCHEMA" | jq -r '.properties.model != null')
HAS_PROVIDER=$(echo "$SCHEMA" | jq -r '.properties.provider != null')

if [ "$HAS_MESSAGES" == "true" ] && [ "$HAS_MODEL" == "true" ] && [ "$HAS_PROVIDER" == "true" ]; then
    echo "✅ Tool schema is correct"
else
    echo "❌ Tool schema is incomplete"
    exit 1
fi
echo ""

echo "================================"
echo "✅ All MCP server tests passed!"
echo ""
echo "The MCP server is ready to use with:"
echo "  - Claude Desktop"
echo "  - MCP Inspector"
echo "  - Any MCP-compatible client"
echo ""
echo "To test with MCP Inspector:"
echo "  npx @modelcontextprotocol/inspector node packages/mcp/dist/index.js"
