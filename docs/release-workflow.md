# Release Workflow

This document describes the automated release workflow for AnyGPT packages.

## 🎯 Overview

We use a **fully automated release workflow** with AI-powered PR summaries:

1. Developer runs `npm run release` on `main` branch
2. Script detects changes, bumps versions, creates tags
3. **AI generates intelligent PR summary** analyzing changelog + code diff
4. PR is created with **auto-merge enabled**
5. CI validates the changes
6. PR **auto-merges** when CI passes
7. Packages are published to npm automatically
8. `main` branch syncs with `production`

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Developer: npm run release                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Nx Release:                                                  │
│ - Detects changes (conventional commits)                     │
│ - Bumps versions                                             │
│ - Updates CHANGELOGs                                         │
│ - Creates git tags                                           │
│ - Pushes to main                                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ AI Summary Generation:                                       │
│ - Analyzes changelog                                         │
│ - Reviews code diff                                          │
│ - Generates intelligent PR summary                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Create Release PR (main → production)                        │
│ - Title: "Release cli v0.12.0"                              │
│ - 🤖 AI-generated summary                                    │
│ - 📋 Full changelog                                          │
│ - ✅ Auto-merge enabled                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ CI Checks (on PR):                                           │
│ - Lint, test, build, typecheck                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼ Fail              ▼ Pass
    ┌───────┐         ┌──────────────────────────────────────┐
    │ Fix   │         │ Auto-Merge to production             │
    │ & Push│         └─────────┬────────────────────────────┘
    └───────┘                   │
                                ▼
                      ┌──────────────────────────────────────┐
                      │ Publish Workflow:                    │
                      │ - Publishes to npm                   │
                      │ - Syncs main with production         │
                      └──────────────────────────────────────┘
```

## 📋 How It Works

### Step 1: Make Changes

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

### Step 2: Run Release Command

```bash
npm run release
```

This command:

1. **Validates environment**:
   - Checks you're on `main` branch
   - Ensures no uncommitted changes
   - Pulls latest from origin

2. **Runs Nx Release**:
   - Detects changes via conventional commits
   - Bumps package versions
   - Updates `CHANGELOG.md` files
   - Creates git tags
   - Commits and pushes to `main`

3. **Generates AI Summary**:
   - Analyzes changelog entries
   - Reviews code diff (up to 5000 chars)
   - Uses your `anygpt` CLI to generate intelligent summary
   - Highlights key changes and reviewer notes

4. **Creates Release PR**:
   - Title: "Release cli v0.12.0" (shows actual packages)
   - 🤖 AI-generated summary section
   - 📋 Full changelog
   - ✅ Auto-merge enabled

### Step 3: Automatic CI Validation

GitHub Actions automatically runs on the PR:
- ✅ Code formatting check
- ✅ Linting
- ✅ Unit tests
- ✅ Build
- ✅ Type checking

**If CI fails**, fix the issues and push to `main`, then run `npm run release` again.

### Step 4: Review the Release PR (Optional)

The PR includes:

1. **AI Summary** 🤖
   - Overview of what's being released
   - Key highlights from changelog
   - Notable code changes
   - Important notes for reviewers

2. **Full Changelog** 📋
   - All version bumps
   - Detailed change entries
   - Contributor credits

3. **CI Status**
   - All checks must pass before auto-merge

**The PR will auto-merge when CI passes** - no manual action needed!

### Step 5: Automatic Merge & Publish

When CI passes:

1. **Auto-merge** merges PR to `production`
2. **Publish workflow** triggers:
   - ✅ Publishes packages to npm
   - ✅ Syncs `main` branch with `production`
3. **Done!** Packages are live on npm

## 🎛️ Advanced Usage

### Batching Multiple Changes

Make multiple commits before running release:

```bash
# Make multiple changes
git commit -m "feat(config): add feature A"
git commit -m "feat(cli): add feature B"
git push

# Run release once
npm run release

# Both changes will be in one release
```

### Updating an Existing Release PR

If a release PR already exists:

```bash
# Make more changes
git commit -m "fix(cli): critical bug"
git push

# Run release again
npm run release

# The existing PR will be updated (auto-merge NOT re-enabled for safety)
```

### Emergency Fixes

For urgent fixes:

1. Make the fix and push to `main`
2. Run `npm run release`
3. CI will validate
4. Auto-merge when CI passes

Typically takes 2-3 minutes from release command to npm publish.

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

### "No changes detected"

**Possible causes:**

1. **No releasable changes**
   - Only `docs:`, `chore:`, `style:` commits
   - Solution: Add `feat:` or `fix:` commit

2. **Already released**
   - Changes were already released
   - Solution: Make new changes

3. **No conventional commits**
   - Commits don't follow format
   - Solution: Use `feat:`, `fix:`, etc.

### Auto-merge Not Working

**Check:**

1. **Branch protection configured?**
   - Required: `ci-checks` status check
   - Settings → Branches → production

2. **Auto-merge enabled for repo?**
   - Settings → General → Pull Requests → Allow auto-merge

3. **CI passing?**
   - Check PR status
   - Fix any failing tests

### CI Fails on Release PR

**Steps to fix:**

1. Check the CI logs in the PR
2. Fix the issues locally on `main`
3. Push to `main`
4. Run `npm run release` again

### Wrong Version Bump

**To fix:**

1. The version is determined by conventional commits
2. Check your commit messages
3. If needed, manually edit `package.json` and `CHANGELOG.md` on `main`
4. Run `npm run release` again

### Publish Failed

**Recovery:**

1. Check the workflow logs
2. If npm publish failed, you can retry:
   ```bash
   # Manually publish from the tag
   git checkout cli@0.12.0
   cd packages/cli
   npm publish
   ```

### AI Summary Generation Failed

**Not critical** - release continues without AI summary:

1. Check if `anygpt` CLI is working: `npx anygpt chat "test"`
2. Verify API credentials are configured
3. The release will still work, just without the AI summary section

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

## 🤖 AI-Powered Features

### Intelligent PR Summaries

The release script uses your own `anygpt` CLI to generate smart summaries:

**Input:**
- Changelog entries
- Code diff (up to 5000 characters)
- Package names and versions

**Output:**
- Overview of what's being released
- Key highlights and features
- Notable code changes
- Important notes for reviewers

**Clean Output:**
The `--usage` flag is NOT used, so token statistics don't clutter the PR description.

### Configuration

AI summary generation requires:
- `anygpt` CLI configured with API credentials
- See `.anygpt/anygpt.config.ts` for configuration

---

**Last Updated:** 2025-10-06
**Workflow Version:** 2.0 (AI-Powered)
