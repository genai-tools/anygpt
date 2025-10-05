# Release Quick Reference

Quick reference for the AnyGPT release workflow.

## 🚀 Quick Start

```bash
# 1. Make changes and commit with conventional format
git commit -m "feat(config): add awesome feature"
git push

# 2. Bot creates Release PR automatically
# → Go to GitHub and review

# 3. Merge the PR
# → Automatic publish to npm! 🚀
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
| 1. Push | CI runs (lint, test, build) | Wait for ✅ |
| 2. Bot | Creates Release PR | Review PR |
| 3. Review | Check versions & CHANGELOGs | Edit if needed |
| 4. CI | Runs on Release PR | Wait for ✅ |
| 5. Merge | Publishes to npm | Click merge |

## 🎛️ Common Tasks

### Batch Multiple Changes

```bash
git commit -m "feat(config): feature A"
git push

git commit -m "feat(cli): feature B"
git push

# Bot updates the same Release PR
```

### Edit Changelog

```bash
git fetch origin release-next
git checkout release-next
vim packages/config/CHANGELOG.md
git commit -am "docs: improve changelog"
git push origin release-next
```

### Cancel Release

1. Close the Release PR
2. Don't merge
3. No publish happens

### Emergency Fix

```bash
git commit -m "fix(config): critical bug"
git push
# Review Release PR quickly
# Merge immediately
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
