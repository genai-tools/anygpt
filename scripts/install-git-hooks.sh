#!/bin/bash
# Install git hooks for security protection
# Run this after cloning the repository

set -e

echo "🔒 Installing security git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook to prevent secrets and internal URLs from being committed
# This runs BEFORE the commit is created - preventing damage before it happens

set -e

echo "🔒 Running security checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Check 1: Scan for hardcoded secrets
echo "  🔍 Checking for hardcoded secrets..."
if git diff --cached | grep -qE "(sgp_[a-zA-Z0-9]{40,}|sk-[a-zA-Z0-9]{40,}|ghp_[a-zA-Z0-9]{36,}|Bearer [a-zA-Z0-9]{20,})"; then
  echo -e "${RED}❌ ERROR: Hardcoded secrets detected!${NC}"
  echo ""
  echo "Found potential secrets in staged changes:"
  git diff --cached | grep -E "(sgp_[a-zA-Z0-9]{40,}|sk-[a-zA-Z0-9]{40,}|ghp_[a-zA-Z0-9]{36,}|Bearer [a-zA-Z0-9]{20,})" | head -5
  echo ""
  echo "Please remove secrets and use environment variables instead:"
  echo "  ✅ GOOD: accessToken: process.env.SRC_ACCESS_TOKEN"
  echo "  ❌ BAD:  accessToken: 'sgp_abc123...'"
  FAILED=1
else
  echo -e "  ${GREEN}✓${NC} No secrets detected"
fi

# Check 2: Scan for internal company URLs (exclude hook scripts and docs)
echo "  🔍 Checking for internal URLs..."
STAGED_FILES=$(git diff --cached --name-only | grep -v -E "(\.git/hooks/|scripts/install-git-hooks|SECURITY\.md|security-.*\.md)" || true)
if [ -n "$STAGED_FILES" ]; then
  if git diff --cached -- $STAGED_FILES | grep -iE "(provider1\.com|sourcegraph\.provider1|gen-ai\.prod|genai-api\.provider1|jfrog\.provider1)" | grep -qv "example\.com"; then
  echo -e "${RED}❌ ERROR: Internal company URLs detected!${NC}"
  echo ""
  echo "Found internal URLs in staged changes:"
  git diff --cached | grep -iE "(provider1\.com|sourcegraph\.provider1|gen-ai\.prod)" | grep -v "example\.com" | head -5
  echo ""
  echo "Please replace with generic examples:"
  echo "  ✅ GOOD: endpoint: 'https://sourcegraph.example.com/'"
  echo "  ❌ BAD:  endpoint: 'https://sourcegraph.company.example/'"
    FAILED=1
  else
    echo -e "  ${GREEN}✓${NC} No internal URLs detected"
  fi
else
  echo -e "  ${GREEN}✓${NC} No files to check for URLs"
fi

# Check 3: Verify no sensitive files are staged
echo "  🔍 Checking for sensitive files..."
SENSITIVE_FILES=$(git diff --cached --name-only | grep -E "(\.env$|\.env\.|config\.json$|credentials\.json$|secrets\.json$|\.anygpt/)" || true)
if [ -n "$SENSITIVE_FILES" ]; then
  echo -e "${RED}❌ ERROR: Sensitive files are staged!${NC}"
  echo ""
  echo "These files should not be committed:"
  echo "$SENSITIVE_FILES"
  echo ""
  echo "Unstage them with: git reset HEAD <file>"
  FAILED=1
else
  echo -e "  ${GREEN}✓${NC} No sensitive files staged"
fi

# Check 4: Scan example files for real credentials
echo "  🔍 Checking example files..."
EXAMPLE_FILES=$(git diff --cached --name-only | grep -E "(examples/|test.*\.(ts|js|mjs)$)" || true)
if [ -n "$EXAMPLE_FILES" ]; then
  for file in $EXAMPLE_FILES; do
    if git diff --cached "$file" | grep -qE "(sgp_[a-zA-Z0-9]{40,}|sk-[a-zA-Z0-9]{40,})"; then
      echo -e "${RED}❌ ERROR: Real credentials in example file: $file${NC}"
      echo ""
      echo "Use placeholders or environment variables in examples:"
      echo "  ✅ GOOD: accessToken: process.env.SRC_ACCESS_TOKEN || 'sgp_your-token-here'"
      echo "  ❌ BAD:  accessToken: 'sgp_abc123...'"
      FAILED=1
    fi
  done
  if [ $FAILED -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Example files are clean"
  fi
else
  echo -e "  ${GREEN}✓${NC} No example files modified"
fi

echo ""

# Final result
if [ $FAILED -eq 1 ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ COMMIT BLOCKED - Security issues detected${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Fix the issues above and try again."
  echo "See SECURITY.md for guidelines."
  exit 1
else
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ Security checks passed - commit allowed${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 0
fi
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed successfully!"
echo ""
echo "The hook will automatically:"
echo "  • Scan for hardcoded secrets"
echo "  • Detect internal company URLs"
echo "  • Check for sensitive files"
echo "  • Validate example files"
echo ""
echo "It will BLOCK commits if security issues are found."
echo "See SECURITY.md for more information."
