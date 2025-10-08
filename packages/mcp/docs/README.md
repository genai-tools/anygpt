# MCP Documentation Files

This directory contains documentation that is exposed as MCP Resources for AI agents to read and learn from.

## Files

- **overview.md** - Introduction to AnyGPT MCP server (`anygpt://docs/overview`)
- **workflow.md** - Step-by-step discovery workflow (`anygpt://docs/workflow`)
- **basic-chat-example.md** - Complete usage example (`anygpt://examples/basic-chat`)

## Related Documentation

- **[Tag Resolution Guide](../../cli/docs/tag-resolution.md)** - How tags work and how to use them (shared with CLI)

## Dynamic Resources

The following resources are generated dynamically based on the current configuration:

- **`anygpt://docs/providers`** - Lists currently configured providers (JSON)

## How It Works

1. These markdown files are bundled with the MCP server during build
2. The `tsdown.config.ts` copies the `docs/` directory to `dist/docs/`
3. At runtime, the server reads these files using `readFileSync()`
4. AI agents can request these resources via the MCP protocol

## Editing Documentation

To update the documentation:

1. Edit the markdown files in this directory
2. Rebuild the MCP package: `nx build mcp`
3. The updated docs will be available to AI agents

## Benefits of File-Based Docs

- **Easy to Edit**: Use any markdown editor
- **Version Control**: Git diffs work properly
- **Reusable**: Can be used in other contexts (website, README, etc.)
- **No Escaping**: No need to escape backticks or quotes in code
- **Maintainable**: Non-developers can edit without touching code
