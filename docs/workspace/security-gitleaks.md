# Gitleaks Security Scanning

## Overview

This repository uses [Gitleaks](https://github.com/gitleaks/gitleaks) to automatically scan for secrets and credentials in all branches.

## How It Works

### GitHub Actions Workflow

**File**: `.github/workflows/gitleaks.yml`

The workflow runs on:

- Every push to any branch (`**`)
- Every pull request to any branch

**Why both triggers?**

- `push` - Scans internal branches when you push
- `pull_request` - Scans external fork contributions (forks can't trigger push events)

**Smart deduplication:** The workflow includes a condition to skip internal PRs (already scanned on push) and only run for external forks:

```yaml
if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name != github.repository
```

This prevents duplicate runs while ensuring external contributions are always scanned.

**What it scans for:**

- API keys (OpenAI, Anthropic, AWS, etc.)
- Access tokens (GitHub, GitLab, etc.)
- Private keys and certificates
- Database credentials
- OAuth secrets
- Any hardcoded passwords

### Configuration

**File**: `.gitleaksignore` (root directory)

This file whitelists safe placeholder tokens used in documentation and examples:

- `sgp_your-token-here` - Sourcegraph placeholder
- `sk-litellm-master-key` - LiteLLM example key
- `sk-dev-key` - Development placeholder
- `sk-ant-...` - Anthropic documentation example

## Whitelisting Safe Tokens

If you have legitimate placeholder tokens in documentation, add them to `.gitleaksignore`:

```
# Safe placeholder in examples
examples/my-example.ts:sk-example-key-placeholder
```

**Format:**

- `path/to/file:token-to-whitelist` - Whitelist in specific file
- `token-to-whitelist` - Whitelist globally (use sparingly)
- `directory/**/*:token` - Whitelist in all files under directory

## What Happens When Secrets Are Detected

1. **GitHub Actions fails** - The workflow will fail with an error
2. **PR is blocked** - Pull requests cannot be merged
3. **Summary is generated** - Gitleaks provides details about what was found
4. **Action required** - You must remove the secret and follow incident response

## Incident Response

If gitleaks detects a secret:

1. **DO NOT ignore it** - Even if you think it's a false positive
2. **Revoke the credential immediately** - Assume it's compromised
3. **Remove from git history** - Use `git filter-repo` or similar
4. **Add to `.gitleaksignore`** if it's a safe placeholder
5. **Follow the full incident response** - See [security-incident-response.md](./security-incident-response.md)

## Testing Locally

You can run gitleaks locally before pushing:

```bash
# Install gitleaks (macOS)
brew install gitleaks

# Install gitleaks (Linux)
# Download from https://github.com/gitleaks/gitleaks/releases

# Scan the repository
gitleaks detect --source . --verbose

# Scan with ignore file
gitleaks detect --source . --config .gitleaksignore --verbose
```

## False Positives

If gitleaks flags a false positive:

1. **Verify it's actually safe** - Double-check it's not a real secret
2. **Add to `.gitleaksignore`** with a comment explaining why
3. **Use specific paths** - Don't whitelist globally unless necessary
4. **Document in this file** - Add a note below for team awareness

### Known False Positives

- `sgp_your-token-here` - Documentation placeholder for Sourcegraph
- `sk-litellm-master-key` - Example key in LiteLLM integration docs
- `sgp_981819e57d6acf39_` - Redacted token in incident response documentation

## Integration with Pre-Commit Hooks

Gitleaks in GitHub Actions is a **safety net**. The primary defense is:

1. **Pre-commit hooks** (`.husky/pre-commit`) - Catch secrets before they leave your machine
2. **Gitleaks in CI** - Catch anything that slips through
3. **Manual review** - Always review your changes before committing

See [SECURITY.md](../SECURITY.md) for complete security guidelines.

## Maintenance

### Updating Gitleaks Version

The workflow uses `gitleaks/gitleaks-action@v2.3.9` (latest as of 2025-10-09). To update:

1. Check [releases](https://github.com/gitleaks/gitleaks-action/releases)
2. Update the version in `.github/workflows/gitleaks.yml` to the latest release
3. Test with a PR to ensure it works

**Note:** Always use specific version tags (e.g., `v2.3.9`) rather than major version tags (e.g., `v2`) for reproducible builds.

### Adding New Patterns

Gitleaks uses built-in patterns for common secrets. To add custom patterns, create a `.gitleaks.toml` configuration file in the root directory.

Example:

```toml
[extend]
useDefault = true

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''CUSTOM_KEY_[A-Za-z0-9]{32}'''
```

## Resources

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Gitleaks Action](https://github.com/gitleaks/gitleaks-action)
- [Security Policy](../SECURITY.md)
- [Security Incident Response](./security-incident-response.md)

---

**Last Updated**: 2025-10-09
