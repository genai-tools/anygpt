# Release Quick Reference

Quick reference for the AnyGPT automated release workflow.

## 🚀 Quick Start

```bash
# 1. Make changes and commit with conventional format
git commit -m "feat(config): add awesome feature"
git push

# 2. Run release command
npm run release

# 3. Wait for CI to pass
# → PR auto-merges and publishes to npm! 🚀
```

## 📝 Commit Format

```bash
# Feature (minor bump: 0.2.2 → 0.3.0)
git commit -m "feat(package): description"

# Bug fix (patch bump: 0.2.2 → 0.2.3)
git commit -m "fix(package): description"

# Breaking change (major bump: 0.2.2 → 1.0.0)
git commit -m "feat(package)!: description

BREAKING CHANGE: details"

# No version bump
git commit -m "docs(package): description"
git commit -m "chore(package): description"
```

## 🔄 Workflow Steps

| Step | What Happens | Your Action |
|------|--------------|-------------|
| 1. Commit | Make changes with conventional commits | `git commit -m "feat: ..."` |
| 2. Release | Run release command | `npm run release` |
| 3. AI | Generates PR summary | Automatic |
| 4. CI | Runs checks on PR | Wait for ✅ |
| 5. Auto-merge | Merges & publishes to npm | Automatic |

## 🎛️ Common Tasks

### Batch Multiple Changes

```bash
git commit -m "feat(config): feature A"
git commit -m "feat(cli): feature B"
git push

# Run release once
npm run release

# Both changes in one release
```

### Update Existing Release PR

```bash
git commit -m "fix(cli): additional fix"
git push

# Run release again
npm run release

# Existing PR is updated
```

### Emergency Fix

```bash
git commit -m "fix(config): critical bug"
git push
npm run release
# Auto-merges when CI passes (2-3 min)
```

## 🔍 Check Status

- **Release PRs:** Look for label `release`
- **Workflow runs:** GitHub Actions tab
- **Published packages:** Check npm

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| No Release PR created | Check if commit is `feat:` or `fix:` |
| CI fails | Fix errors, push to `release-next` branch |
| Wrong version | Edit `package.json` in `release-next` |
| Publish failed | Check workflow logs, retry manually if needed |

## 📦 Version Bumps

| Change | Bump Type | Example |
|--------|-----------|---------|
| New feature | minor | 0.2.2 → 0.3.0 |
| Bug fix | patch | 0.2.2 → 0.2.3 |
| Breaking change | major | 0.2.2 → 1.0.0 |
| Dependency update | patch | 0.2.2 → 0.2.3 |
| Docs/chore | none | 0.2.2 → 0.2.2 |

## 🔗 Links

- [Full Documentation](./release-workflow.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Nx Release](https://nx.dev/features/manage-releases)

---

**Need help?** Check [release-workflow.md](./release-workflow.md) for detailed documentation.
