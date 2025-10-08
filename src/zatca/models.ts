export interface Seller {
  nameAr?: string
  nameEn: string
  vatNumber: string
  crNumber?: string
  addressAr?: string
  addressEn?: string
  country: 'SA'
}

export interface Buyer {
  nameAr?: string
  nameEn?: string
  vatNumber?: string
}

export interface InvoiceLine {
  nameAr: string
  nameEn: string
  quantity: number
  unitPrice: number
  vatRate: number // e.g. 15
}

export interface TaxTotal {
  taxableAmount: number
  taxAmount: number
}

export interface LegalMonetaryTotal {
  lineExtensionAmount: number
  taxExclusiveAmount: number
  taxInclusiveAmount: number
  payableAmount: number
}

export interface SimplifiedInvoice {
  uuid: string
  invoiceNumber: string
  issueDateTime: string // ISO with timezone Asia/Riyadh
  invoiceTypeCode: 388
  currency: 'SAR'
  lines: InvoiceLine[]
  summary: {
    subtotal: number
    taxAmount: number
    taxInclusiveAmount: number
  }
  // Phase-2 fields
  icv?: number
  previousInvoiceHash?: string
  qrBase64?: string
  signatureAttached?: boolean
  buyer?: Buyer
}


