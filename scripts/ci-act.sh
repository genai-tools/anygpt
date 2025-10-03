#!/bin/bash

# Local CI using nektos/act via GitHub CLI extension
# https://nektosact.com/installation/gh.html

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Running GitHub Actions CI locally with nektos/act (via gh CLI)${NC}"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not found. Install it first: https://cli.github.com/${NC}"
    exit 1
fi

# Check if act extension is installed
if ! gh extension list | grep -q "nektos/gh-act"; then
    echo -e "${RED}❌ act extension not found. Run: ./scripts/setup-act.sh${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Available commands:${NC}"
echo "  ./scripts/ci-act.sh                 # Run full CI workflow"
echo "  ./scripts/ci-act.sh --dryrun        # Show what would run"
echo "  ./scripts/ci-act.sh --list          # List available workflows"
echo "  ./scripts/ci-act.sh --help          # Show all act options"
echo ""
echo -e "${YELLOW}💡 You can also run directly:${NC}"
echo "  gh act                              # Run full CI workflow"
echo "  gh act --dryrun                     # Show what would run"
echo ""

# Handle command line arguments
case "${1:-}" in
    --dryrun)
        echo -e "${BLUE}🔍 Dry run - showing what would execute:${NC}"
        gh act push --dryrun
        ;;
    --list)
        echo -e "${BLUE}📋 Available workflows:${NC}"
        gh act -l
        ;;
    --help)
        echo -e "${BLUE}📖 act help:${NC}"
        gh act --help
        ;;
    "")
        echo -e "${BLUE}▶️  Running full CI workflow (this may take a few minutes)...${NC}"
        echo ""
        
        # Run the actual CI workflow
        if gh act push; then
            echo ""
            echo -e "${GREEN}✅ CI workflow completed successfully!${NC}"
        else
            echo ""
            echo -e "${RED}❌ CI workflow failed. Check the output above for details.${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo "Use --help to see available options"
        exit 1
        ;;
esac
