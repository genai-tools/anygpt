#!/bin/bash

# Setup script for nektos/act via GitHub CLI extension
# https://nektosact.com/installation/gh.html

set -e

echo "🚀 Setting up nektos/act via GitHub CLI extension..."

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

echo "✅ GitHub CLI found: $(gh --version | head -1)"

# Check if act extension is already installed
if gh extension list | grep -q "nektos/gh-act"; then
    echo "✅ act extension is already installed"
    gh act --version
    exit 0
fi

# Install act as GitHub CLI extension
echo "📦 Installing act as GitHub CLI extension..."
if gh extension install nektos/gh-act; then
    echo "✅ act extension installed successfully"
    gh act --version
else
    echo "❌ act extension installation failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete! You can now run:"
echo "  gh act                      # Run the full CI workflow"
echo "  gh act -j main              # Run specific job"  
echo "  gh act -l                   # List available workflows"
echo "  gh act --dryrun            # Show what would run"
echo ""
echo "📖 For more options: gh act --help"
