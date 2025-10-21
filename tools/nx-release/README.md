# nx-release

An Nx executor plugin for automated release workflows with AI-generated summaries.

## Features

✅ **Automated Version Bumping** - Uses `nx release` with conventional commits  
✅ **Changelog Extraction** - Automatically extracts and formats changelogs  
✅ **AI-Powered Summaries** - Generates intelligent PR descriptions using AI  
✅ **Git Operations** - Handles tagging, pushing, and branch management  
✅ **PR Automation** - Creates/updates release PRs with auto-merge support  
✅ **Configurable** - Flexible options for different workflows

## Installation

⚠️ **Note**: This is a workspace-local Nx plugin, not published to npm.

It's automatically available in this monorepo. No installation needed.

## Usage

### Configure in workspace

Add to your root `package.json` or `project.json`:

```json
{
  "name": "root",
  "nx": {
    "targets": {
      "release": {
        "executor": "nx-release:release",
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

### Run the release

```bash
# Using Nx
nx run root:release

# Or via npm script
npm run release
```

## Configuration Options

| Option              | Type                 | Default                       | Description                            |
| ------------------- | -------------------- | ----------------------------- | -------------------------------------- |
| `baseBranch`        | `string`             | `"main"`                      | Base branch to release from            |
| `targetBranch`      | `string`             | `"production"`                | Target branch for the release PR       |
| `changelogPatterns` | `string[]`           | `["packages/*/CHANGELOG.md"]` | Glob patterns for changelog files      |
| `aiProvider`        | `"anygpt" \| "none"` | `"anygpt"`                    | AI provider for summaries              |
| `aiCommand`         | `string`             | `"npx anygpt chat"`           | Command to run for AI generation       |
| `autoMerge`         | `boolean`            | `true`                        | Enable auto-merge on PR                |
| `skipPublish`       | `boolean`            | `true`                        | Skip publishing (passed to nx release) |
| `diffPaths`         | `string[]`           | `["packages/*/src/**"]`       | Paths to include in diff for AI        |

## How It Works

1. **Validates** - Checks you're on the correct branch with no uncommitted changes
2. **Versions** - Runs `nx release` to bump versions and update changelogs
3. **Tags** - Creates git tags for each released package
4. **Pushes** - Pushes commits and tags to remote
5. **Analyzes** - Extracts changelogs and generates AI summary from diff
6. **Creates PR** - Opens a release PR with formatted description
7. **Auto-merge** - Optionally enables auto-merge when CI passes

## Requirements

- Nx workspace with `nx release` configured
- GitHub CLI (`gh`) installed and authenticated
- AI provider (e.g., `anygpt`) if using AI summaries

## Technical Notes

### GitHub Projects (Classic) Deprecation

This plugin uses direct GraphQL queries to GitHub's API to avoid the deprecated Projects (Classic) fields. The `getExistingPR` function queries only the necessary PR fields (`number`) without triggering deprecation warnings about `projectCards`.

## Example Workflow

```bash
# Make some changes with conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"

# Run release
npm run release

# The plugin will:
# ✅ Bump versions based on commits
# ✅ Update CHANGELOGs
# ✅ Create git tags
# ✅ Push to remote
# ✅ Generate AI summary
# ✅ Create release PR
# ✅ Enable auto-merge
```

## Publishing

When the release PR is merged to the target branch (e.g., `production`), your CI should:

1. Run `nx release publish` to publish packages to npm
2. Sync the base branch with the target branch

## License

MIT
