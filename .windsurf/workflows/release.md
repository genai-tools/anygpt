---
description: Minimal release procedure
---

# Preconditions
- **Focus**: Perform only the commands listed below. Do not trigger other tasks, inspections, or interactive tools.
- **Scope**: Keep execution under 60 seconds. If unexpected work appears, stop and ask the user.

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
- **Rule**: Produce separate conventional commits per component (e.g., `feat(cli): ...`, `feat(router): ...`) and a standalone `docs:` commit for documentation-only changes. Do not batch multiple components into a single commit. Only use `git add`, `git commit`, and `git reset` if needed—no rebase/pull operations.

# Step 3 · Release
- **Command**: `npm run release`
- **Goal**: Execute the scripted Nx release and let it push changes.
- **Rule**: Do not run other Nx tasks or scripts unless the release script fails.

