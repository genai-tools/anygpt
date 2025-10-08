---
description: Minimal release procedure
---

# Preconditions
- **Focus**: Perform only the commands listed below. Do not trigger other tasks, inspections, or interactive tools.
- **Scope**: Keep execution under 60 seconds. If unexpected work appears, stop and ask the user.
- **Security**: MUST run security checks before committing. See `.windsurf/workflows/security-check.md`

# Step 0 · Security Pre-Check (AUTOMATIC)
- **Protection**: Pre-commit hook automatically scans ALL commits
- **Location**: `.git/hooks/pre-commit` (already installed)
- **What it checks**:
  - ❌ Hardcoded secrets (sgp_, sk-, ghp_ tokens)
  - ❌ Internal company URLs (company.example, etc.)
  - ❌ Sensitive files (.env, config.json, etc.)
  - ❌ Real credentials in example files
- **Behavior**: **BLOCKS the commit** if issues are found
- **Why**: Prevents secrets from ever reaching git history - damage prevention at the source

# Step 1 · Review status
- **Command**: `git status -sb`
- **Goal**: Identify staged/untracked files without running additional diagnostics.
- **Tip**: To map paths to Nx projects, run:
  ```bash
  npx nx graph --print | jq '
  .graph.nodes |= with_entries(
    .value.data |= { root: .root }
  )
  '
  ```
  This produces a quick lookup of project roots so you can stage files per component without extra inspection.

# Step 2 · Stage & commit
- **Action**: Stage files for one Nx component at a time and create a dedicated commit for that component.
- **Component naming**: Use the Nx project name from `project.json` (e.g., `openai`, not `connectors/openai`). Run the `npx nx graph --print | jq ...` command from Step 1 to map file paths to actual project names.
- **Commit message format**:
  - **Title**: Conventional commit format (e.g., `feat(openai): add list-models support`)
  - **Body**: Summarize the change in 1-2 sentences. Reference related issues or PRs if found in code comments (e.g., `Fixes #123`, `Related to #456`).
- **Rule**: Produce separate commits per component and a standalone `docs:` commit for documentation-only changes. Do not batch multiple components into a single commit. Only use `git add`, `git commit`, and `git reset` if needed—no rebase/pull operations.

# Step 3 · Pre-flight CI checks
// turbo
- **Command**: `npx nx run-many -t lint test build typecheck --projects='packages/*,packages/connectors/*'`
- **Goal**: Run all CI checks locally before releasing to catch issues early
- **Rule**: If this fails, fix the issues before proceeding to release. Do NOT skip this step.
- **Why**: Reduces failed CI pipelines and ensures the release PR will pass checks

# Step 4 · Release
- **Command**: `npm run release`
- **Goal**: Execute the scripted Nx release and let it push changes.
- **Rule**: NEVER manually run `nx release` or any other Nx commands directly. The `npm run release` command is a custom executor that handles the entire release workflow including PR creation.
- **If it fails**: 
  - Stop immediately and report the error to the user
  - Do NOT attempt to fix it by running manual commands
  - Do NOT bypass the release script - it does more than just version bumping
  - The release script handles: version bumping, changelog generation, git tagging, pushing, PR creation, and auto-merge setup
  - Let the user decide how to proceed (e.g., whether to use `--first-release` for new packages)

## Special Case: New Packages

When releasing a **new package** for the first time, the release script will automatically detect the missing git tags and retry with `--first-release`. You don't need to do anything special - just run `npm run release` as normal.

The script will show:
```
⚠️  Detected new package(s) without git tags
🔄 Retrying with --first-release flag...
```

Then it will continue with the full release workflow (PR creation, auto-merge, etc.).

