---
description: Commit staged files with AI-generated message
---

# Commit Workflow

This workflow commits staged files with an AI-generated commit message.

## Steps

1. Check if there are staged files
2. Analyze the staged changes to understand what was modified
3. Read `.nx/workspace-data/project-graph.json` for project context (faster than running `nx graph`)
4. Generate an appropriate conventional commit message
5. Commit the staged files locally (no push)

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
- Uses cached project graph for speed
