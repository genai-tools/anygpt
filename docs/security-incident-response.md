# Security Incident: Lessons Learned

**Date**: 2025-10-08  
**Incident**: Accidental exposure of Sourcegraph token and internal URLs in git history

## What Happened

1. **Hardcoded Token**: A Sourcegraph access token (`sgp_981819e57d6acf39_...`) was committed in `packages/connectors/cody/examples/test-models-api.mjs`
2. **Internal URLs**: Multiple references to internal company URLs were committed in documentation and examples
3. **Git History**: Sensitive data persisted in commit history even after fixing current files
4. **PR Exposure**: Pull requests contained the sensitive data, requiring repository deletion

## Response Actions Taken

### Immediate (Day 1)
1. ✅ Revoked the exposed Sourcegraph token
2. ✅ Sanitized all current files (replaced with generic examples)
3. ✅ Rewrote git history using `git-filter-repo`
4. ✅ Force-pushed sanitized history to GitHub
5. ✅ Deleted and recreated repository (due to PR exposure)

### Prevention Measures (Day 1)
1. ✅ Created comprehensive security documentation (`SECURITY.md`)
2. ✅ Added mandatory security pre-check to release workflow
3. ✅ Created security-check workflow with automated scans
4. ✅ Set up GitHub Actions security scanning (Gitleaks)
5. ✅ Expanded `.gitignore` to block sensitive files
6. ✅ Added `.gitleaksignore` for proper secret scanning
7. ✅ Created pre-commit hook template
8. ✅ Updated README with security guidelines

## Safeguards Now in Place

### 1. Pre-Commit Protection
**File**: `.windsurf/workflows/security-check.md`
- Scans for hardcoded secrets (tokens, API keys)
- Detects internal company URLs
- Checks example files for real credentials
- Verifies gitignore protection

### 2. Release Workflow Enhancement
**File**: `.windsurf/workflows/release.md`
- **Step 0**: Mandatory security pre-check before any commit
- Auto-turbo enabled for fast execution
- Blocks release if secrets or internal URLs detected

### 3. CI/CD Scanning
**File**: `.github/workflows/security-scan.yml`
- Gitleaks integration for secret detection
- Custom URL scanning for internal domains
- Example file validation
- Runs on every push and PR

### 4. Git Ignore Expansion
**File**: `.gitignore`
```gitignore
# Sensitive configuration files (NEVER commit these)
**/config.json
**/credentials.json
**/.credentials
**/secrets.json
**/*.secret.*
**/*.credentials.*
```

### 5. Pre-Commit Hook Template
**Location**: `SECURITY.md`
- Automatically scans staged changes
- Blocks commits with secrets
- Warns about internal URLs
- Easy to install locally

## Lessons Learned

### What Went Wrong
1. **No automated scanning** - Relied on manual review
2. **Example files had real credentials** - Should use placeholders
3. **No pre-commit hooks** - Nothing stopped the commit
4. **Internal URLs in docs** - Should use generic examples
5. **No security checklist** - Easy to forget checks

### What Worked Well
1. **Quick detection** - Found the issue before major damage
2. **Immediate revocation** - Token disabled quickly
3. **Comprehensive cleanup** - Git history fully sanitized
4. **Repository reset** - Clean slate with new repo

### Key Takeaways
1. **Prevention > Cleanup** - Automated checks prevent incidents
2. **Multiple layers** - Defense in depth (pre-commit, CI/CD, manual)
3. **Documentation matters** - Clear guidelines prevent mistakes
4. **Examples are dangerous** - Always use placeholders
5. **Git history is permanent** - Can't just delete a file

## Security Principles Established

### 1. Never Commit Secrets
- Use environment variables: `process.env.TOKEN_NAME`
- Use placeholders: `'sgp_your-token-here'`
- Never hardcode real credentials

### 2. Use Generic Examples
- ✅ `sourcegraph.example.com`
- ❌ `sourcegraph.internal-company.com`

### 3. Automate Security Checks
- Pre-commit hooks
- CI/CD scanning
- Release workflow checks

### 4. Defense in Depth
- Multiple scanning layers
- Manual review as backup
- Clear documentation

### 5. Fail Secure
- Block commits with secrets
- Stop release on detection
- Require manual override

## Checklist for Future Incidents

If this happens again:

- [ ] **Immediately revoke** the exposed credential
- [ ] **Do not push** if not already pushed
- [ ] **Sanitize current files** (replace with placeholders)
- [ ] **Rewrite git history** (use `git-filter-repo`)
- [ ] **Check PRs** for exposure
- [ ] **Force push** or delete/recreate repo
- [ ] **Notify security team** if applicable
- [ ] **Update documentation** with lessons learned
- [ ] **Review prevention measures** - what failed?

## Tools Used

1. **git-filter-repo** - History rewriting
2. **Gitleaks** - Secret scanning
3. **grep/regex** - Pattern matching
4. **Git hooks** - Pre-commit validation
5. **GitHub Actions** - CI/CD scanning

## References

- [SECURITY.md](../SECURITY.md) - Security policy
- [security-check.md](../.windsurf/workflows/security-check.md) - Security workflow
- [release.md](../.windsurf/workflows/release.md) - Release workflow
- [Gitleaks](https://github.com/gitleaks/gitleaks) - Secret scanning tool
- [git-filter-repo](https://github.com/newren/git-filter-repo) - History rewriting

## Status

✅ **RESOLVED** - All safeguards in place, repository clean, incident documented.

---

**Last Updated**: 2025-10-08  
**Next Review**: Before next major release
