# Release Guide

This guide explains how to release new versions of AnyGPT packages to npm.

> **📖 New to releases?** See [Release Setup Documentation](./release-setup.md) for infrastructure details.

## 🎯 Release Philosophy

Following best practices and our [feature request #32956](https://github.com/nrwl/nx/issues/32956):

- **Local Development**: `nx release` commands **skip publishing by default** (safe)
- **CI/CD Only**: Publishing happens **only in GitHub Actions** with explicit configuration
- **No Accidents**: Developers cannot accidentally publish from their machines

## 📦 Packages

The following packages are published to npm under the `@anygpt` scope:

- `@anygpt/types` - TypeScript type definitions (zero dependencies)
- `@anygpt/router` - Core routing engine
- `@anygpt/config` - Configuration management
- `@anygpt/openai` - OpenAI connector
- `@anygpt/mock` - Mock connector for testing
- `@anygpt/cli` - Command-line interface
- `@anygpt/mcp` - Model Context Protocol server

## 🚀 Release Process

### Prerequisites

1. **NPM Access Token**: Already configured as `NPM_ACCESS_TOKEN` secret in GitHub repository
2. **Clean Working Directory**: Commit all changes before releasing

### Release Workflow (Tag-Based)

The release process is split into two steps:

#### Step 1: Create Version Tags Locally

Use Nx to version packages and create git tags:

```bash
# First release (0.1.0)
npx nx release version 0.1.0 --first-release

# Subsequent releases with conventional commits
npx nx release version

# Or specify version bump
npx nx release version patch   # 0.1.0 → 0.1.1
npx nx release version minor   # 0.1.0 → 0.2.0
npx nx release version major   # 0.1.0 → 1.0.0

# Or specific version
npx nx release version 1.2.3
```

This will:
- ✅ Update package.json versions
- ✅ Update cross-package dependencies
- ✅ Create git tags (e.g., `@anygpt/cli@0.1.0`)
- ✅ Commit changes
- ❌ **NOT publish to npm** (safe!)

#### Step 2: Push Tags and Create GitHub Release

```bash
# Push commits and tags
git push --follow-tags

# Or push tags separately
git push origin main
git push --tags
```

Then on GitHub:

1. Go to **Releases** → **Draft a new release**
2. Click **Choose a tag** → Select your tag (e.g., `@anygpt/cli@0.1.0`)
3. Add release title and description
4. Click **Publish release**

**GitHub Actions will automatically**:
- ✅ Build all packages (via `nx-release-publish` dependency)
- ✅ Lint all packages (via `nx-release-publish` dependency)
- ✅ Publish to npm with provenance
- ✅ All packages with matching version tags get published

### Local Testing (Dry Run)

Test version changes without committing:

```bash
# Preview what would be versioned
npx nx release version 0.1.0 --first-release --dry-run
npx nx release version --dry-run
npx nx release version patch --dry-run
```

**Note**: The `--dry-run` flag shows changes without committing. Publishing **only** happens in CI/CD when you create a GitHub release.

## 📝 Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) to automatically determine version bumps:

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Version Bump Rules

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | **patch** (0.0.x) | `fix: resolve connection timeout` |
| `feat:` | **minor** (0.x.0) | `feat: add new connector` |
| `BREAKING CHANGE:` | **major** (x.0.0) | `feat!: redesign API` |
| `docs:`, `chore:`, `style:` | **none** | `docs: update README` |

### Examples

```bash
# Patch release (0.1.0 → 0.1.1)
git commit -m "fix: handle null responses correctly"

# Minor release (0.1.0 → 0.2.0)
git commit -m "feat: add Anthropic connector"

# Major release (0.1.0 → 1.0.0)
git commit -m "feat!: redesign configuration API

BREAKING CHANGE: Configuration format has changed"
```

## 🔄 Release Workflow Details

The `.github/workflows/release.yml` workflow:

### Trigger

- **GitHub Release Published**: Automatically runs when you publish a release on GitHub

### Steps

1. **Checkout**: Fetch repository at the release tag
2. **Setup Node**: Configure npm registry
3. **Install**: Install dependencies
4. **Publish**: Publish to npm with provenance
   - Automatically runs `build` for each package (via `nx-release-publish` dependency)
   - Automatically runs `lint` for each package (via `nx-release-publish` dependency)
   - Publishes all packages matching the release tag

### Environment Variables

- `NPM_ACCESS_TOKEN`: npm authentication (configured in GitHub secrets)
- `NPM_CONFIG_PROVENANCE`: Enable npm provenance for supply chain security

## 📋 First Release Checklist

For the **initial 0.1.0 release**:

- [ ] Verify `NPM_ACCESS_TOKEN` secret is configured in GitHub
- [ ] Ensure all packages build successfully locally
- [ ] Run `npx nx release version 0.1.0 --first-release`
- [ ] Review the version changes and git tags created
- [ ] Push commits and tags: `git push --follow-tags`
- [ ] Go to GitHub → Releases → Draft a new release
- [ ] Select the tag (e.g., `@anygpt/cli@0.1.0`)
- [ ] Publish the release
- [ ] Verify packages published to npm

> **💡 Tip**: After the first release, you can use `npx nx release version` to auto-detect version bumps from conventional commits!

## 🔍 Troubleshooting

### "No git tags matching pattern" Error

**First release only**: Use `--first-release` flag:

```bash
npx nx release version 0.1.0 --first-release --dry-run
```

After the first release, tags will exist and this flag is not needed.

### Publishing Fails in CI

1. **Check NPM_ACCESS_TOKEN**: Verify secret is set in GitHub repository settings
2. **Token Permissions**: Ensure token has publish access to `@anygpt` scope
3. **Package Names**: Verify all packages use `@anygpt/` prefix
4. **Build Errors**: Check that all packages build successfully

### Version Conflicts

If versions get out of sync:

```bash
# Reset to disk versions and try again
npx nx release version --first-release --dry-run
```

## 📚 Additional Resources

- **[Release Setup Documentation](./release-setup.md)** - Infrastructure and configuration details
- [Nx Release Documentation](https://nx.dev/docs/guides/nx-release)
- [Nx Release in CI/CD](https://nx.dev/docs/guides/nx-release/publish-in-ci-cd)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)

## 🎓 Best Practices

1. **Always use conventional commits** for automatic versioning
2. **Test locally with --dry-run** before pushing
3. **Let CI/CD handle publishing** - never publish manually
4. **Review changelogs** after release
5. **Tag releases** with meaningful descriptions
6. **Monitor npm** for successful publishes

## 🔐 Security

- **Provenance**: All packages published with npm provenance for supply chain security
- **Secrets**: NPM_ACCESS_TOKEN stored securely in GitHub secrets
- **No Local Publishing**: Enforced by workflow design

---

**Ready to release?** Push your changes to `main` and let the automation handle the rest! 🚀
