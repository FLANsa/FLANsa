import * as QRCode from 'qrcode'

export interface ZATCAQRData {
  sellerName: string
  vatNumber: string
  timestamp: string
  total: number
  vatTotal: number
  uuid: string
}

/**
 * Generate ZATCA QR Code TLV (Tag-Length-Value) format
 * Based on Saudi Arabia's ZATCA simplified invoice requirements
 */
export function generateZATCATLV(data: ZATCAQRData): string {
  const tlvData: string[] = []
  
  // Tag 1: Seller Name (UTF-8)
  const sellerNameBytes = Buffer.from(data.sellerName, 'utf8')
  tlvData.push(`01${sellerNameBytes.length.toString(16).padStart(2, '0')}${sellerNameBytes.toString('hex')}`)
  
  // Tag 2: VAT Number
  const vatNumberBytes = Buffer.from(data.vatNumber, 'utf8')
  tlvData.push(`02${vatNumberBytes.length.toString(16).padStart(2, '0')}${vatNumberBytes.toString('hex')}`)
  
  // Tag 3: Timestamp (ISO 8601)
  const timestampBytes = Buffer.from(data.timestamp, 'utf8')
  tlvData.push(`03${timestampBytes.length.toString(16).padStart(2, '0')}${timestampBytes.toString('hex')}`)
  
  // Tag 4: Total Amount (with 2 decimal places)
  const totalStr = data.total.toFixed(2)
  const totalBytes = Buffer.from(totalStr, 'utf8')
  tlvData.push(`04${totalBytes.length.toString(16).padStart(2, '0')}${totalBytes.toString('hex')}`)
  
  // Tag 5: VAT Amount (with 2 decimal places)
  const vatTotalStr = data.vatTotal.toFixed(2)
  const vatTotalBytes = Buffer.from(vatTotalStr, 'utf8')
  tlvData.push(`05${vatTotalBytes.length.toString(16).padStart(2, '0')}${vatTotalBytes.toString('hex')}`)
  
  return tlvData.join('')
}

/**
 * Generate Base64 encoded ZATCA QR Code
 */
export async function generateZATCAQR(data: ZATCAQRData): Promise<string> {
  const tlvData = generateZATCATLV(data)
  const base64Data = Buffer.from(tlvData, 'hex').toString('base64')
  
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
  const hash = Buffer.from(tlvData, 'hex').toString('base64')
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
