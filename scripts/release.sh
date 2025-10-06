#!/bin/bash
set -e

echo "🚀 Starting release process..."

# Check if we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
  echo "❌ Error: Must be on main branch (currently on $current_branch)"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "❌ Error: You have uncommitted changes"
  exit 1
fi

# Pull latest
echo "📥 Pulling latest changes..."
git pull origin main

# Run nx release version
echo "📝 Running nx release version..."
npx nx release version --skip-publish

# Check if there were any changes
if ! git diff-index --quiet HEAD --; then
  echo "✅ Version bumps created"
  
  # Push to main
  echo "📤 Pushing to main..."
  git push origin main
  
  # Extract changelog for PR body
  echo "📋 Extracting changelog..."
  changelog=""
  for file in packages/*/CHANGELOG.md packages/connectors/*/CHANGELOG.md; do
    if [ -f "$file" ]; then
      pkg=$(basename $(dirname "$file"))
      latest=$(sed -n '/^## /,/^## /p' "$file" | head -n -1 | head -n 15)
      if [ -n "$latest" ]; then
        changelog="${changelog}\n### 📦 ${pkg}\n${latest}\n"
      fi
    fi
  done
  
  # Create PR body
  cat > /tmp/release-pr.md << 'EOF'
## 🚀 Release PR

This PR will publish the version changes to npm when merged.

### 📋 Changelog

EOF
  echo -e "$changelog" >> /tmp/release-pr.md
  cat >> /tmp/release-pr.md << 'EOF'

### ✅ Next Steps

1. Review changes in the Files tab
2. Wait for CI checks to pass ✅
3. Merge to publish to npm 📦
EOF
  
  # Check if PR already exists
  existing_pr=$(gh pr list --head main --base production --state open --json number --jq '.[0].number' 2>/dev/null || echo "")
  
  if [ -z "$existing_pr" ]; then
    echo "📝 Creating release PR..."
    pr_url=$(gh pr create \
      --title "Release: $(date +%Y-%m-%d)" \
      --body-file /tmp/release-pr.md \
      --head main \
      --base production)
    echo "✅ PR created: $pr_url"
    
    # Open in browser
    gh pr view --web
  else
    echo "📝 Updating existing PR #$existing_pr..."
    gh pr edit "$existing_pr" --body-file /tmp/release-pr.md
    echo "✅ PR updated: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/pull/$existing_pr"
    
    # Open in browser
    gh pr view "$existing_pr" --web
  fi
  
  echo ""
  echo "🎉 Release process complete!"
  echo "   Review the PR and merge when CI passes"
else
  echo "ℹ️  No changes detected - nothing to release"
fi
