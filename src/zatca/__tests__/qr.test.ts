import { describe, it, expect } from 'vitest'
import { buildInvoiceQRBase64 } from '../../zatca/qr'

describe('QR TLV', () => {
  it('builds base64 with required fields', () => {
    const b64 = buildInvoiceQRBase64({
      sellerName: 'قيد',
      vat: '300000000000003',
      isoDateTime: '2024-01-01T12:00:00Z',
      totalWithVat: '115.00',
      vatAmount: '15.00'
    })
    expect(typeof b64).toBe('string')
    expect(b64.length).toBeGreaterThan(10)
  })
})


