#!/bin/bash

# SafeWork Pro - Preview Deployment Script
# This script handles preview deployments for feature branches

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="safe-taks"
BRANCH_NAME=$(git branch --show-current)
COMMIT_SHA=$(git rev-parse --short HEAD)

echo -e "${BLUE}🚀 SafeWork Pro Preview Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo "Branch: $BRANCH_NAME"
echo "Commit: $COMMIT_SHA"
echo ""

# Check if we're on a feature branch
if [[ "$BRANCH_NAME" == "main" || "$BRANCH_NAME" == "master" ]]; then
    echo -e "${RED}❌ Error: Cannot deploy main/master branch to preview${NC}"
    echo "Use production deployment for main branch"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if project is linked to Vercel
if ! vercel link --yes 2>/dev/null; then
    echo -e "${YELLOW}🔗 Project not linked to Vercel. Linking...${NC}"
    vercel link
fi

# Pull latest environment variables from production
echo -e "${BLUE}📥 Pulling environment variables from production...${NC}"
vercel env pull .env.preview

# Build and deploy to preview
echo -e "${BLUE}🔨 Building and deploying to preview...${NC}"
vercel --build-env NODE_OPTIONS="--max_old_space_size=4096"

# Get preview URL
PREVIEW_URL=$(vercel ls --scope="$PROJECT_NAME" --token="$VERCEL_TOKEN" | grep "$BRANCH_NAME" | awk '{print $2}' | head -n 1)

if [[ -z "$PREVIEW_URL" ]]; then
    echo -e "${YELLOW}⚠️  Could not find preview URL. Trying alternative method...${NC}"
    PREVIEW_URL="https://$BRANCH_NAME-$PROJECT_NAME.vercel.app"
fi

echo ""
echo -e "${GREEN}✅ Preview deployment successful!${NC}"
echo -e "${BLUE}🌐 Preview URL: ${GREEN}$PREVIEW_URL${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Test your feature at: $PREVIEW_URL"
echo "2. Create a pull request for code review"
echo "3. Share preview URL with team for feedback"
echo ""
echo -e "${YELLOW}💡 Tip: Preview deployments auto-update with new commits${NC}"

# Optional: Set up GitHub PR comment
if [[ -n "$GITHUB_ACTIONS" ]]; then
    echo "PREVIEW_URL=$PREVIEW_URL" >> $GITHUB_ENV
fi