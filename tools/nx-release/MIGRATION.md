# Migration from scripts/release.ts to nx-release

## What Changed?

The release workflow has been migrated from a standalone script (`scripts/release.ts`) to a reusable Nx executor plugin (`tools/nx-release`).

## Why?

1. **Reusability**: The plugin can be published to npm and used in other projects
2. **Consistency**: Follows the same pattern as other nx-* tools in this workspace
3. **Configurability**: Easier to customize via Nx configuration
4. **Maintainability**: Modular code structure with clear separation of concerns

## Usage

### Before
```bash
npm run release  # Called jiti scripts/release.ts
```

### After
```bash
npm run release  # Now calls nx run root:release
```

The command is the same! The implementation just changed.

## Architecture

### Old Structure
```
scripts/release.ts  # ~335 lines, monolithic script
```

### New Structure
```
tools/nx-release/
├── src/
│   ├── executors/
│   │   └── release/
│   │       ├── executor.ts      # Main executor logic
│   │       ├── schema.json      # Configuration schema
│   │       └── schema.d.ts      # TypeScript types
│   ├── lib/
│   │   ├── ai-summary.ts        # AI integration (modular)
│   │   ├── changelog.ts         # Changelog extraction
│   │   ├── git-operations.ts    # Git commands
│   │   └── pr-creation.ts       # PR logic
│   └── index.ts                 # Public exports
├── executors.json               # Executor registration
├── package.json                 # Package metadata
└── README.md                    # Documentation
```

## Configuration

The release target is configured in `package.json`:

```json
{
  "nx": {
    "targets": {
      "release": {
        "executor": "./tools/nx-release:release",
        "options": {
          "baseBranch": "main",
          "targetBranch": "production",
          "aiProvider": "anygpt",
          "autoMerge": true
        }
      }
    }
  }
}
```

## Available Options

See `tools/nx-release/src/executors/release/schema.json` for all options:

- `baseBranch` - Base branch to release from (default: "main")
- `targetBranch` - Target branch for PR (default: "production")
- `changelogPatterns` - Glob patterns for changelogs
- `aiProvider` - AI provider ("anygpt" or "none")
- `aiCommand` - Command for AI generation
- `autoMerge` - Enable auto-merge on PR
- `skipPublish` - Skip publishing (passed to nx release)
- `diffPaths` - Paths to include in diff for AI

## Publishing the Plugin

When ready to publish:

1. Update `tools/nx-release/package.json` with proper name and version
2. Build: `npm run build`
3. Publish: `cd tools/nx-release && npm publish`

Then other projects can use it:

```bash
npm install @your-org/nx-release --save-dev
```

## Backward Compatibility

The old `scripts/release.ts` has been renamed to `scripts/release.ts.deprecated` and will show an error message directing users to the new command.

## Next Steps

1. ✅ Plugin created and working locally
2. ⏳ Test thoroughly with actual releases
3. ⏳ Publish to npm
4. ⏳ Remove deprecated script after confirming stability
5. ⏳ Remove legacy `tools/release-automation`
