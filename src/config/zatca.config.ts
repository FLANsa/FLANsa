/**
 * ZATCA Configuration for Production
 * TODO: Replace with actual ZATCA credentials and certificates
 */

export const zatcaConfig = {
  // Official Fatoora Gateway Endpoints
  production: {
    baseUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing',
    endpoints: {
      compliance: '/core/compliance',
      complianceInvoices: '/core/compliance/invoices',
      productionCsid: '/core/production/csids',
      clearance: '/clearance/invoices',
      reporting: '/reporting/invoices',
      qr: '/qr'
    }
  },
  
  // Sandbox for testing
  sandbox: {
    baseUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation',
    endpoints: {
      compliance: '/compliance',
      complianceInvoices: '/compliance/invoices',
      productionCsid: '/production/csids',
      clearance: '/clearance/invoices',
      reporting: '/reporting/invoices',
      qr: '/sandbox/qr'
    }
  },
  
  // Certificate paths
  certificates: {
    path: './certs/',
    // TODO: Replace with actual certificate files
    walletCert: 'wallet.p12',
    signingCert: 'signing.p12',
    password: '' // TODO: Store securely from environment
  },
  
  // Business information
  business: {
    vatNumber: '', // TODO: Set from environment
    crNumber: '', // TODO: Set from environment
    issuingEntity: '' // TODO: Set from environment
  },
  
  // Invoice settings
  invoice: {
    environment: 'development', // TODO: Set based on actual environment
    documentType: '1000', // Standard B2B invoices (default for clearance)
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
