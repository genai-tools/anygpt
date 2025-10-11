# 2-1-cli-chat - Design

**Spec**: [Chat Command](../../../../../products/anygpt/specs/cli/chat.md)  
**Use Case**: [Provider Agnostic Chat](../../../../../products/anygpt/use-cases/provider-agnostic-chat.md)  
**Project**: anygpt-ts

## Overview
Stateless single-turn AI interaction via CLI.

## Components
- Command parser (commander)
- Request builder
- Provider router integration
- Output formatter

## Dependencies
- config-loader, provider-router, connectors

## Implementation
- [ ] Parse arguments (prompt, provider, model, options)
- [ ] Build request
- [ ] Route to provider
- [ ] Format output
- [ ] Handle errors
