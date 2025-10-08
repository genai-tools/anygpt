# AnyGPT MCP Server

A Model Context Protocol (MCP) server that provides unified access to multiple AI providers.

## Key Features

- **Multi-Provider Support**: Connect to multiple AI providers (OpenAI, Anthropic, etc.)
- **Self-Documenting**: Discover providers and models dynamically
- **Unified Interface**: Single API for all providers

## Available Tools

1. **anygpt_list_providers**: Discover configured AI providers
2. **anygpt_list_models**: List available models from a provider
3. **anygpt_chat_completion**: Send chat completion requests

## Getting Started

Start by calling `anygpt_list_providers` to see what's available, then use `anygpt_list_models` to explore models, and finally `anygpt_chat_completion` to interact with AI.
