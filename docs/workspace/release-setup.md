# Release Setup Documentation

This document describes the release infrastructure configuration for publishing AnyGPT packages to npm.

## 📦 Overview

The release infrastructure enables automated publishing of 7 packages to npm via CI/CD:

- `@anygpt/types` - TypeScript type definitions
- `@anygpt/router` - Core routing engine
- `@anygpt/config` - Configuration management
- `@anygpt/openai` - OpenAI connector
- `@anygpt/mock` - Mock connector for testing
- `@anygpt/cli` - Command-line interface
- `@anygpt/mcp` - Model Context Protocol server

## 🏗️ Infrastructure Components

### 1. Nx Release Configuration (`nx.json`)

**Location**: `/nx.json`

**Configuration**:
```json
{
  "targetDefaults": {
    "nx-release-publish": {
      "dependsOn": ["build", "lint"]
    }
  },
  "release": {
    "projectsRelationship": "independent",
    "projects": [
      "packages/*",
      "packages/connectors/*",
      "!packages/cli/node_modules/**"
    ],
    "releaseTagPattern": "{projectName}@{version}",
    "changelog": {
      "workspaceChangelog": {
        "createRelease": "github",
        "file": false
      },
      "projectChangelogs": {
        "createRelease": "github",
        "file": "{projectRoot}/CHANGELOG.md"
      }
    },
    "version": {
      "conventionalCommits": true
    }
  }
}
```

**Features**:
- **Independent versioning**: Each package versions independently
- **Conventional commits**: Automatic version bump detection
- **GitHub releases**: Automatic release creation with changelogs
- **Automatic validation**: Build and lint run as dependencies of publish (with Nx caching)
- **Tag pattern**: `{projectName}@{version}` (e.g., `@anygpt/cli@0.1.0`)

### 2. Package Metadata

**Location**: All `packages/*/package.json` files

**Added metadata**:
```json
{
  "description": "Package description for npm",
  "repository": {
    "type": "git",
    "url": "https://github.com/genai-tools/anygpt.git",
    "directory": "packages/package-name"
  },
  "keywords": ["ai", "gpt", "..."],
  "author": "AnyGPT Contributors",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/genai-tools/anygpt/issues"
  },
  "homepage": "https://github.com/genai-tools/anygpt#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

**Purpose**:
- Improves npm package discoverability
- Links packages to GitHub repository
- Enables public scoped packages (`@anygpt/*`)

### 3. GitHub Actions Workflow

**Location**: `.github/workflows/release.yml`

**Triggers**:
- **Automatic**: Push to `main` branch
- **Manual**: Workflow dispatch with options

**Workflow steps**:
1. Checkout repository with full git history
2. Setup Node.js with npm registry configuration
3. Configure git for commits
4. Install dependencies
5. Version packages based on conventional commits
6. Publish to npm with provenance (automatically runs build + lint via `nx-release-publish` target)
7. Create GitHub releases with changelogs

**Environment variables**:
- `NPM_ACCESS_TOKEN`: npm authentication (GitHub secret)
- `GITHUB_TOKEN`: GitHub API access (automatic)
- `NPM_CONFIG_PROVENANCE`: Supply chain security

**Manual workflow inputs**:
- `version`: Version bump type or specific version
- `dry_run`: Preview changes without publishing

### 4. Documentation

**Files created**:
- `docs/release-setup.md` - This file (infrastructure documentation)
- `docs/release-guide.md` - Regular release process guide
- Updated `README.md` with release guide link

## 🎯 Design Philosophy

Following the [Nx Release CI/CD guide](https://nx.dev/docs/guides/nx-release/publish-in-ci-cd) and [feature request #32956](https://github.com/nrwl/nx/issues/32956):

### Safe by Default
- **Local commands never publish**: All local `nx release` commands skip publishing
- **CI/CD only publishing**: Packages only published in GitHub Actions
- **Explicit opt-in**: Publishing requires explicit workflow configuration
- **No accidents**: Developers cannot accidentally publish from their machines

### Security
- **npm provenance**: All packages published with provenance for supply chain security
- **Secret management**: NPM_ACCESS_TOKEN stored securely in GitHub secrets
- **Audit trail**: All releases tracked in GitHub Actions logs

### Automation
- **Conventional commits**: Automatic version bump detection
- **Changelog generation**: Automatic changelog creation
- **GitHub releases**: Automatic release creation with notes
- **Dependency updates**: Automatic cross-package dependency version updates

## 🔐 Prerequisites

### Required GitHub Secrets

**`NPM_ACCESS_TOKEN`**:
- **Type**: Automation token (recommended) or Classic token
- **Permissions**: Publish access to `@anygpt` scope
- **Configuration**: Repository Settings → Secrets and variables → Actions

**How to create**:
1. Go to [npmjs.com](https://www.npmjs.com/) → Account → Access Tokens
2. Generate New Token → Automation (or Classic)
3. Grant publish permissions for `@anygpt` scope
4. Copy token and add to GitHub repository secrets

### Repository Configuration

- **Repository URL**: `https://github.com/genai-tools/anygpt`
- **Default branch**: `main`
- **Branch protection**: Recommended for production
- **Actions permissions**: Read and write permissions enabled

## 🧪 Testing the Setup

### Local Testing (No Publishing)

Test version bump calculation:
```bash
# First release
npx nx release version 0.1.0 --first-release --dry-run

# Subsequent releases
npx nx release version --dry-run
npx nx release version patch --dry-run
npx nx release version minor --dry-run
```

### CI Testing

Test the workflow without publishing:
```bash
# Via GitHub CLI
gh workflow run release.yml -f version=0.1.0 -f dry_run=true

# Or via GitHub UI
# Actions → Release → Run workflow → Check "Dry run"
```

## 📊 Version Bump Rules

Based on [Conventional Commits](https://www.conventionalcommits.org/):

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | **patch** (0.0.x) | `fix: resolve timeout issue` |
| `feat:` | **minor** (0.x.0) | `feat: add Anthropic connector` |
| `feat!:` or `BREAKING CHANGE:` | **major** (x.0.0) | `feat!: redesign API` |
| `docs:`, `chore:`, `style:` | **none** | `docs: update README` |

## 🔄 Release Workflow

### First Release

The first release requires special handling because no git tags exist yet:

```bash
# Manual trigger with --first-release equivalent
gh workflow run release.yml -f version=0.1.0
```

This creates:
- Version tags for all packages (e.g., `@anygpt/cli@0.1.0`)
- npm packages published
- GitHub releases created
- Changelogs generated

### Subsequent Releases

After the first release, the process is fully automatic:

1. Developer commits with conventional commit message
2. Developer pushes to `main` branch
3. GitHub Actions automatically:
   - Analyzes commits since last release
   - Determines version bumps
   - Updates package versions
   - Publishes to npm
   - Creates GitHub releases

## 🐛 Troubleshooting

### "No git tags matching pattern" Error

**Cause**: First release without existing tags

**Solution**: Use manual workflow trigger for first release:
```bash
gh workflow run release.yml -f version=0.1.0
```

### Publishing Fails in CI

**Check**:
1. `NPM_ACCESS_TOKEN` is set in GitHub secrets
2. Token has publish permissions for `@anygpt` scope
3. Token is not expired
4. All packages build successfully

**Debug**:
- Review GitHub Actions workflow logs
- Check npm token permissions
- Verify package names use `@anygpt/` prefix

### Version Conflicts

**Cause**: Package versions out of sync

**Solution**: Reset to disk versions:
```bash
npx nx release version --first-release --dry-run
```

## 📚 References

- [Nx Release Documentation](https://nx.dev/docs/guides/nx-release)
- [Nx Release in CI/CD](https://nx.dev/docs/guides/nx-release/publish-in-ci-cd)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Feature Request #32956](https://github.com/nrwl/nx/issues/32956) - Opt-in publishing

## 🔧 Maintenance

### Updating Release Configuration

To modify release behavior, edit:
- `nx.json` - Version bump rules, changelog settings
- `.github/workflows/release.yml` - CI/CD workflow steps
- Package `package.json` files - Metadata and dependencies

### Adding New Packages

New packages are automatically included if they match:
- `packages/*`
- `packages/connectors/*`

Ensure new packages have:
- Proper npm metadata (description, keywords, etc.)
- `publishConfig.access: "public"`
- Correct `@anygpt/` scope

---

**Next steps**: See [Release Guide](./release-guide.md) for regular release process.
