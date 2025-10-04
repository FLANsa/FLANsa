import QRCode from 'qrcode'
import { ZATCAQRData } from '../types'

/**
 * Generate ZATCA QR Code TLV (Tag-Length-Value) format
 * Based on Saudi Arabia's ZATCA simplified invoice requirements
 * Includes all mandatory tags as per ZATCA Security Features Implementation Standards v1.2
 */
export function generateZATCATLV(data: ZATCAQRData): string {
  const tlvData: string[] = []
  
  // Tag 1: Seller Name (UTF-8) - Mandatory from Dec 4, 2021
  const sellerNameBytes = new TextEncoder().encode(data.sellerName)
  tlvData.push(`01${sellerNameBytes.length.toString(16).padStart(2, '0')}${Array.from(sellerNameBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 2: VAT Number - Mandatory from Dec 4, 2021
  const vatNumberBytes = new TextEncoder().encode(data.vatNumber)
  tlvData.push(`02${vatNumberBytes.length.toString(16).padStart(2, '0')}${Array.from(vatNumberBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 3: Timestamp (ISO 8601) - Mandatory from Dec 4, 2021
  const timestampBytes = new TextEncoder().encode(data.timestamp)
  tlvData.push(`03${timestampBytes.length.toString(16).padStart(2, '0')}${Array.from(timestampBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 4: Total Amount (with 2 decimal places) - Mandatory from Dec 4, 2021
  const totalStr = data.total.toFixed(2)
  const totalBytes = new TextEncoder().encode(totalStr)
  tlvData.push(`04${totalBytes.length.toString(16).padStart(2, '0')}${Array.from(totalBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 5: VAT Amount (with 2 decimal places) - Mandatory from Dec 4, 2021
  const vatTotalStr = data.vatTotal.toFixed(2)
  const vatTotalBytes = new TextEncoder().encode(vatTotalStr)
  tlvData.push(`05${vatTotalBytes.length.toString(16).padStart(2, '0')}${Array.from(vatTotalBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 6: Hash of XML invoice (SHA256) - Mandatory from Jan 1, 2023
  if (data.xmlHash) {
    const hashBytes = new Uint8Array(Buffer.from(data.xmlHash, 'hex'))
    tlvData.push(`06${hashBytes.length.toString(16).padStart(2, '0')}${Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  }
  
  // Tag 7: ECDSA signature of XML Hash - For Simplified Tax Invoices
  if (data.xmlSignature) {
    const signatureBytes = new Uint8Array(Buffer.from(data.xmlSignature, 'hex'))
    tlvData.push(`07${signatureBytes.length.toString(16).padStart(2, '0')}${Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  }
  
  // Tag 8: ECDSA public key - For Simplified Tax Invoices
  if (data.publicKey) {
    const publicKeyBytes = new Uint8Array(Buffer.from(data.publicKey, 'hex'))
    tlvData.push(`08${publicKeyBytes.length.toString(16).padStart(2, '0')}${Array.from(publicKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  }
  
  // Tag 9: ECDSA signature from ZATCA CA - For Simplified Tax Invoices
  if (data.zatcaSignature) {
    const zatcaSignatureBytes = new Uint8Array(Buffer.from(data.zatcaSignature, 'hex'))
    tlvData.push(`09${zatcaSignatureBytes.length.toString(16).padStart(2, '0')}${Array.from(zatcaSignatureBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  }
  
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
 * Generate ZATCA QR TLV Base64 data (for UBL XML embedding)
 */
export function generateZATCAQRData(data: ZATCAQRData): string {
  const tlvData = generateZATCATLV(data)
  return btoa(tlvData)
}

/**
 * Generate SHA256 hash of XML invoice for ZATCA compliance (Tag 6)
 */
export async function generateXMLHash(xmlContent: string): Promise<string> {
  try {
    // Remove any existing QR code data element before hashing
    const cleanXml = xmlContent.replace(/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/g, '')
    
    // Convert to UTF-8 bytes
    const encoder = new TextEncoder()
    const data = encoder.encode(cleanXml)
    
    // Generate SHA256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
  } catch (error) {
    console.error('Error generating XML hash:', error)
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
 * Generate ECDSA key pair for ZATCA compliance
 * Uses P-256 curve as required by ZATCA
 */
export async function generateECDSAKeyPair(): Promise<CryptoKeyPair> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256' // ZATCA requires P-256 curve
      },
      true, // extractable
      ['sign', 'verify']
    )
    
    return keyPair
  } catch (error) {
    console.error('Error generating ECDSA key pair:', error)
    throw error
  }
}

/**
 * Export public key in PEM format
 */
export async function exportPublicKeyPEM(publicKey: CryptoKey): Promise<string> {
  try {
    const exported = await crypto.subtle.exportKey('spki', publicKey)
    const exportedAsString = btoa(String.fromCharCode(...new Uint8Array(exported)))
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsString}\n-----END PUBLIC KEY-----`
  } catch (error) {
    console.error('Error exporting public key:', error)
    throw error
  }
}

/**
 * Sign data with ECDSA private key
 */
export async function signWithECDSA(privateKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256'
      },
      privateKey,
      data
    )
    
    return signature
  } catch (error) {
    console.error('Error signing with ECDSA:', error)
    throw error
  }
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
  qrData?: string
  digitalSignature?: string
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
  
  <!-- ZATCA Compliance Fields -->
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:CustomizationID>urn:sa:qayd-pos:invoice:1.0</cbc:CustomizationID>
  
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
        <cbc:CompanyID schemeID="VAT">${data.sellerVatNumber}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  ${data.qrData ? `
  <!-- QR Code Reference -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cac:EmbeddedDocumentBinaryObject mimeCode="text/plain">
        ${data.qrData}
      </cac:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  ` : ''}
  
  <!-- Invoice Lines -->
  ${data.items.map((item, index) => {
    const lineTotalExcludingTax = (item.price * item.quantity) / (1 + item.vatRate / 100)
    const lineTaxAmount = (item.price * item.quantity) - lineTotalExcludingTax
    const unitPriceExcludingTax = item.price / (1 + item.vatRate / 100)
    
    return `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
    
    <!-- صافي السطر (قبل الضريبة) -->
    <cbc:LineExtensionAmount currencyID="SAR">${lineTotalExcludingTax.toFixed(2)}</cbc:LineExtensionAmount>
    
    <cac:Item>
      <cbc:Description>${item.nameAr}</cbc:Description>
      <cbc:Name>${item.nameEn}</cbc:Name>
      <!-- تصنيف الضريبة على مستوى الصنف -->
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${item.vatRate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    
    <!-- سعر الوحدة قبل الضريبة -->
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${unitPriceExcludingTax.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
    
    <!-- ضريبة السطر -->
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${lineTaxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="SAR">${lineTotalExcludingTax.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="SAR">${lineTaxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${item.vatRate}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </cac:InvoiceLine>`
  }).join('')}
  
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
  
  <!-- ZATCA Production Fields -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:DocumentTypeCode>ICV</cbc:DocumentTypeCode>
    <cbc:DocumentDescription>Invoice Counter Value</cbc:DocumentDescription>
  </cac:AdditionalDocumentReference>
  
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cbc:DocumentTypeCode>PIH</cbc:DocumentTypeCode>
    <cbc:DocumentDescription>Previous Invoice Hash</cbc:DocumentDescription>
  </cac:AdditionalDocumentReference>
  
  <!-- Digital Signature (XAdES B-B) -->
  ${data.digitalSignature ? `
  <cac:Signature>
    ${data.digitalSignature}
  </cac:Signature>
  ` : ''}
</Invoice>`
  
  return xml
}

/**
 * Generate XAdES B-B Digital Signature for ZATCA compliance
 * Based on ETSI EN 319 132-1 standard
 */
export async function generateXAdESSignature(xmlContent: string, privateKey?: CryptoKey): Promise<string> {
  try {
    // For now, generate a placeholder signature structure
    // In production, this would use actual ECDSA signing with the private key
    
    const signatureId = `sig-${generateUUID()}`
    const signedInfoId = `signed-info-${generateUUID()}`
    const signedPropertiesId = `signed-properties-${generateUUID()}`
    
    // Generate SHA256 hash of the XML content (excluding QR code and signature elements)
    const cleanXml = xmlContent
      .replace(/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/g, '')
      .replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>/g, '')
    
    const encoder = new TextEncoder()
    const data = encoder.encode(cleanXml)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const digestValue = btoa(String.fromCharCode(...hashArray))
    
    // Generate signature timestamp
    const signingTime = new Date().toISOString()
    
    // Create XAdES B-B signature structure
    const signature = `
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${signatureId}">
  <ds:SignedInfo Id="${signedInfoId}">
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
    
    <!-- Reference to the XML content -->
    <ds:Reference URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
          <ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>
        </ds:Transform>
        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
          <ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath>
        </ds:Transform>
        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
          <ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath>
        </ds:Transform>
        <ds:Transform Algorithm="http://www.w3.org/2006/12/xmlc14n11"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>${digestValue}</ds:DigestValue>
    </ds:Reference>
    
    <!-- Reference to SignedProperties -->
    <ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropertiesId}">
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>PLACEHOLDER_SIGNED_PROPERTIES_HASH</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  
  <ds:SignatureValue>PLACEHOLDER_SIGNATURE_VALUE</ds:SignatureValue>
  
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>PLACEHOLDER_CERTIFICATE_CHAIN</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
  
  <ds:Object>
    <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#${signatureId}">
      <xades:SignedProperties Id="${signedPropertiesId}">
        <xades:SignedSignatureProperties>
          <xades:SigningTime>${signingTime}</xades:SigningTime>
          <xades:SigningCertificateV2>
            <xades:Cert>
              <xades:CertDigest>
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                <ds:DigestValue>PLACEHOLDER_CERTIFICATE_HASH</ds:DigestValue>
              </xades:CertDigest>
              <xades:IssuerSerial>
                <ds:X509IssuerName>PLACEHOLDER_ISSUER_NAME</ds:X509IssuerName>
                <ds:X509SerialNumber>PLACEHOLDER_SERIAL_NUMBER</ds:X509SerialNumber>
              </xades:IssuerSerial>
            </xades:Cert>
          </xades:SigningCertificateV2>
          <xades:SignaturePolicyIdentifier>
            <xades:SignaturePolicyId>
              <xades:SigPolicyId>
                <xades:Identifier>urn:oasis:names:specification:ubl:schema:xsd:Invoice-2</xades:Identifier>
              </xades:SigPolicyId>
              <xades:SigPolicyHash>
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                <ds:DigestValue>PLACEHOLDER_POLICY_HASH</ds:DigestValue>
              </xades:SigPolicyHash>
            </xades:SignaturePolicyId>
          </xades:SignaturePolicyIdentifier>
        </xades:SignedSignatureProperties>
        <xades:SignedDataObjectProperties>
          <xades:DataObjectFormat ObjectReference="#${signedInfoId}">
            <xades:MimeType>text/xml</xades:MimeType>
          </xades:DataObjectFormat>
        </xades:SignedDataObjectProperties>
      </xades:SignedProperties>
    </xades:QualifyingProperties>
  </ds:Object>
</ds:Signature>`
    
    return signature.trim()
  } catch (error) {
    console.error('Error generating XAdES signature:', error)
    return `XADES_SIGNATURE_ERROR_${Date.now().toString(36)}`
  }
}

/**
 * Generate digital signature for ZATCA (Phase 2)
 * Note: This is a placeholder - real implementation requires ZATCA certificates
 */
export function generateDigitalSignature(xmlContent: string, privateKey?: string): string {
  // Placeholder for digital signature
  // In real implementation, this would use ZATCA certificates and proper signing
  try {
    // Use encodeURIComponent to handle non-Latin characters
    const encodedContent = encodeURIComponent(xmlContent)
    const hash = btoa(encodedContent)
    return `SIGNATURE_PLACEHOLDER_${hash.slice(0, 20)}`
  } catch (error) {
    console.error('Error generating digital signature:', error)
    return `SIGNATURE_PLACEHOLDER_${Date.now().toString(36)}`
  }
}

/**
 * Generate XML Signature for ZATCA Production
 * Note: This is a placeholder - real implementation requires ZATCA certificates
 */
export function generateXMLSignature(xmlContent: string): string {
  // Placeholder for XML signature
  // In real implementation, this would use ZATCA certificates and proper XML signing
  try {
    const encodedContent = encodeURIComponent(xmlContent)
    const hash = btoa(encodedContent)
    return `XML_SIGNATURE_PLACEHOLDER_${hash.slice(0, 32)}`
  } catch (error) {
    console.error('Error generating XML signature:', error)
    return `XML_SIGNATURE_PLACEHOLDER_${Date.now().toString(36)}`
  }
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
