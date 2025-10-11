# Interactive AI Summary Generation

## Overview

The interactive AI mode is a more efficient approach to generating PR summaries for large changesets. Instead of sending the entire diff to the AI upfront (which can exceed token limits), it uses a three-step process where the AI selects which files to examine.

## How It Works

### Step 1: File Statistics

The system extracts statistics from the git diff:

- File paths
- Number of additions/deletions per file
- Total changes per file

These statistics are sent to the AI along with:

- Package names and versions being released
- Changelog summary (first 2000 chars)

### Step 2: AI File Selection

The AI analyzes the statistics and responds with a JSON array of files it wants to examine:

```json
[
  { "path": "packages/cli/src/commands/chat.ts", "maxLines": 300 },
  { "path": "packages/router/src/tag-registry.ts", "maxLines": 200 },
  { "path": "packages/config/src/loader.ts" }
]
```

The AI is instructed to:

- Focus on core implementation files (not tests, configs, or generated files)
- Select files with significant changes indicating new features or important fixes
- Limit selection to 5-10 files to stay within token limits

### Step 3: Summary Generation

The system extracts the requested file diffs and sends them to the AI for summary generation, along with the full changelog.

## Benefits

1. **Token Efficiency**: Only sends relevant code to the AI, not the entire diff
2. **Better Context**: AI sees file statistics first and can make informed decisions
3. **Scalability**: Works with PRs of any size
4. **Intelligent Selection**: AI focuses on files that matter most for the summary

## Configuration

Enable interactive mode in `nx.json`:

```json
{
  "targets": {
    "pr-update": {
      "executor": "./tools/nx-release:pr-update",
      "options": {
        "aiCommand": "npx anygpt chat --stdin --tag sonnet --max-tokens 2000",
        "interactiveAI": true
      }
    }
  }
}
```

Or pass it as a flag:

```bash
npx nx pr-update --interactiveAI=true
```

## Fallback Behavior

If the AI fails to return valid JSON or the parsing fails, the system automatically falls back to selecting the top 5 files by number of changes, excluding:

- Test files (`.test.`, `.spec.`)
- Package manifests (`package.json`, `package-lock.json`)

## Comparison with Standard Mode

### Standard Mode

- Truncates each file to `maxLinesPerFile` (default: 150)
- Sends all truncated files to AI
- Single AI call
- Can still exceed token limits on very large PRs

### Interactive Mode

- AI sees all file statistics
- AI selects specific files to examine
- Two AI calls (selection + summary)
- More token-efficient for large PRs
- Better context awareness

## When to Use

**Use Interactive Mode when:**

- PR has 100+ files changed
- PR exceeds 20,000 lines of diff
- Standard mode fails with token limit errors
- You want more intelligent file selection

**Use Standard Mode when:**

- PR is small to medium sized
- You want faster execution (one less AI call)
- You want simpler, more predictable behavior
