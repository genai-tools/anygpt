#!/bin/bash

# Local CI simulation script
# This mimics the GitHub Actions workflow locally

set -e

echo "🚀 Starting local CI simulation..."
echo "This simulates the GitHub Actions workflow locally"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

run_step() {
    echo -e "${YELLOW}▶ $1${NC}"
    if eval "$2"; then
        echo -e "${GREEN}✅ $1 - SUCCESS${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - FAILED${NC}"
        return 1
    fi
}

echo "📦 Node.js version:"
node --version
npm --version

echo ""
echo "🔧 Installing dependencies..."
run_step "npm install" "npm install --legacy-peer-deps --no-package-lock"

echo ""
echo "🔍 Validating NX workspace..."
run_step "NX workspace validation" "npx nx show projects"

echo ""
echo "📝 TypeScript compilation check..."
run_step "TypeScript check" "npx tsc --noEmit --project tsconfig.base.json"

echo ""
echo "🧪 Running tests..."
run_step "Tests" "npx nx run-many -t test" || echo "⚠️  Tests need fixing"

echo ""
echo "🔨 Running builds..."
run_step "Builds" "npx nx run-many -t build" || echo "⚠️  Builds need fixing"

echo ""
echo "✨ Running lints..."
run_step "Lints" "npx nx run-many -t lint" || echo "⚠️  Lints need fixing"

echo ""
echo -e "${GREEN}🎉 Local CI simulation complete!${NC}"
echo "Now you can fix issues locally before pushing to GitHub"
