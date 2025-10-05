#!/bin/bash
set -e

echo "=== Testing Release Flow ==="
echo ""

# 1. Check production branch exists
echo "1. Production branch:"
git log production --oneline -1
echo ""

# 2. Check what's affected since production
echo "2. Projects affected since last publish (production):"
npx nx show projects --affected --base=production
echo ""

# 3. Check release-next branch
echo "3. Release-next branch (staging):"
git log release-next --oneline -1
echo ""

# 4. Check what would be in the release
echo "4. Commits between production and release-next:"
git log --oneline production..release-next
echo ""

# 5. Simulate what CI would do
echo "5. What CI would test (affected projects):"
echo "   Base: production"
echo "   Head: current branch"
npx nx show projects --affected --base=production --head=HEAD
echo ""

# 6. Check if release PR exists
echo "6. Release PR status:"
gh pr list --head release-next --json number,title,state
echo ""

echo "=== Test Complete ==="
# Test commit for release flow
