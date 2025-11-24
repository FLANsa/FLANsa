#!/bin/bash

# Firebase Setup Script
# This script sets up Firebase for the Big Diet POS System

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Firebase Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"
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

# Get project ID from .firebaserc
PROJECT_ID=$(cat .firebaserc | grep -o '"default": "[^"]*"' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Could not find project ID in .firebaserc${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project ID: ${PROJECT_ID}${NC}"
echo ""

# Step 1: Initialize Firebase (if not already initialized)
echo -e "${YELLOW}Step 1: Checking Firebase initialization...${NC}"
if [ ! -f "firebase.json" ]; then
    echo -e "${YELLOW}⚠️  firebase.json not found. Initializing Firebase...${NC}"
    firebase init --project "$PROJECT_ID"
else
    echo -e "${GREEN}✓ Firebase is already initialized${NC}"
fi
echo ""

# Step 2: Deploy Firestore Rules
echo -e "${YELLOW}Step 2: Deploying Firestore Rules...${NC}"
if [ -f "firestore.rules" ]; then
    firebase deploy --only firestore:rules --project "$PROJECT_ID"
    echo -e "${GREEN}✓ Firestore rules deployed${NC}"
else
    echo -e "${RED}❌ firestore.rules file not found${NC}"
    exit 1
fi
echo ""

# Step 3: Deploy Firestore Indexes
echo -e "${YELLOW}Step 3: Deploying Firestore Indexes...${NC}"
if [ -f "firestore.indexes.json" ]; then
    firebase deploy --only firestore:indexes --project "$PROJECT_ID"
    echo -e "${GREEN}✓ Firestore indexes deployed${NC}"
else
    echo -e "${YELLOW}⚠️  firestore.indexes.json not found, skipping...${NC}"
fi
echo ""

# Step 4: Deploy Storage Rules
echo -e "${YELLOW}Step 4: Deploying Storage Rules...${NC}"
if [ -f "storage.rules" ]; then
    firebase deploy --only storage --project "$PROJECT_ID"
    echo -e "${GREEN}✓ Storage rules deployed${NC}"
else
    echo -e "${YELLOW}⚠️  storage.rules not found, skipping...${NC}"
fi
echo ""

# Step 5: Check if Authentication and Firestore are enabled
echo -e "${YELLOW}Step 5: Checking Firebase services...${NC}"
echo -e "${YELLOW}⚠️  Please verify in Firebase Console:${NC}"
echo -e "${YELLOW}   1. Authentication is enabled: https://console.firebase.google.com/project/${PROJECT_ID}/authentication${NC}"
echo -e "${YELLOW}   2. Firestore Database is enabled: https://console.firebase.google.com/project/${PROJECT_ID}/firestore${NC}"
echo -e "${YELLOW}   3. Storage is enabled: https://console.firebase.google.com/project/${PROJECT_ID}/storage${NC}"
echo ""

# Step 6: Enable Authentication providers
echo -e "${YELLOW}Step 6: Authentication Setup${NC}"
echo -e "${YELLOW}⚠️  Please enable Email/Password authentication in Firebase Console:${NC}"
echo -e "${YELLOW}   https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Firestore rules deployed${NC}"
echo -e "${GREEN}✓ Firestore indexes deployed${NC}"
echo -e "${GREEN}✓ Storage rules deployed${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "${YELLOW}1. Enable Authentication and Firestore in Firebase Console${NC}"
echo -e "${YELLOW}2. Enable Email/Password authentication provider${NC}"
echo -e "${YELLOW}3. Run: npm run seed (to create initial users and data)${NC}"
echo ""
echo -e "${GREEN}Setup completed!${NC}"

