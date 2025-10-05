# Release Workflow

This document describes the automated Release PR workflow for AnyGPT packages.

## 🎯 Overview

We use a **Release PR workflow** to ensure safe, reviewable releases:

1. Developer pushes `feat`/`fix` commits to `main`
2. CI validates the changes (lint, test, build)
3. Bot automatically creates a **Release PR** with version bumps
4. Team reviews the PR and waits for CI to pass
5. Merging the PR triggers automatic publishing to npm

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Developer pushes feat/fix commit to main                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ CI runs: lint, test, build, typecheck                       │
│ ✅ Must pass before proceeding                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Bot checks: Are there releasable changes?                   │
│ (using conventional commits)                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼ No                ▼ Yes
    ┌───────┐         ┌──────────────────────────────────────┐
    │ Stop  │         │ Bot creates release-next branch      │
    └───────┘         │ Runs: npx nx release version --yes   │
                      │ - Bumps versions                     │
                      │ - Updates CHANGELOGs                 │
                      └─────────┬────────────────────────────┘
                                │
                                ▼
                      ┌──────────────────────────────────────┐
                      │ Bot creates/updates Release PR       │
                      │ 📋 Shows all changes                 │
                      │ 🏷️  Labeled: "release"              │
                      └─────────┬────────────────────────────┘
                                │
                                ▼
                      ┌──────────────────────────────────────┐
                      │ YOU REVIEW THE PR                    │
                      │ - Check version bumps                │
                      │ - Review CHANGELOGs                  │
                      │ - Edit if needed                     │
                      │ - Wait for CI ✅                     │
                      └─────────┬────────────────────────────┘
                                │
                      ┌─────────┴─────────┐
                      │                   │
                      ▼ Close PR          ▼ Merge PR
                  ┌───────┐         ┌──────────────────────┐
                  │ Stop  │         │ Publish workflow     │
                  └───────┘         │ - Creates git tags   │
                                    │ - Publishes to npm   │
                                    │ - Deletes branch     │
                                    └──────────────────────┘
```

## 📋 How It Works

### Step 1: Push Changes

Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature (minor version bump)
git commit -m "feat(config): add native TypeScript support"

# Bug fix (patch version bump)
git commit -m "fix(cli): resolve config loading issue"

# Breaking change (major version bump)
git commit -m "feat(api)!: redesign configuration API

BREAKING CHANGE: Configuration format has changed"

# Push to main
git push
```

### Step 2: Automatic CI Validation

GitHub Actions automatically runs:
- ✅ Code formatting check
- ✅ Linting
- ✅ Unit tests
- ✅ Build
- ✅ Type checking

**If CI fails**, the workflow stops here. Fix the issues and push again.

### Step 3: Release PR Creation

If CI passes and there are releasable changes, the bot:

1. **Creates `release-next` branch** from `main`
2. **Runs `nx release version`** to:
   - Detect changes via conventional commits
   - Bump package versions
   - Update `CHANGELOG.md` files
3. **Creates/Updates Release PR** with:
   - Title: "🚀 Release: Next Version"
   - Label: `release`
   - Description with all changes

### Step 4: Review the Release PR

**What to review:**

1. **Version Bumps** (in `package.json` files)
   - Check if version increments are correct
   - Verify dependent packages are updated

2. **CHANGELOGs** (in `CHANGELOG.md` files)
   - Review generated changelog entries
   - Edit descriptions if needed
   - Add missing context

3. **CI Status**
   - Wait for all checks to pass ✅
   - Fix any issues if checks fail

**How to edit:**

If you need to modify the changelog or version:

```bash
# Checkout the release branch
git fetch origin release-next
git checkout release-next

# Make your edits
vim packages/config/CHANGELOG.md

# Commit and push
git commit -am "docs: improve changelog description"
git push origin release-next

# The PR will update automatically
```

### Step 5: Merge to Release

When ready to release:

1. **Ensure CI is green** ✅
2. **Click "Merge pull request"**
3. **Confirm the merge**

**What happens automatically:**

- ✅ Git tags are created (e.g., `config@0.3.0`, `cli@0.1.6`)
- ✅ Packages are published to npm
- ✅ Release branch is deleted
- ✅ GitHub releases are created (optional)

## 🎛️ Advanced Usage

### Batching Multiple Changes

The workflow automatically batches changes:

```bash
# Push multiple commits
git commit -m "feat(config): add feature A"
git push

git commit -m "feat(cli): add feature B"  
git push

# Bot updates the SAME Release PR
# Both changes will be in one release
```

### Canceling a Release

To cancel a pending release:

1. **Close the Release PR** (don't merge)
2. The `release-next` branch will be deleted on next run
3. No packages are published

You can reopen or recreate the PR later.

### Emergency Fixes

If you need to release a fix immediately:

1. Push the fix to `main`
2. Wait for Release PR to update (or create new one)
3. Review quickly
4. Merge immediately

The workflow is fast - typically takes 2-3 minutes from push to publish.

## 📦 Package Versioning

### Independent Versioning

Each package versions independently based on its changes:

```
config: 0.2.2 → 0.3.0  (feat: new feature)
cli:    0.1.5 → 0.1.6  (dependency bump)
mcp:    0.1.3 → 0.1.3  (no changes)
```

### Dependency Updates

When a package is updated, its dependents automatically get a patch bump:

```
feat(config): add feature
↓
config: 0.2.2 → 0.3.0  (minor bump - has changes)
cli:    0.1.5 → 0.1.6  (patch bump - depends on config)
```

### Version Bump Rules

Based on [Conventional Commits](https://www.conventionalcommits.org/):

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | **minor** | 0.2.2 → 0.3.0 |
| `fix:` | **patch** | 0.2.2 → 0.2.3 |
| `feat!:` or `BREAKING CHANGE:` | **major** | 0.2.2 → 1.0.0 |
| `docs:`, `chore:`, etc. | **none** | No version bump |

## 🔍 Troubleshooting

### Release PR Not Created

**Possible causes:**

1. **No releasable changes**
   - Only `docs:`, `chore:`, `style:` commits
   - Solution: Add `feat:` or `fix:` commit

2. **CI failed**
   - Lint, test, or build errors
   - Solution: Fix errors and push again

3. **No conventional commits**
   - Commits don't follow format
   - Solution: Use `feat:`, `fix:`, etc.

### CI Fails on Release PR

**Steps to fix:**

1. Check the CI logs in the PR
2. Fix the issues locally
3. Push to the `release-next` branch:
   ```bash
   git checkout release-next
   # fix issues
   git commit -am "fix: resolve CI issues"
   git push origin release-next
   ```

### Wrong Version Bump

**To fix:**

1. Edit `package.json` in the `release-next` branch
2. Update the version manually
3. Commit and push
4. Update `CHANGELOG.md` if needed

### Publish Failed

**Recovery:**

1. Check the workflow logs
2. If npm publish failed, you can retry:
   ```bash
   # Manually publish from the tag
   git checkout config@0.3.0
   cd packages/config
   npm publish
   ```

## 🔐 Security

### Required Secrets

The workflow requires these GitHub secrets:

- `NPM_ACCESS_TOKEN` - npm token with publish permissions
- `GITHUB_TOKEN` - Automatically provided by GitHub

### Permissions

The workflow needs:

- `contents: write` - To create branches and tags
- `pull-requests: write` - To create/update PRs
- `id-token: write` - For npm provenance

## 📊 Monitoring

### Check Release Status

1. **GitHub Actions tab** - See workflow runs
2. **Pull Requests tab** - Find Release PRs (labeled `release`)
3. **npm** - Verify published packages

### Notifications

You'll be notified when:

- ✅ Release PR is created
- ✅ CI passes/fails on Release PR
- ✅ Packages are published

## 🎓 Best Practices

### Commit Messages

✅ **Good:**
```bash
feat(config): add TypeScript config loading
fix(cli): resolve memory leak in conversation mode
docs(readme): update installation instructions
```

❌ **Bad:**
```bash
update stuff
fixed bug
WIP
```

### Changelog Editing

When editing CHANGELOGs in the Release PR:

✅ **Do:**
- Add context and links
- Fix typos and grammar
- Group related changes
- Add migration guides for breaking changes

❌ **Don't:**
- Remove entries (unless truly not needed)
- Change version numbers without updating `package.json`
- Add unrelated changes

### Release Timing

**Recommended:**
- Batch related changes into one release
- Release during business hours
- Check npm after publishing

**Avoid:**
- Releasing on Fridays (harder to fix issues)
- Multiple releases per day (unless urgent)
- Releasing without review

## 🔗 Related Documentation

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Nx Release](https://nx.dev/features/manage-releases)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions](https://docs.github.com/en/actions)

## 📝 Workflow Configuration

The workflow is defined in `.github/workflows/release-pr.yml`.

Key configuration in `nx.json`:

```json
{
  "release": {
    "projectsRelationship": "independent",
    "releaseTagPattern": "{projectName}@{version}",
    "version": {
      "conventionalCommits": true
    }
  }
}
```

## 🆘 Getting Help

If you encounter issues:

1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Check the [Troubleshooting](#troubleshooting) section
4. Ask in team chat or create an issue

---

**Last Updated:** 2025-10-05
**Workflow Version:** 1.0
