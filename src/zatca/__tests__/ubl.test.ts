import { describe, it, expect } from 'vitest'
import { buildSimplifiedInvoiceXML } from '../../zatca/ubl'

describe('UBL XML', () => {
  it('includes QR and ICV/PIH references when provided', () => {
    const xml = buildSimplifiedInvoiceXML({
      uuid: 'u',
      invoiceNumber: 'INV-1',
      issueDateTime: '2024-01-01T12:00:00Z',
      invoiceTypeCode: 388,
      currency: 'SAR',
      lines: [],
      summary: { subtotal: 100, taxAmount: 15, taxInclusiveAmount: 115 },
      icv: 2,
      previousInvoiceHash: '00',
      qrBase64: 'AA=='
    }, {
      nameEn: 'Seller',
      vatNumber: '300000000000003',
      countryCode: 'SA'
    })
    expect(xml).toContain('<cbc:ID>QR</cbc:ID>')
    expect(xml).toContain('<cbc:ID>ICV</cbc:ID>')
    expect(xml).toContain('<cbc:ID>PIH</cbc:ID>')
  })
})


