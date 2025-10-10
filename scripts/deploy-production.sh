#!/bin/bash

# SafeWork Pro - Production Deployment Script
# This script handles production deployments with safety checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SafeWork Pro Production Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"

# Safety checks
echo -e "${YELLOW}🔍 Running pre-deployment safety checks...${NC}"

# Check if we're on main branch
BRANCH_NAME=$(git branch --show-current)
if [[ "$BRANCH_NAME" != "main" && "$BRANCH_NAME" != "master" ]]; then
    echo -e "${RED}❌ Error: Must be on main/master branch for production deployment${NC}"
    echo "Current branch: $BRANCH_NAME"
    exit 1
fi

# Check if there are uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}❌ Error: Uncommitted changes detected${NC}"
    echo "Please commit or stash changes before deploying"
    exit 1
fi

# Check if we're up to date with remote
git fetch origin
if [[ $(git rev-parse HEAD) != $(git rev-parse origin/main) ]]; then
    echo -e "${RED}❌ Error: Local branch not up to date with remote${NC}"
    echo "Please pull latest changes before deploying"
    exit 1
fi

echo -e "${GREEN}✅ Safety checks passed${NC}"

# Build verification
echo -e "${BLUE}🔨 Running build verification...${NC}"
cd web
npm run build
echo -e "${GREEN}✅ Build successful${NC}"

# Bundle analysis (optional)
if [[ "$ANALYZE" == "true" ]]; then
    echo -e "${BLUE}📊 Running bundle analysis...${NC}"
    ANALYZE=true npm run build
    echo -e "${GREEN}✅ Bundle analysis complete${NC}"
fi

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Deploy to production
echo -e "${BLUE}🚀 Deploying to production...${NC}"
cd ..
vercel --prod

# Get production URL
PRODUCTION_URL="https://safe-taks.vercel.app"

echo ""
echo -e "${GREEN}🎉 Production deployment successful!${NC}"
echo -e "${BLUE}🌐 Production URL: ${GREEN}$PRODUCTION_URL${NC}"
echo ""
echo -e "${BLUE}📋 Deployment completed at: ${GREEN}$(date)${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Verify deployment at: $PRODUCTION_URL"
echo "2. Test critical user journeys (TRA creation, LMRA execution)"
echo "3. Monitor error tracking (Sentry) and analytics"
echo "4. Check performance monitoring dashboard"
echo ""
echo -e "${BLUE}🔒 Remember: Production environment uses live Firebase project${NC}"