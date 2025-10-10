---
description: Commit staged files with AI-generated message
---

# Commit Workflow

This workflow commits staged files with AI-generated commit message(s), intelligently breaking large changes into focused commits when appropriate.

## Steps

1. Check if there are staged files with `git diff --staged --name-only`
2. Analyze file paths to detect component boundaries:
   - `.github/workflows/*.yml` → `ci` scope
   - `packages/*/` → package-specific scope
   - `tools/*/` → `tools` scope
   - `docs/*.md` → `docs` scope
   - `e2e/` → `test` scope
3. **Detect multi-component changes**: If changes span 3+ distinct components/scopes
4. **Propose commit strategy**:
   - **Single commit**: If changes are tightly coupled or span <3 components
   - **Multiple commits**: If changes can be logically separated by component
5. For multi-commit strategy:
   - Group files by component/scope (e.g., all `packages/config/*` together)
   - Determine dependency order (types → config → connectors → cli → docs)
   - Create commits in order, each with focused scope
6. For each commit:
   - Get quick stats with `git diff --staged --stat`
   - Generate conventional commit message
   - Commit locally (no push)

## Commit Grouping Rules

When breaking into multiple commits, follow this order:

1. **Core types/interfaces** (`packages/types/`, `packages/router/src/types/`)
2. **Configuration layer** (`packages/config/`)
3. **Connectors** (`packages/connectors/*/`)
4. **Router/orchestration** (`packages/router/`)
5. **CLI/tools** (`packages/cli/`, `tools/`)
6. **Tests** (`e2e/`, `*.test.ts`)
7. **Documentation** (`docs/`, `*.md`, examples)

## Usage

```bash
# Stage your changes first
git add <files>

# Then run the workflow
/commit
```

The AI will:
- Detect if changes should be split into multiple commits
- Propose a grouping strategy if applicable
- Create focused, reviewable commits
- Follow conventional commit format

## Examples

### Single Commit (tightly coupled)
```
packages/config/src/factory.ts
packages/config/src/index.ts
```
→ One commit: `feat(config): add new factory method`

### Multiple Commits (separable)
```
packages/types/src/chat.ts
packages/router/src/types/base.ts
packages/config/src/model-pattern-resolver.ts
packages/cli/src/commands/benchmark.ts
docs/reasoning-effort-levels.md
```
→ Multiple commits:
1. `feat(types): add reasoning parameter to ChatCompletionRequest`
2. `feat(config): add model-pattern-resolver with priority rules`
3. `feat(cli): add modelRules filtering to benchmark command`
4. `docs: add reasoning effort levels guide`

## Notes

- Only commits staged files (use `git add` first)
- Does NOT push to remote (you control when to push)
- Generates commit messages based on actual changes
- Intelligently splits large changes for better review
- Preserves logical dependencies in commit order
