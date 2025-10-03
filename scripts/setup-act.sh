#!/bin/bash

# Setup script for nektos/act - GitHub Actions local runner
# https://nektosact.com/

set -e

echo "🚀 Setting up nektos/act for local GitHub Actions..."

# Check if act is already installed
if command -v act &> /dev/null; then
    echo "✅ act is already installed: $(act --version)"
    exit 0
fi

# Install act using the official installer
echo "📦 Installing act..."
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Verify installation
if command -v act &> /dev/null; then
    echo "✅ act installed successfully: $(act --version)"
else
    echo "❌ act installation failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete! You can now run:"
echo "  act push                    # Run the full CI workflow"
echo "  act -j main                 # Run specific job"
echo "  act -l                      # List available workflows"
echo "  act --dryrun               # Show what would run"
echo ""
echo "📖 For more options: act --help"
