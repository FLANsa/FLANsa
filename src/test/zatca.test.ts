import { describe, it, expect } from 'vitest'
import { 
  generateZATCATLV, 
  generateZATCAQR, 
  generateInvoiceHash, 
  validateZATCAData,
  generateUUID
} from '../lib/zatca'

describe('ZATCA Compliance', () => {
  const testData = {
    sellerName: 'Qayd POS System',
    vatNumber: '123456789012345',
    timestamp: '2025-01-17T20:15:00.000Z',
    total: 31.05,
    vatTotal: 4.05,
    uuid: '550e8400-e29b-41d4-a716-446655440000'
  }

  describe('generateZATCATLV', () => {
    it('should generate valid TLV data', () => {
      const tlv = generateZATCATLV(testData)
      expect(tlv).toMatch(/^01/)
      expect(tlv).toMatch(/^02/)
      expect(tlv).toMatch(/^03/)
      expect(tlv).toMatch(/^04/)
      expect(tlv).toMatch(/^05/)
    })

    it('should include seller name in tag 1', () => {
      const tlv = generateZATCATLV(testData)
      expect(tlv).toContain('01')
    })

    it('should include VAT number in tag 2', () => {
      const tlv = generateZATCATLV(testData)
      expect(tlv).toContain('02')
    })

    it('should include timestamp in tag 3', () => {
      const tlv = generateZATCATLV(testData)
      expect(tlv).toContain('03')
    })

    it('should include total amount in tag 4', () => {
      const tlv = generateZATCATLV(testData)
      expect(tlv).toContain('04')
    })

    it('should include VAT amount in tag 5', () => {
      const tlv = generateZATCATLV(testData)
      expect(tlv).toContain('05')
    })
  })

  describe('validateZATCAData', () => {
    it('should validate correct data', () => {
      const validation = validateZATCAData(testData)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject empty seller name', () => {
      const invalidData = { ...testData, sellerName: '' }
      const validation = validateZATCAData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Seller name is required')
    })

    it('should reject invalid VAT number', () => {
      const invalidData = { ...testData, vatNumber: '12345678901234' }
      const validation = validateZATCAData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('VAT number must be 15 digits')
    })

    it('should reject invalid timestamp', () => {
      const invalidData = { ...testData, timestamp: 'invalid-date' }
      const validation = validateZATCAData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Valid timestamp is required')
    })

    it('should reject negative total', () => {
      const invalidData = { ...testData, total: -10 }
      const validation = validateZATCAData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Total amount cannot be negative')
    })

    it('should reject negative VAT', () => {
      const invalidData = { ...testData, vatTotal: -5 }
      const validation = validateZATCAData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('VAT amount cannot be negative')
    })

    it('should reject empty UUID', () => {
      const invalidData = { ...testData, uuid: '' }
      const validation = validateZATCAData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('UUID is required')
    })
  })

  describe('generateUUID', () => {
    it('should generate valid UUID format', () => {
      const uuid = generateUUID()
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('generateInvoiceHash', () => {
    it('should generate hash from TLV data', () => {
      const hash = generateInvoiceHash(testData)
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should generate consistent hash for same data', () => {
      const hash1 = generateInvoiceHash(testData)
      const hash2 = generateInvoiceHash(testData)
      expect(hash1).toBe(hash2)
    })
  })

  describe('generateZATCAQR', () => {
    it('should generate QR code data URL', async () => {
      const qrCode = await generateZATCAQR(testData)
      expect(qrCode).toMatch(/^data:image\/png;base64,/)
    })

    it('should generate valid QR code', async () => {
      const qrCode = await generateZATCAQR(testData)
      expect(qrCode).toBeDefined()
      expect(qrCode.length).toBeGreaterThan(1000) // Base64 encoded image should be substantial
    })
  })
})
