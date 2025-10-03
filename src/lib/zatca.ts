import QRCode from 'qrcode'
import { ZATCAQRData } from '../types'

/**
 * Generate ZATCA QR Code TLV (Tag-Length-Value) format
 * Based on Saudi Arabia's ZATCA simplified invoice requirements
 */
export function generateZATCATLV(data: ZATCAQRData): string {
  const tlvData: string[] = []
  
  // Tag 1: Seller Name (UTF-8)
  const sellerNameBytes = new TextEncoder().encode(data.sellerName)
  tlvData.push(`01${sellerNameBytes.length.toString(16).padStart(2, '0')}${Array.from(sellerNameBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 2: VAT Number
  const vatNumberBytes = new TextEncoder().encode(data.vatNumber)
  tlvData.push(`02${vatNumberBytes.length.toString(16).padStart(2, '0')}${Array.from(vatNumberBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 3: Timestamp (ISO 8601)
  const timestampBytes = new TextEncoder().encode(data.timestamp)
  tlvData.push(`03${timestampBytes.length.toString(16).padStart(2, '0')}${Array.from(timestampBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 4: Total Amount (with 2 decimal places)
  const totalStr = data.total.toFixed(2)
  const totalBytes = new TextEncoder().encode(totalStr)
  tlvData.push(`04${totalBytes.length.toString(16).padStart(2, '0')}${Array.from(totalBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 5: VAT Amount (with 2 decimal places)
  const vatTotalStr = data.vatTotal.toFixed(2)
  const vatTotalBytes = new TextEncoder().encode(vatTotalStr)
  tlvData.push(`05${vatTotalBytes.length.toString(16).padStart(2, '0')}${Array.from(vatTotalBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  return tlvData.join('')
}

/**
 * Generate Base64 encoded ZATCA QR Code
 */
export async function generateZATCAQR(data: ZATCAQRData): Promise<string> {
  const tlvData = generateZATCATLV(data)
  const base64Data = btoa(tlvData)
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(base64Data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
    
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating ZATCA QR code:', error)
    throw error
  }
}

/**
 * Generate invoice hash for ZATCA compliance
 */
export function generateInvoiceHash(data: ZATCAQRData): string {
  const tlvData = generateZATCATLV(data)
  const hash = btoa(tlvData)
  return hash
}

/**
 * Validate ZATCA QR data
 */
export function validateZATCAData(data: ZATCAQRData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.sellerName || data.sellerName.trim().length === 0) {
    errors.push('Seller name is required')
  }
  
  if (!data.vatNumber || !/^\d{15}$/.test(data.vatNumber)) {
    errors.push('VAT number must be 15 digits')
  }
  
  if (!data.timestamp || isNaN(Date.parse(data.timestamp))) {
    errors.push('Valid timestamp is required')
  }
  
  if (data.total < 0) {
    errors.push('Total amount cannot be negative')
  }
  
  if (data.vatTotal < 0) {
    errors.push('VAT amount cannot be negative')
  }
  
  if (!data.uuid || data.uuid.trim().length === 0) {
    errors.push('UUID is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format timestamp for ZATCA (ISO 8601 with timezone)
 */
export function formatZATCATimestamp(date: Date): string {
  return date.toISOString()
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate UBL XML for ZATCA compliance
 */
export function generateUBLXML(data: {
  invoiceNumber: string
  uuid: string
  issueDate: string
  issueTime: string
  sellerName: string
  sellerVatNumber: string
  sellerCrNumber: string
  sellerAddress: string
  sellerPhone: string
  items: Array<{
    nameAr: string
    nameEn: string
    quantity: number
    price: number
    vatRate: number
  }>
  subtotal: number
  vatTotal: number
  total: number
}): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:UUID>${data.uuid}</cbc:UUID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>0100000</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  
  <!-- Seller Information -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${data.sellerCrNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${data.sellerName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.sellerAddress}</cbc:StreetName>
        <cbc:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cbc:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:Telephone>${data.sellerPhone}</cbc:Telephone>
      </cac:Contact>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${data.sellerVatNumber}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Invoice Lines -->
  ${data.items.map((item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${(item.price * item.quantity).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${item.nameAr}</cbc:Description>
      <cbc:Name>${item.nameEn}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${item.price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${((item.price * item.quantity) * (item.vatRate / 100)).toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="SAR">${(item.price * item.quantity).toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="SAR">${((item.price * item.quantity) * (item.vatRate / 100)).toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${item.vatRate}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </cac:InvoiceLine>`).join('')}
  
  <!-- Tax Summary -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${data.vatTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${data.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${data.vatTotal.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <!-- Legal Monetary Totals -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${data.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${data.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${data.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${data.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`
  
  return xml
}

/**
 * Generate digital signature for ZATCA (Phase 2)
 * Note: This is a placeholder - real implementation requires ZATCA certificates
 */
export function generateDigitalSignature(xmlContent: string, privateKey?: string): string {
  // Placeholder for digital signature
  // In real implementation, this would use ZATCA certificates and proper signing
  const hash = btoa(xmlContent)
  return `SIGNATURE_PLACEHOLDER_${hash.slice(0, 20)}`
}

/**
 * Generate Cryptographic Stamp ID (CSID) for ZATCA
 * Note: This is a placeholder - real CSID comes from ZATCA API
 */
export function generateCSID(): string {
  // Placeholder for CSID
  // In real implementation, this would come from ZATCA onboarding
  return `CSID_PLACEHOLDER_${Date.now().toString(36)}`
}
