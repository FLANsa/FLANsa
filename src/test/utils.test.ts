import { describe, it, expect } from 'vitest'
import { 
  formatCurrency, 
  formatNumber, 
  calculateVAT, 
  roundToTwoDecimals,
  generateOrderNumber,
  generateInvoiceNumber,
  isValidEmail,
  isValidSaudiPhone,
  isValidVATNumber,
  isValidCRNumber
} from '../lib/utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(31.05)).toBe('٣١٫٠٥ ر.س')
      expect(formatCurrency(0)).toBe('٠٫٠٠ ر.س')
      expect(formatCurrency(1000)).toBe('١٬٠٠٠٫٠٠ ر.س')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with Arabic numerals', () => {
      expect(formatNumber(1234)).toBe('١٬٢٣٤')
      expect(formatNumber(0)).toBe('٠')
    })
  })

  describe('calculateVAT', () => {
    it('should calculate 15% VAT correctly', () => {
      expect(calculateVAT(100)).toBe(15)
      expect(calculateVAT(27)).toBe(4.05)
      expect(calculateVAT(0)).toBe(0)
    })
  })

  describe('roundToTwoDecimals', () => {
    it('should round to two decimal places', () => {
      expect(roundToTwoDecimals(31.055)).toBe(31.06)
      expect(roundToTwoDecimals(31.054)).toBe(31.05)
      expect(roundToTwoDecimals(31)).toBe(31)
    })
  })

  describe('generateOrderNumber', () => {
    it('should generate order number with correct format', () => {
      const orderNumber = generateOrderNumber()
      expect(orderNumber).toMatch(/^A\d{8}$/)
    })
  })

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number with correct format', () => {
      const invoiceNumber = generateInvoiceNumber()
      expect(invoiceNumber).toMatch(/^\d{14}$/)
    })
  })

  describe('isValidEmail', () => {
    it('should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidSaudiPhone', () => {
    it('should validate Saudi phone numbers', () => {
      expect(isValidSaudiPhone('+966501234567')).toBe(true)
      expect(isValidSaudiPhone('0501234567')).toBe(true)
      expect(isValidSaudiPhone('501234567')).toBe(true)
      expect(isValidSaudiPhone('123456789')).toBe(false)
    })
  })

  describe('isValidVATNumber', () => {
    it('should validate VAT numbers', () => {
      expect(isValidVATNumber('123456789012345')).toBe(true)
      expect(isValidVATNumber('12345678901234')).toBe(false)
      expect(isValidVATNumber('1234567890123456')).toBe(false)
      expect(isValidVATNumber('12345678901234a')).toBe(false)
    })
  })

  describe('isValidCRNumber', () => {
    it('should validate CR numbers', () => {
      expect(isValidCRNumber('1010101010')).toBe(true)
      expect(isValidCRNumber('101010101')).toBe(false)
      expect(isValidCRNumber('10101010101')).toBe(false)
      expect(isValidCRNumber('101010101a')).toBe(false)
    })
  })
})
