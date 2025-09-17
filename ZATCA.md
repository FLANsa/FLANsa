# ZATCA Compliance Guide - Big Diet POS

This guide covers ZATCA (Zakat, Tax and Customs Authority) compliance implementation for the Big Diet Restaurant POS system.

## Overview

ZATCA requires Saudi businesses to generate simplified invoices with QR codes containing specific tax information. This system implements the ZATCA simplified invoice requirements for restaurants.

## ZATCA Requirements

### Mandatory Information
1. **Seller Information**
   - Seller name (Arabic and English)
   - VAT number (15 digits)
   - CR number (10 digits)
   - Business address

2. **Invoice Details**
   - Invoice number (unique)
   - Invoice date and time
   - Total amount (including VAT)
   - VAT amount (15%)

3. **QR Code**
   - TLV (Tag-Length-Value) format
   - Base64 encoded
   - Contains all required information

## Implementation

### QR Code Generation

#### TLV Format Structure
```
Tag 1: Seller Name (UTF-8)
Tag 2: VAT Number
Tag 3: Timestamp (ISO 8601)
Tag 4: Total Amount (with 2 decimal places)
Tag 5: VAT Amount (with 2 decimal places)
```

#### Example TLV Data
```
01 0C 4D 63 74 61 6D 20 42 69 67 20 44 69 65 74
02 0F 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35
03 19 32 30 32 35 2D 30 31 2D 31 37 54 32 30 3A 31 35 3A 30 30 2E 30 30 30 5A
04 05 33 31 2E 30 35
05 04 34 2E 30 35
```

### Code Implementation

#### ZATCA QR Data Structure
```typescript
interface ZATCAQRData {
  sellerName: string
  vatNumber: string
  timestamp: string
  total: number
  vatTotal: number
  uuid: string
}
```

#### TLV Generation
```typescript
function generateZATCATLV(data: ZATCAQRData): string {
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
  
  // Tag 4: Total Amount
  const totalStr = data.total.toFixed(2)
  const totalBytes = new TextEncoder().encode(totalStr)
  tlvData.push(`04${totalBytes.length.toString(16).padStart(2, '0')}${Array.from(totalBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  // Tag 5: VAT Amount
  const vatTotalStr = data.vatTotal.toFixed(2)
  const vatTotalBytes = new TextEncoder().encode(vatTotalStr)
  tlvData.push(`05${vatTotalBytes.length.toString(16).padStart(2, '0')}${Array.from(vatTotalBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
  
  return tlvData.join('')
}
```

#### QR Code Generation
```typescript
async function generateZATCAQR(data: ZATCAQRData): Promise<string> {
  const tlvData = generateZATCATLV(data)
  const base64Data = btoa(tlvData)
  
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
}
```

## Cloud Function Implementation

### Invoice Generation Trigger
```typescript
export const generateInvoice = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data()
    const orderId = context.params.orderId

    try {
      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber()
      const uuid = generateUUID()
      
      // Get business settings for ZATCA
      const settingsDoc = await admin.firestore().doc('settings/main').get()
      const settings = settingsDoc.data()
      
      // Generate ZATCA QR data
      const zatcaData = {
        sellerName: settings.zatcaSettings.sellerName,
        vatNumber: settings.zatcaSettings.vatNumber,
        timestamp: new Date().toISOString(),
        total: order.total,
        vatTotal: order.vat,
        uuid: uuid
      }

      // Generate ZATCA QR code
      const zatcaQrBase64 = await generateZATCAQR(zatcaData)
      const hash = generateInvoiceHash(zatcaData)

      // Create invoice document
      const invoiceData = {
        orderId: orderId,
        invoiceNumber: invoiceNumber,
        uuid: uuid,
        zatcaQrBase64: zatcaQrBase64,
        hash: hash,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }

      await admin.firestore().collection('invoices').doc(orderId).set(invoiceData)
      
      // Update order with invoice number
      await snap.ref.update({
        invoiceNumber: invoiceNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

    } catch (error) {
      console.error('Error generating invoice:', error)
      throw error
    }
  })
```

## Configuration

### Business Settings
Configure ZATCA settings in the admin panel:

```typescript
interface ZATCASettings {
  sellerName: string        // "Big Diet Restaurant"
  sellerNameAr: string      // "مطعم Big Diet"
  vatNumber: string         // "123456789012345"
  crNumber: string          // "1010101010"
  address: string           // "Riyadh, Saudi Arabia"
  addressAr: string         // "الرياض، المملكة العربية السعودية"
}
```

### Validation Rules
```typescript
function validateZATCAData(data: ZATCAQRData): { isValid: boolean; errors: string[] } {
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
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

## Receipt Integration

### Receipt Template with ZATCA QR
```html
<div class="receipt">
  <!-- Business Header -->
  <div class="text-center mb-4">
    <h1 class="text-lg font-bold arabic">مطعم Big Diet</h1>
    <p class="text-sm english">Big Diet Restaurant</p>
    <p class="text-xs">VAT: 123456789012345</p>
    <p class="text-xs">CR: 1010101010</p>
  </div>
  
  <!-- Order Details -->
  <div class="mb-4 text-xs">
    <div class="flex justify-between">
      <span class="arabic">الطلب:</span>
      <span>#{order.orderNumber}</span>
    </div>
    <div class="flex justify-between">
      <span class="arabic">التاريخ:</span>
      <span>{formatDate(order.createdAt)}</span>
    </div>
  </div>
  
  <!-- Items and Totals -->
  <!-- ... -->
  
  <!-- ZATCA QR Code -->
  <div class="text-center mb-4">
    <div class="text-xs arabic mb-2">فاتورة مبسطة - ZATCA</div>
    <div class="text-xs">Invoice: {invoice.invoiceNumber}</div>
    <div class="text-xs">UUID: {invoice.uuid}</div>
    {invoice.zatcaQrBase64 && (
      <div className="mt-2">
        <img
          src={invoice.zatcaQrBase64}
          alt="ZATCA QR Code"
          className="w-20 h-20 mx-auto"
        />
      </div>
    )}
  </div>
</div>
```

## Testing

### Test Data
```typescript
const testZATCAData = {
  sellerName: 'Big Diet Restaurant',
  vatNumber: '123456789012345',
  timestamp: '2025-01-17T20:15:00.000Z',
  total: 31.05,
  vatTotal: 4.05,
  uuid: '550e8400-e29b-41d4-a716-446655440000'
}
```

### Validation Tests
```typescript
describe('ZATCA Compliance', () => {
  test('should generate valid TLV data', () => {
    const tlv = generateZATCATLV(testZATCAData)
    expect(tlv).toMatch(/^01/)
    expect(tlv).toMatch(/^02/)
    expect(tlv).toMatch(/^03/)
    expect(tlv).toMatch(/^04/)
    expect(tlv).toMatch(/^05/)
  })
  
  test('should validate ZATCA data', () => {
    const validation = validateZATCAData(testZATCAData)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })
  
  test('should generate QR code', async () => {
    const qrCode = await generateZATCAQR(testZATCAData)
    expect(qrCode).toMatch(/^data:image\/png;base64,/)
  })
})
```

## Compliance Checklist

### Pre-deployment
- [ ] VAT number is 15 digits
- [ ] CR number is 10 digits
- [ ] Business name in Arabic and English
- [ ] Address in Arabic and English
- [ ] QR code contains all required fields
- [ ] Invoice numbers are unique
- [ ] Timestamps are in ISO 8601 format
- [ ] VAT calculation is accurate (15%)

### Post-deployment
- [ ] Test QR code scanning
- [ ] Verify invoice data accuracy
- [ ] Check receipt formatting
- [ ] Validate Arabic text display
- [ ] Test with ZATCA validation tools
- [ ] Monitor invoice generation
- [ ] Backup invoice data

## Troubleshooting

### Common Issues

1. **QR Code Not Scanning**
   - Check TLV format
   - Verify Base64 encoding
   - Ensure QR code size is adequate
   - Test with different QR scanners

2. **Invalid VAT Number**
   - Verify 15-digit format
   - Check for leading zeros
   - Ensure numeric characters only

3. **Arabic Text Issues**
   - Use UTF-8 encoding
   - Verify font support
   - Test with different devices

4. **Timestamp Format**
   - Use ISO 8601 format
   - Include timezone information
   - Ensure consistent format

### Debug Tools

#### TLV Decoder
```typescript
function decodeTLV(tlvData: string): any {
  const result: any = {}
  let index = 0
  
  while (index < tlvData.length) {
    const tag = tlvData.substring(index, index + 2)
    index += 2
    
    const length = parseInt(tlvData.substring(index, index + 2), 16)
    index += 2
    
    const value = tlvData.substring(index, index + length * 2)
    index += length * 2
    
    result[tag] = Buffer.from(value, 'hex').toString('utf8')
  }
  
  return result
}
```

#### QR Code Validator
```typescript
function validateQRCode(qrCodeDataURL: string): boolean {
  // Extract Base64 data
  const base64Data = qrCodeDataURL.split(',')[1]
  
  try {
    // Decode Base64
    const binaryData = atob(base64Data)
    
    // Convert to hex
    const hexData = Array.from(binaryData)
      .map(byte => byte.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
    
    // Decode TLV
    const tlvData = decodeTLV(hexData)
    
    // Validate required fields
    return tlvData['01'] && tlvData['02'] && tlvData['03'] && tlvData['04'] && tlvData['05']
  } catch (error) {
    return false
  }
}
```

## Best Practices

### 1. Data Integrity
- Validate all input data
- Use server-side validation
- Implement error handling
- Log all invoice generations

### 2. Performance
- Cache QR code generation
- Use efficient encoding
- Optimize image size
- Implement retry logic

### 3. Security
- Validate business credentials
- Secure invoice storage
- Implement access controls
- Audit invoice access

### 4. Compliance
- Regular ZATCA updates
- Monitor regulation changes
- Test with official tools
- Maintain compliance documentation

## Monitoring

### Key Metrics
- Invoice generation success rate
- QR code scan success rate
- Validation error frequency
- Processing time per invoice

### Alerts
- Failed invoice generations
- Invalid QR codes
- Validation errors
- System downtime

### Reports
- Daily invoice summary
- ZATCA compliance report
- Error analysis
- Performance metrics

## Updates and Maintenance

### Regular Tasks
1. **Monitor ZATCA updates** monthly
2. **Test QR codes** weekly
3. **Validate business data** quarterly
4. **Update documentation** as needed
5. **Backup invoice data** daily

### Version Control
- Track ZATCA specification changes
- Maintain backward compatibility
- Test with multiple QR scanners
- Document all changes

### Compliance Audits
- Annual ZATCA compliance review
- Quarterly system testing
- Monthly data validation
- Weekly error monitoring
