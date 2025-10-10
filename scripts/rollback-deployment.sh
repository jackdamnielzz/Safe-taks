#!/bin/bash

# SafeWork Pro - Deployment Rollback Script
# This script handles safe rollback to previous deployments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 SafeWork Pro Deployment Rollback${NC}"
echo -e "${BLUE}===================================${NC}"

# Safety check - require confirmation for rollback
echo -e "${YELLOW}⚠️  WARNING: This will rollback the production deployment${NC}"
echo ""
echo "This action will:"
echo "  - Immediately replace current production version"
echo "  - May cause brief downtime (< 2 minutes)"
echo "  - Cannot be undone automatically"
echo ""
read -p "Are you sure you want to rollback? (type 'YES' to confirm): " -r
if [[ ! "$REPLY" =~ ^YES$ ]]; then
    echo -e "${GREEN}✅ Rollback cancelled${NC}"
    exit 0
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if project is linked to Vercel
if ! vercel link --yes 2>/dev/null; then
    echo -e "${RED}❌ Error: Project not linked to Vercel${NC}"
    echo "Please run: vercel link"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Available deployments:${NC}"

# List recent deployments
vercel ls --scope="safe-taks" | head -10

echo ""
echo -e "${YELLOW}🔍 Please identify the deployment URL to rollback to:${NC}"
echo "You can find deployment URLs in the list above or in your Vercel dashboard"
echo ""
read -p "Enter the deployment URL to rollback to: " DEPLOYMENT_URL

if [[ -z "$DEPLOYMENT_URL" ]]; then
    echo -e "${RED}❌ Error: No deployment URL provided${NC}"
    exit 1
fi

# Validate deployment URL format
if [[ ! "$DEPLOYMENT_URL" =~ ^https://.*\.vercel\.app ]]; then
    echo -e "${RED}❌ Error: Invalid deployment URL format${NC}"
    echo "Expected format: https://your-deployment.vercel.app"
    exit 1
fi

echo ""
echo -e "${BLUE}🔄 Rolling back to: ${YELLOW}$DEPLOYMENT_URL${NC}"
echo ""

# Execute rollback
if vercel rollback "$DEPLOYMENT_URL"; then
    echo ""
    echo -e "${GREEN}✅ Rollback successful!${NC}"
    echo -e "${BLUE}🌐 Production URL: ${GREEN}https://safe-taks.vercel.app${NC}"
    echo ""
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "1. Verify rollback at: https://safe-taks.vercel.app"
    echo "2. Test critical user journeys"
    echo "3. Monitor error tracking for any issues"
    echo "4. Notify team if rollback was due to critical issue"
else
    echo ""
    echo -e "${RED}❌ Rollback failed!${NC}"
    echo "Please check Vercel dashboard for more details"
    exit 1
fi

echo ""
echo -e "${BLUE}📊 Rollback completed at: ${GREEN}$(date)${NC}"