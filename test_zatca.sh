#!/bin/bash

# ZATCA Test Script
# This script tests the ZATCA integration with a sample invoice

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 ZATCA Integration Test${NC}"
echo "================================"

# Configuration
BASE_URL="http://localhost:3000"
TEST_INVOICE_ID="test-invoice-$(date +%s)"

# Test data
TEST_INVOICE='{
  "uuid": "'${TEST_INVOICE_ID}'",
  "issueDateTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "invoiceNumber": "INV-TEST-'$(date +%Y%m%d%H%M%S)'",
  "invoiceTypeCode": 388,
  "currency": "SAR",
  "items": [
    {
      "nameAr": "برجر تجريبي",
      "nameEn": "Test Burger",
      "quantity": 1,
      "unitPrice": 25.00,
      "lineTotal": 25.00,
      "vatRate": 0.15,
      "vatAmount": 3.75
    }
  ],
  "summary": {
    "lineTotal": 25.00,
    "taxAmount": 3.75,
    "taxInclusiveAmount": 28.75
  }
}'

echo -e "${YELLOW}📋 Test Invoice Data:${NC}"
echo "$TEST_INVOICE" | jq '.'

echo ""
echo -e "${YELLOW}🔄 Testing ZATCA Pipeline...${NC}"

# Test 1: Check if server is running
echo -e "${BLUE}1. Checking server status...${NC}"
if curl -s -f "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start the server first.${NC}"
    echo "Run: npm run dev"
    exit 1
fi

# Test 2: Test ZATCA configuration
echo -e "${BLUE}2. Testing ZATCA configuration...${NC}"
CONFIG_RESPONSE=$(curl -s "${BASE_URL}/api/zatca/config" || echo '{"error": "Config endpoint not available"}')
echo "Config response: $CONFIG_RESPONSE"

# Test 3: Test invoice generation
echo -e "${BLUE}3. Testing invoice generation...${NC}"
GENERATION_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/zatca/generate" \
  -H "Content-Type: application/json" \
  -d "$TEST_INVOICE" || echo '{"error": "Generation failed"}')

echo "Generation response: $GENERATION_RESPONSE"

# Test 4: Test XML signing (if available)
echo -e "${BLUE}4. Testing XML signing...${NC}"
SIGNING_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/zatca/sign" \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "<?xml version=\"1.0\"?><Invoice>test</Invoice>",
    "pfxBase64": "dGVzdA==",
    "password": "test"
  }' || echo '{"error": "Signing failed"}')

echo "Signing response: $SIGNING_RESPONSE"

# Test 5: Test reporting (if available)
echo -e "${BLUE}5. Testing reporting...${NC}"
REPORTING_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/zatca/reporting" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "'${TEST_INVOICE_ID}'",
    "invoiceHash": "test-hash",
    "invoiceXMLBase64": "dGVzdA=="
  }' || echo '{"error": "Reporting failed"}')

echo "Reporting response: $REPORTING_RESPONSE"

echo ""
echo -e "${GREEN}📊 Test Summary:${NC}"
echo "================================"

# Check results
if echo "$GENERATION_RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ Invoice generation: FAILED${NC}"
else
    echo -e "${GREEN}✅ Invoice generation: PASSED${NC}"
fi

if echo "$SIGNING_RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ XML signing: FAILED${NC}"
else
    echo -e "${GREEN}✅ XML signing: PASSED${NC}"
fi

if echo "$REPORTING_RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ Reporting: FAILED${NC}"
else
    echo -e "${GREEN}✅ Reporting: PASSED${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Check server logs for detailed error messages"
echo "2. Verify ZATCA configuration in .env file"
echo "3. Ensure CSID certificate is properly configured"
echo "4. Test with real ZATCA sandbox environment"

echo ""
echo -e "${GREEN}🎉 Test completed!${NC}"

