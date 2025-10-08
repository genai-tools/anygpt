# Security Policy

## 🔒 Security Best Practices

This project handles sensitive credentials and API keys. Follow these guidelines to prevent security incidents.

### ⚠️ NEVER Commit These

**Absolutely forbidden in git:**
- API keys, tokens, passwords
- Internal company URLs (use `example.com` instead)
- Real credentials in example files
- Configuration files with secrets (`.anygpt/`, `.env`, etc.)

### ✅ Safe Practices

1. **Use Environment Variables**
   ```typescript
   // ✅ GOOD
   accessToken: process.env.SRC_ACCESS_TOKEN
   
   // ❌ BAD
   accessToken: 'sgp_abc123...'
   ```

2. **Use Generic Examples**
   ```typescript
   // ✅ GOOD
   endpoint: 'https://sourcegraph.example.com/'
   
   // ❌ BAD
   endpoint: 'https://sourcegraph.company.example/'
   ```

3. **Check Before Committing**
   - Run `.windsurf/workflows/security-check.md` before every commit
   - Review `git diff --cached` for sensitive data
   - Use the pre-commit hook (see below)

### 🛡️ Automated Protection

#### Pre-Commit Hook (Husky)

✅ **Automatically installed with `npm install`** via Husky.

**Location**: `.husky/pre-commit` (version-controlled and transparent)

The hook scans for secrets BEFORE they reach GitHub:
- Hardcoded tokens (sgp_, sk-, ghp_)
- Internal company URLs
- Sensitive files (.env, config.json, etc.)

**No manual installation needed** - Husky sets it up automatically!

#### Why No GitHub Actions?

**We deliberately don't use GitHub Actions for security scanning** because:
- ❌ Damage is already done once code reaches GitHub
- ❌ Secrets are exposed in git history
- ❌ PRs contain the sensitive data
- ✅ Pre-commit hooks catch issues BEFORE they leave your machine

**Prevention at the source is the only real protection.**

### 🚨 If You Accidentally Commit Secrets

**DO THIS IMMEDIATELY:**

1. **Revoke the exposed credential** (API key, token, etc.)
2. **DO NOT PUSH** if you haven't already
3. **Remove from history:**
   ```bash
   # If not pushed yet
   git reset --soft HEAD~1
   
   # If already pushed - requires force push
   git filter-repo --replace-text <(echo "SECRET_VALUE==>REDACTED")
   git push --force
   ```
4. **Notify your security team** if applicable

### 📋 Security Checklist

Before every release:

- [ ] Run security scan: `.windsurf/workflows/security-check.md`
- [ ] Verify no `.anygpt/` files are staged
- [ ] Check examples use `process.env` or placeholders
- [ ] Confirm no internal URLs in code
- [ ] Review `git diff --cached` manually

### 🔍 Files Protected by .gitignore

These are automatically ignored:
- `.anygpt/` - Personal configuration with real credentials
- `.env*` - Environment variable files
- `**/config.json` - Configuration files
- `**/credentials.json` - Credential files
- `**/*.secret.*` - Any file with `.secret.` in name

### 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainers directly
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 🎯 Security Principles

1. **Defense in Depth**: Multiple layers of protection
2. **Fail Secure**: Block commits with secrets by default
3. **Least Privilege**: Minimize credential exposure
4. **Audit Trail**: All security checks logged in CI/CD

---

**Remember**: It's easier to prevent a leak than to clean up after one!
