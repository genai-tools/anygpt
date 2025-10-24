# AI-Enhanced PR Descriptions Guide

## Overview

The release workflow now supports **AI-generated PR descriptions** that are significantly better than auto-generated ones. This guide explains how to use this feature.

## Why AI-Generated Descriptions?

**Before (Auto-generated)**:

```markdown
## 🚀 Release PR

### 📦 Packages to Publish

- `@anygpt/package@1.0.0`

### 💡 What Changed

[Generic AI summary from commits]
```

**After (AI-Enhanced)**:

```markdown
## 🚀 Major Release: MCP Discovery Server with AI-Powered Tool Search

[Comprehensive overview with context]

### 📊 Release Stats

- **100 commits** merged
- **15 packages** being published
- **506 files** changed

### 📦 Packages to Publish

#### 🌟 New Packages

- Detailed descriptions

#### 🔄 Updated Packages

- Key changes highlighted

### 💡 What's New

[Grouped by feature with impact analysis]

### 🎯 Impact

- Token savings metrics
- DX improvements
- Breaking changes

### ✅ Verification

[Comprehensive checklist]
```

## How It Works

### Step 1: Generate AI Description

When you need to create a release, first generate the PR description:

```bash
# Analyze the changes
git log production..main --oneline

# Create AI-generated description
# (This is done by the AI agent - you request it)
# "Can you create a PR description for the changes between main and production?"
```

The AI will:

1. Analyze commits and changes
2. Identify packages being published
3. Group changes by feature/package
4. Calculate impact metrics
5. Create structured markdown
6. Save to `tmp/pr-description.md`

### Step 2: Release with Custom Description

```bash
# Use the AI-generated description
npx nx publish --pr-description-file=tmp/pr-description.md
```

Or configure in `nx.json`:

```json
{
  "targetDefaults": {
    "release": {
      "executor": "./tools/nx-release:release",
      "options": {
        "prDescriptionFile": "tmp/pr-description.md"
      }
    }
  }
}
```

### Step 3: Edit and Update (Optional)

```bash
# Edit the description
vim tmp/pr-description.md

# Update existing PR
gh pr edit 16 --body-file tmp/pr-description.md
```

## Workflow Integration

### Updated `/release` Workflow

The `/release` workflow now includes:

1. **Step 4**: Generate AI-Enhanced PR Description

   - AI analyzes commits and changes
   - Creates structured markdown
   - Saves to `tmp/pr-description.md`

2. **Step 5**: Release with AI Description

   - `npx nx publish --pr-description-file=tmp/pr-description.md`
   - Uses custom description instead of auto-generated

3. **Step 6**: Review and Edit (Optional)
   - Edit `tmp/pr-description.md` if needed
   - Update PR with `gh pr edit <number> --body-file tmp/pr-description.md`

## Template Structure

AI-generated descriptions follow this structure:

```markdown
## 🚀 [Release Type]: [Brief Summary]

[1-2 sentence overview with context]

### 📊 Release Stats

- **X commits** merged from Y to Z
- **N packages** being published
- **M files** changed (+additions / -deletions)
- **Major features**: List key features

---

## 📦 Packages to Publish

### 🌟 New Packages

- `@anygpt/package@version` - **NEW** Description
  - Key feature 1
  - Key feature 2

### 🔄 Updated Packages

- `@anygpt/package@version` - Brief description
  - Major change 1
  - Major change 2

---

## 💡 What's New

### 🎯 [Feature Name] (version)

**[One-line description]**

**[Category]**:

- ✅ Feature 1 with details
- ✅ Feature 2 with details
- ✅ Feature 3 with details

[Repeat for each major feature/package]

---

## 🎯 Impact

### Token Savings

- **Before**: X tokens per message
- **After**: Y tokens per message
- **Savings**: Z% reduction
- **Cost Impact**: $N/month savings at scale

### Developer Experience

- **Zero-config setup** for most users
- **Unified CLI** for management
- **Better error messages** across packages
- **Improved TypeScript support**

### Breaking Changes

- `@anygpt/package@version` - Description
- Migration guide if needed

---

## ✅ Verification

- [x] All N commits from `branch` branch
- [x] No merge conflicts
- [x] CI/CD pipeline passing
- [x] N packages ready for npm publish
- [x] Breaking changes documented
- [x] Changelogs updated

---

## ⚡ Auto-Merge

This PR will **automatically merge** once all CI checks pass ✅

If checks fail, review the errors and push fixes to this branch.

---

_Detailed changelogs are available in individual package CHANGELOG.md files_
```

## Benefits

✅ **Professional presentation** - Clear structure and formatting  
✅ **Better context** - Explains WHY changes matter  
✅ **Impact analysis** - Shows metrics and improvements  
✅ **Grouped by feature** - Easy to understand scope  
✅ **Highlights value** - Token savings, DX improvements  
✅ **Breaking changes** - Clearly called out  
✅ **Easy to edit** - Markdown file can be refined  
✅ **Reusable** - Keep for release notes

## Examples

### PR #16 - Major Release

- 100 commits, 15 packages
- Comprehensive feature breakdown
- Impact metrics (99.5% token savings)
- Professional structure

### PR #20 - Sync PR

- 3 commits, infrastructure updates
- Categorized changes
- Clear impact statement

## Tips

1. **Request AI generation first** - Let AI analyze and structure
2. **Review before release** - Check `tmp/pr-description.md`
3. **Edit if needed** - Refine details, add context
4. **Keep the file** - Useful for release notes
5. **Reuse structure** - Consistent format every time

## Commands Reference

```bash
# Generate description (via AI agent)
# "Create PR description for changes between main and production"

# Release with custom description
npx nx publish --pr-description-file=tmp/pr-description.md

# Edit description
vim tmp/pr-description.md

# Update existing PR
gh pr edit <number> --body-file tmp/pr-description.md

# View current PR
gh pr view <number>

# List open PRs
gh pr list
```

## Configuration

### In nx.json (Global)

```json
{
  "targetDefaults": {
    "release": {
      "executor": "./tools/nx-release:release",
      "options": {
        "prDescriptionFile": "tmp/pr-description.md"
      }
    }
  }
}
```

### Per-Release (CLI)

```bash
npx nx publish --pr-description-file=tmp/pr-description.md
```

## Fallback Behavior

If the file doesn't exist or can't be read:

- ⚠️ Warning logged
- 🔄 Falls back to auto-generated description
- ✅ Release continues normally

## Future Enhancements

- [ ] Auto-generate on `npx nx publish` if file doesn't exist
- [ ] Template system for different release types
- [ ] Integration with GitHub release notes
- [ ] Multi-language support
- [ ] Changelog integration
