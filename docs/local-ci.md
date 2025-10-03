# Local CI Testing

This document explains how to run CI tests locally before pushing to GitHub.

## 🎯 Recommended: nektos/act

[nektos/act](https://nektosact.com/) runs your **actual GitHub Actions workflow** locally in Docker containers, providing the exact same environment as GitHub Actions.

### Setup

```bash
# One-time setup
./scripts/setup-act.sh

# Verify installation
./bin/act --version
```

### Usage

```bash
# Run full CI workflow (recommended)
./scripts/ci-act.sh

# See what would run without executing
./scripts/ci-act.sh --dryrun

# List available workflows
./scripts/ci-act.sh --list

# Get help
./scripts/ci-act.sh --help
```

### Benefits of `act`

- ✅ **Exact CI environment** - Same Ubuntu container as GitHub Actions
- ✅ **Real workflow execution** - Runs actual `.github/workflows/ci.yml`
- ✅ **Dependency isolation** - Clean Docker environment each time
- ✅ **No environment differences** - Eliminates "works on my machine" issues

## 🔧 Alternative: Local Script (Deprecated)

For quick local testing without Docker:

```bash
# Basic local simulation (may have environment differences)
./scripts/ci-local.sh
```

**Note**: The local script may have different behavior than the actual CI environment. Use `act` for accurate testing.

## 🐳 Docker Compose Alternative

For containerized testing without GitHub Actions workflow:

```bash
# Run CI in Docker container
docker-compose -f docker-compose.ci.yml up
```

## 📊 Current CI Status

The CI pipeline validates:

1. **Dependencies** - `npm install --legacy-peer-deps --no-package-lock`
2. **NX Workspace** - `npx nx show projects`
3. **TypeScript** - `npx tsc --noEmit --project tsconfig.base.json`
4. **Full NX Tasks** - `npx nx run-many -t test build typecheck` (with continue-on-error)

## 🚀 Quick Start

```bash
# 1. Setup act (one-time)
./scripts/setup-act.sh

# 2. Run CI locally
./scripts/ci-act.sh

# 3. Fix any issues and re-run
./scripts/ci-act.sh
```

This ensures your changes will pass CI before pushing to GitHub!
