# 2-2-cli-config

**Spec**: [Config Command](../../../../../products/anygpt/specs/anygpt/cli/config.md)  
**Use Case**: [Flexible Configuration](../../../../../products/anygpt/use-cases/flexible-configuration.md)  
**Status**: ❌ Not Started  
**Progress**: 0/6 tasks

## Overview

Configuration inspection and validation commands. Helps users understand and debug their configuration.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 1-1-config-loader

## Tasks

- [ ] Implement show subcommand (display current config)
- [ ] Implement validate subcommand (check config file)
- [ ] Implement list subcommand (show search paths)
- [ ] Write tests for all subcommands
- [ ] Error handling with helpful messages
- [ ] Documentation

## Design

**Subcommands**:
- `show` - Display current configuration
- `validate` - Check configuration file for errors
- `list` - Show all configuration search paths

**See [design.md](./design.md)** for detailed design.

## Tests

**E2E Tests**:
- `anygpt config show` displays config
- `anygpt config validate` checks config
- `anygpt config list` shows paths
- Exit codes match spec

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

**Internal**: 1-1-config-loader  
**External**: commander

## References

- [Architecture](../../architecture.md)
- [Roadmap](../../roadmap.md)
- [Spec](../../../../../products/anygpt/specs/anygpt/cli/config.md)
