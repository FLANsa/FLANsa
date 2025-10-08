import { describe, it, expect } from 'vitest'
import { buildSimplifiedInvoiceXML } from '../ubl'
import { SimplifiedInvoice, Seller } from '../models'

describe('ZATCA UBL XML Generation', () => {
  const mockSeller: Seller = {
    vatNumber: '300000000000003',
    nameAr: 'مطعم قيد',
    nameEn: 'Qayd Restaurant',
    country: 'SA',
    addressAr: 'الرياض، المملكة العربية السعودية'
  }

  const mockInvoice: SimplifiedInvoice = {
    uuid: 'test-uuid-123',
    issueDateTime: '2024-01-15T10:30:00Z',
    invoiceNumber: 'INV-001',
    invoiceTypeCode: 388,
    currency: 'SAR',
    items: [
      {
        nameAr: 'برجر',
        nameEn: 'Burger',
        quantity: 2,
        unitPrice: 25.00,
        lineTotal: 50.00,
        vatRate: 0.15,
        vatAmount: 7.50
      }
    ],
    summary: {
      lineTotal: 50.00,
      taxAmount: 7.50,
      taxInclusiveAmount: 57.50
    },
    icv: 1,
    previousInvoiceHash: 'ZATCA_SEED_HASH',
    qrBase64: 'dGVzdA==', // base64 for 'test'
    signatureAttached: false
  }

  describe('buildSimplifiedInvoiceXML', () => {
    it('should generate valid UBL XML structure', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<Invoice')
      expect(xml).toContain('xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"')
      expect(xml).toContain('xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"')
      expect(xml).toContain('xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"')
    })

    it('should include correct ProfileID and CustomizationID', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain('<cbc:ProfileID>reporting:1.0</cbc:ProfileID>')
      expect(xml).toContain('<cbc:CustomizationID>urn:sa:qayd-pos:invoice:1.0</cbc:CustomizationID>')
    })

    it('should include invoice basic information', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain(`<cbc:ID>${mockInvoice.invoiceNumber}</cbc:ID>`)
      expect(xml).toContain(`<cbc:UUID>${mockInvoice.uuid}</cbc:UUID>`)
      expect(xml).toContain(`<cbc:IssueDate>2024-01-15</cbc:IssueDate>`)
      expect(xml).toContain(`<cbc:IssueTime>10:30:00</cbc:IssueTime>`)
      expect(xml).toContain(`<cbc:InvoiceTypeCode>388</cbc:InvoiceTypeCode>`)
    })

    it('should include seller information', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain(`<cbc:ID>${mockSeller.vatNumber}</cbc:ID>`)
      expect(xml).toContain(`<cbc:Name>${mockSeller.nameAr}</cbc:Name>`)
      expect(xml).toContain(`<cbc:RegistrationName>${mockSeller.nameAr}</cbc:RegistrationName>`)
    })

    it('should include AdditionalDocumentReference for ICV', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain('<cac:AdditionalDocumentReference>')
      expect(xml).toContain('<cbc:ID>ICV</cbc:ID>')
      expect(xml).toContain(`<cbc:UUID>${mockInvoice.icv}</cbc:UUID>`)
      expect(xml).toContain('</cac:AdditionalDocumentReference>')
    })

    it('should include AdditionalDocumentReference for PIH', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain('<cac:AdditionalDocumentReference>')
      expect(xml).toContain('<cbc:ID>PIH</cbc:ID>')
      expect(xml).toContain(`<cbc:UUID>${mockInvoice.previousInvoiceHash}</cbc:UUID>`)
      expect(xml).toContain('</cac:AdditionalDocumentReference>')
    })

    it('should include AdditionalDocumentReference for QR', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain('<cac:AdditionalDocumentReference>')
      expect(xml).toContain('<cbc:ID>QR</cbc:ID>')
      expect(xml).toContain('<cac:Attachment>')
      expect(xml).toContain('<cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">')
      expect(xml).toContain(mockInvoice.qrBase64)
      expect(xml).toContain('</cbc:EmbeddedDocumentBinaryObject>')
      expect(xml).toContain('</cac:Attachment>')
      expect(xml).toContain('</cac:AdditionalDocumentReference>')
    })

    it('should include invoice lines', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain('<cac:InvoiceLine>')
      expect(xml).toContain(`<cbc:ID>1</cbc:ID>`)
      expect(xml).toContain(`<cbc:InvoicedQuantity unitCode="EA">${mockInvoice.items[0].quantity}</cbc:InvoicedQuantity>`)
      expect(xml).toContain(`<cbc:LineExtensionAmount currencyID="SAR">${mockInvoice.items[0].lineTotal.toFixed(2)}</cbc:LineExtensionAmount>`)
    })

    it('should include tax totals', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain('<cac:TaxTotal>')
      expect(xml).toContain(`<cbc:TaxAmount currencyID="SAR">${mockInvoice.summary.taxAmount.toFixed(2)}</cbc:TaxAmount>`)
      expect(xml).toContain('<cac:TaxSubtotal>')
      expect(xml).toContain('<cbc:TaxableAmount currencyID="SAR">50.00</cbc:TaxableAmount>')
      expect(xml).toContain('<cbc:TaxAmount currencyID="SAR">7.50</cbc:TaxAmount>')
      expect(xml).toContain('<cbc:Percent>15</cbc:Percent>')
    })

    it('should include legal monetary totals', () => {
      const xml = buildSimplifiedInvoiceXML(mockInvoice, mockSeller, {})

      expect(xml).toContain('<cac:LegalMonetaryTotal>')
      expect(xml).toContain(`<cbc:LineExtensionAmount currencyID="SAR">${mockInvoice.summary.lineTotal.toFixed(2)}</cbc:LineExtensionAmount>`)
      expect(xml).toContain(`<cbc:TaxInclusiveAmount currencyID="SAR">${mockInvoice.summary.taxInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>`)
    })

    it('should handle multiple invoice lines', () => {
      const multiItemInvoice = {
        ...mockInvoice,
        items: [
          {
            nameAr: 'برجر',
            nameEn: 'Burger',
            quantity: 1,
            unitPrice: 25.00,
            lineTotal: 25.00,
            vatRate: 0.15,
            vatAmount: 3.75
          },
          {
            nameAr: 'بطاطس',
            nameEn: 'Fries',
            quantity: 2,
            unitPrice: 10.00,
            lineTotal: 20.00,
            vatRate: 0.15,
            vatAmount: 3.00
          }
        ],
        summary: {
          lineTotal: 45.00,
          taxAmount: 6.75,
          taxInclusiveAmount: 51.75
        }
      }

      const xml = buildSimplifiedInvoiceXML(multiItemInvoice, mockSeller, {})

      expect(xml).toContain('<cbc:ID>1</cbc:ID>')
      expect(xml).toContain('<cbc:ID>2</cbc:ID>')
      expect(xml).toContain('<cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>')
      expect(xml).toContain('<cbc:InvoicedQuantity unitCode="EA">2</cbc:InvoicedQuantity>')
    })
  })
})