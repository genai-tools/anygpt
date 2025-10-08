---
description: Security check before committing code
---

# Security Pre-Commit Checklist

**CRITICAL**: Run this checklist BEFORE every commit, especially before releases.

## Step 1 · Scan for Hardcoded Secrets

// turbo
```bash
# Search for common secret patterns
git diff --cached | grep -E "(sgp_[a-zA-Z0-9]{40,}|sk-[a-zA-Z0-9]{40,}|ghp_[a-zA-Z0-9]{36,}|Bearer [a-zA-Z0-9]{20,})"
```

**Expected**: No output (exit code 1 = no matches = GOOD)
**If matches found**: STOP! Remove hardcoded secrets before committing.

## Step 2 · Scan for Internal URLs

// turbo
```bash
# Search for internal company URLs
git diff --cached | grep -iE "(provider1\.com|sourcegraph\.provider1|gen-ai\.prod|genai-api\.provider1|jfrog\.provider1)" | grep -v "example\.com"
```

**Expected**: No output (exit code 1 = no matches = GOOD)
**If matches found**: Replace with generic examples (e.g., `example.com`)

## Step 3 · Verify Gitignore Protection

// turbo
```bash
# Check that sensitive directories are ignored
git check-ignore .anygpt/ .env .env.local
```

**Expected**: All paths should be ignored
**If not ignored**: Update `.gitignore` immediately

## Step 4 · Check for Accidentally Staged Sensitive Files

// turbo
```bash
# List all staged files
git diff --cached --name-only | grep -E "(\.env|\.anygpt|config\.json|credentials|secrets)"
```

**Expected**: No output (exit code 1 = no matches = GOOD)
**If matches found**: Unstage with `git reset HEAD <file>`

## Step 5 · Scan Examples and Test Files

// turbo
```bash
# Check example files for real credentials
grep -r "sgp_[a-zA-Z0-9]\{40,\}\|sk-[a-zA-Z0-9]\{40,\}" packages/*/examples/ packages/*/test* 2>/dev/null || echo "✓ No hardcoded tokens in examples"
```

**Expected**: "✓ No hardcoded tokens in examples"
**If tokens found**: Replace with `process.env.TOKEN_NAME || 'placeholder'`

## Emergency Response

If you accidentally committed sensitive data:

1. **DO NOT PUSH** to remote
2. **Revoke the exposed credential** immediately
3. **Amend or reset the commit**:
   ```bash
   git reset --soft HEAD~1  # Undo last commit, keep changes
   # Or
   git commit --amend       # Fix the current commit
   ```
4. If already pushed: Follow git history rewrite procedure

## Automation Setup (Optional)

Install git hooks to run these checks automatically:

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔒 Running security checks..."

# Check for secrets
if git diff --cached | grep -qE "(sgp_[a-zA-Z0-9]{40,}|sk-[a-zA-Z0-9]{40,})"; then
  echo "❌ ERROR: Hardcoded secrets detected!"
  echo "Please remove secrets before committing."
  exit 1
fi

# Check for internal URLs
if git diff --cached | grep -qiE "provider1\.com" | grep -qv "example\.com"; then
  echo "⚠️  WARNING: Internal URLs detected!"
  echo "Consider using generic examples instead."
  exit 1
fi

echo "✅ Security checks passed"
EOF

chmod +x .git/hooks/pre-commit
```
