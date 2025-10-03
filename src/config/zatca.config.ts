/**
 * ZATCA Configuration for Production
 * TODO: Replace with actual ZATCA credentials and certificates
 */

export const zatcaConfig = {
  // ZATCA API Endpoints
  production: {
    baseUrl: 'https://zatca-gw-f.pythonanywhere.com', // Placeholder - replace with actual ZATCA URL
    endpoints: {
      invoices: '/gw/invoices',
      qr: '/gw/qr',
      validation: '/gw/validation'
    }
  },
  
  // Sandbox for testing
  sandbox: {
    baseUrl: 'https://zatca-sandbox.example.com', // Placeholder
    endpoints: {
      invoices: '/sandbox/invoices',
      qr: '/sandbox/qr'
    }
  },
  
  // Certificate paths
  certificates: {
    path: './certs/',
    // TODO: Replace with actual certificate files
    walletCert: 'wallet.p12',
    signingCert: 'signing.p12',
    password: process.env.ZATCA_CERT_PASSWORD || '' // Store securely
  },
  
  // Business information
  business: {
    vatNumber: process.env.VAT_NUMBER || '',
    crNumber: process.env.CR_NUMBER || '',
    issuingEntity: process.env.ISSUING_ENTITY || ''
  },
  
  // Invoice settings
  invoice: {
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    documentType: '0100000', // Simplified invoice
    currency: 'SAR',
    language: 'ar'
  },
  
  // Validation rules
  validation: {
    maxItems: 1000,
    maxAmount: 999999999.99,
    minAmount: 0.01
  }
}

export default zatcaConfig
