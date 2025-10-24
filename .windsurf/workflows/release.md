---
description: AI-enhanced release procedure with smart PR descriptions
auto_execution_mode: 3
---

> **📚 Detailed Guide**: See `.windsurf/workflows/ai-pr-descriptions.md` for comprehensive documentation on AI-generated PR descriptions.

# Preconditions

- **Focus**: Perform only the commands listed below. Do not trigger other tasks, inspections, or interactive tools.
- **Scope**: Keep execution under 60 seconds. If unexpected work appears, stop and ask the user.
- **Security**: MUST run security checks before committing. See /security-check global workflow if present

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

# Step 4 · Generate AI-Enhanced PR Description

**This is the NEW step that makes PR descriptions amazing\!**

- **Goal**: Generate a comprehensive, well-structured PR description using AI analysis
- **Process**:

  1. Analyze commits between current branch and target (production)
  2. Identify package changes, features, breaking changes
  3. Create structured markdown with sections:
     - Release overview with stats
     - Packages being published (new vs updated)
     - What's new (grouped by package/feature)
     - Impact analysis (token savings, DX improvements, breaking changes)
     - Verification checklist
  4. Save to `tmp/pr-description.md`

- **Template Structure**:

  ```markdown
  ## 🚀 [Release Type]: [Brief Summary]

  [1-2 sentence overview]

  ### 📊 Release Stats

  - **X commits** merged
  - **Y packages** being published
  - **Z files** changed

  ### 📦 Packages to Publish

  #### 🌟 New Packages

  - `@anygpt/package@version` - Description

  #### 🔄 Updated Packages

  - `@anygpt/package@version` - Key changes

  ### 💡 What's New

  #### 🎯 [Feature Name] (version)

  - ✅ Feature 1
  - ✅ Feature 2

  ### 🎯 Impact

  - **Metric**: Before → After
  - **DX**: Improvements
  - **Breaking**: Changes if any

  ### ✅ Verification

  - [x] Checklist items
  ```

- **File Location**: Always save to `tmp/pr-description.md`
- **Why This Matters**:
  - Better communication of changes
  - Highlights impact and value
  - Professional presentation
  - Easy to review and edit before release

# Step 5 · Release with AI Description

- **Command**: `npx nx publish --pr-description-file=tmp/pr-description.md`
- **Goal**: Execute release with AI-generated PR description
- **Rule**: NEVER manually run `nx release` or other Nx commands directly
- **Behavior**:
  - **With version changes**: Creates release PR with AI description, auto-merge enabled
  - **With unpushed commits (no versions)**: Creates sync PR with AI description, auto-merge enabled
  - **No changes at all**: Creates draft PR as placeholder
- **If it fails**:
  - Stop immediately and report the error
  - Do NOT attempt to fix with manual commands
  - Let the user decide how to proceed

## Special Case: New Packages

When releasing a **new package** for the first time, the release script will automatically detect missing git tags and retry with `--first-release`. The AI description will highlight new packages in a dedicated section.

# Step 6 · Review and Edit (Optional)

- **File**: `tmp/pr-description.md`
- **Action**: User can edit the description before or after PR creation
- **Update Command**: `gh pr edit <number> --body-file tmp/pr-description.md`
- **Why**: Allows manual refinement while keeping AI-generated structure

---

## Benefits of AI-Enhanced Descriptions

✅ **Better than auto-generated**: AI understands context and impact  
✅ **Consistent structure**: Professional format every time  
✅ **Highlights value**: Shows token savings, DX improvements  
✅ **Easy to edit**: Markdown file can be refined before/after  
✅ **Reusable**: Keep descriptions for release notes

## Example Commands

```bash
# Generate description and release
npx nx publish --pr-description-file=tmp/pr-description.md

# Edit description after PR creation
vim tmp/pr-description.md
gh pr edit 16 --body-file tmp/pr-description.md

# Reuse description for another PR
gh pr edit 20 --body-file tmp/pr-description.md
```
