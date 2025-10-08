#!/bin/bash

# ZATCA CSR Generator Script
# This script generates a CSR for ZATCA certificate request

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 ZATCA CSR Generator${NC}"
echo "================================"

# Configuration
COMPANY_NAME="Qayd POS System"
ORGANIZATION="مطعم قيد"
COUNTRY="SA"
VAT_NUMBER="300000000000003"
CERT_PASSWORD="ZatcaSecurePass123!"

# Create CSR configuration file
cat > csr_config.txt << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = ${COMPANY_NAME}
O = ${ORGANIZATION}
C = ${COUNTRY}
serialNumber = ${VAT_NUMBER}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = qayd-pos.local
EOF

echo -e "${YELLOW}📝 CSR Configuration created${NC}"

# Generate private key
echo -e "${YELLOW}🔑 Generating private key...${NC}"
openssl genrsa -out zatca_private_key.pem 2048

# Generate CSR
echo -e "${YELLOW}📋 Generating CSR...${NC}"
openssl req -new -key zatca_private_key.pem -out zatca.csr -config csr_config.txt

# Convert CSR to Base64
echo -e "${YELLOW}🔄 Converting CSR to Base64...${NC}"
openssl req -in zatca.csr -outform DER | base64 -w 0 > csr.b64

# Display CSR content
echo -e "${GREEN}✅ CSR generated successfully!${NC}"
echo ""
echo -e "${YELLOW}📄 CSR Content (Base64):${NC}"
echo "================================"
cat csr.b64
echo ""
echo "================================"

# Create PFX template (for after certificate is received)
cat > create_pfx.sh << 'EOF'
#!/bin/bash
# Run this script after receiving the certificate from ZATCA

echo "🔐 Creating PFX from ZATCA certificate..."

# Replace these with actual certificate files
UNIT_CERT="unit_certificate.crt"
CERT_CHAIN="certificate_chain.crt"
PRIVATE_KEY="zatca_private_key.pem"
PFX_OUTPUT="zatca_cert.pfx"
PFX_PASSWORD="ZatcaSecurePass123!"

# Create PFX
openssl pkcs12 -export -out ${PFX_OUTPUT} \
  -inkey ${PRIVATE_KEY} \
  -in ${UNIT_CERT} \
  -certfile ${CERT_CHAIN} \
  -password pass:${PFX_PASSWORD}

# Convert to Base64
base64 -w 0 ${PFX_OUTPUT} > zatca_cert_base64.txt

echo "✅ PFX created and converted to Base64!"
echo "📄 Base64 PFX content:"
cat zatca_cert_base64.txt
EOF

chmod +x create_pfx.sh

echo ""
echo -e "${GREEN}📋 Next Steps:${NC}"
echo "1. Copy the CSR Base64 content above"
echo "2. Go to https://sandbox.fatoora.sa/"
echo "3. Submit the CSR for certificate request"
echo "4. Download the certificate files"
echo "5. Run: ./create_pfx.sh"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Keep zatca_private_key.pem secure"
echo "- Don't share the private key"
echo "- Use strong passwords in production"
echo ""
echo -e "${GREEN}🎉 CSR generation complete!${NC}"