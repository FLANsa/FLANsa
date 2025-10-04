#!/bin/bash

# ZATCA CSR Generation Script
# This script generates the private key and CSR for ZATCA integration

echo "🔐 Generating ZATCA CSR for Sandbox Environment..."

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate elliptic curve private key (secp256k1)
echo "📝 Generating private key..."
openssl ecparam -name secp256k1 -genkey -noout -out certs/private_key.pem

# Generate CSR using sandbox config
echo "📝 Generating CSR for sandbox..."
openssl req -new -key certs/private_key.pem -out certs/csr.pem -config csr_config_sandbox.txt

# Convert CSR to Base64 (single line, no newlines)
echo "📝 Converting CSR to Base64..."
openssl base64 -in certs/csr.pem -out certs/csr.b64 -A

echo "✅ CSR generation completed!"
echo "📁 Files created:"
echo "   - certs/private_key.pem (Private key - KEEP SECURE!)"
echo "   - certs/csr.pem (CSR in PEM format)"
echo "   - certs/csr.b64 (CSR in Base64 format for ZATCA API)"
echo ""
echo "📋 Next steps:"
echo "   1. Copy the content of certs/csr.b64"
echo "   2. Go to ERAD/Fatoora portal"
echo "   3. Request Compliance CSID using the Base64 CSR"
echo "   4. Save the binarySecurityToken and secret"
echo "   5. Set environment variables:"
echo "      export ZATCA_CSID_TOKEN='your_token_here'"
echo "      export ZATCA_CSID_SECRET='your_secret_here'"
