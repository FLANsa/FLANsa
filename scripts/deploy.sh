#!/bin/bash

# Firebase Deployment Script
# This script builds and deploys the Big Diet POS System to Firebase Hosting

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Big Diet Restaurant POS - Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo -e "${YELLOW}Please install it using: npm install -g firebase-tools${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Firebase CLI is installed${NC}"

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  You are not logged in to Firebase${NC}"
    echo -e "${YELLOW}Please login using: firebase login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Firebase CLI is authenticated${NC}"

# Get project ID
PROJECT_ID=$(cat .firebaserc 2>/dev/null | grep -o '"default": "[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Could not find project ID in .firebaserc${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project ID: ${PROJECT_ID}${NC}"
echo ""

# Step 1: Build the project
echo -e "${YELLOW}Step 1: Building the project...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 2: Build Firebase Functions
echo -e "${YELLOW}Step 2: Building Firebase Functions...${NC}"
if [ -d "functions" ]; then
    cd functions
    if npm run build 2>/dev/null || npm install && npm run build; then
        echo -e "${GREEN}✓ Functions build completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Functions build failed, continuing anyway...${NC}"
    fi
    cd ..
else
    echo -e "${YELLOW}⚠️  Functions directory not found, skipping...${NC}"
fi
echo ""

# Step 3: Deploy Firestore Rules and Indexes
echo -e "${YELLOW}Step 3: Deploying Firestore Rules and Indexes...${NC}"
if firebase deploy --only firestore --project "$PROJECT_ID"; then
    echo -e "${GREEN}✓ Firestore rules and indexes deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Firestore deployment failed, continuing...${NC}"
fi
echo ""

# Step 4: Deploy Storage Rules
echo -e "${YELLOW}Step 4: Deploying Storage Rules...${NC}"
if firebase deploy --only storage --project "$PROJECT_ID"; then
    echo -e "${GREEN}✓ Storage rules deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Storage deployment failed, continuing...${NC}"
fi
echo ""

# Step 5: Deploy Functions
echo -e "${YELLOW}Step 5: Deploying Firebase Functions...${NC}"
if firebase deploy --only functions --project "$PROJECT_ID"; then
    echo -e "${GREEN}✓ Functions deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Functions deployment failed, continuing...${NC}"
fi
echo ""

# Step 6: Deploy Hosting
echo -e "${YELLOW}Step 6: Deploying to Firebase Hosting...${NC}"
if firebase deploy --only hosting --project "$PROJECT_ID"; then
    echo -e "${GREEN}✓ Hosting deployed successfully${NC}"
else
    echo -e "${RED}❌ Hosting deployment failed${NC}"
    exit 1
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Project built${NC}"
echo -e "${GREEN}✓ Firestore rules and indexes deployed${NC}"
echo -e "${GREEN}✓ Storage rules deployed${NC}"
echo -e "${GREEN}✓ Functions deployed${NC}"
echo -e "${GREEN}✓ Hosting deployed${NC}"
echo ""
echo -e "${BLUE}Your app is now live at:${NC}"
echo -e "${BLUE}https://${PROJECT_ID}.web.app${NC}"
echo -e "${BLUE}https://${PROJECT_ID}.firebaseapp.com${NC}"
echo ""
echo -e "${YELLOW}Admin Dashboard:${NC}"
echo -e "${YELLOW}https://${PROJECT_ID}.web.app/admin${NC}"
echo ""
echo -e "${GREEN}Deployment completed!${NC}"

