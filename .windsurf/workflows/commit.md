---
description: Commit staged files with AI-generated message
---

# Commit Workflow

This workflow commits staged files with an AI-generated commit message.

## Steps

1. Check if there are staged files with `git diff --staged --name-only`
2. Use fast pattern matching on file paths to determine scope:
   - `.github/workflows/*.yml` → `feat(ci):`
   - `packages/*/` → `feat(package-name):`
   - `tools/*/` → `feat(tools):`
   - `*.md` → `docs:`
3. Get quick stats with `git diff --staged --stat`
4. Only read full diff if needed for complex changes
5. Generate conventional commit message
6. Commit the staged files locally (no push)

## Usage

```bash
# Stage your changes first
git add <files>

# Then run the workflow
/commit
```

The AI will analyze the staged changes and create a commit with an appropriate message following conventional commit format.

## Notes

- Only commits staged files (use `git add` first)
- Does NOT push to remote (you control when to push)
- Generates commit message based on actual changes
- Fast: uses file paths and stats, not full project analysis
