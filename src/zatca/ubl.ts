import { SimplifiedInvoice, Seller } from './models'

const PROFILE_ID = 'reporting:1.0' // TODO: confirm official value
const CUSTOMIZATION_ID = 'urn:sa:qayd-pos:invoice:1.0' // TODO: confirm official value

export function buildSimplifiedInvoiceXML(inv: SimplifiedInvoice, seller: Seller, opts: { includeSignature?: boolean } = {}): string {
  const vat = seller.vatNumber
  const sellerName = seller.nameAr || seller.nameEn

  const linesXml = inv.lines.map((line, index) => {
    const lineTotalExTax = (line.unitPrice * line.quantity) / (1 + line.vatRate / 100)
    const lineTax = (line.unitPrice * line.quantity) - lineTotalExTax
    const unitExTax = line.unitPrice / (1 + line.vatRate / 100)

    return `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${lineTotalExTax.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${line.nameAr}</cbc:Description>
      <cbc:Name>${line.nameEn}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${line.vatRate}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="SAR">${unitExTax.toFixed(2)}</cbc:PriceAmount></cac:Price>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${lineTax.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="SAR">${lineTotalExTax.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="SAR">${lineTax.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${line.vatRate}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </cac:InvoiceLine>`
  }).join('')

  const icvRef = inv.icv != null ? `
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID><cbc:UUID>${inv.icv}</cbc:UUID>
  </cac:AdditionalDocumentReference>` : ''

  const pihRef = inv.previousInvoiceHash ? `
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID><cbc:UUID>${inv.previousInvoiceHash}</cbc:UUID>
  </cac:AdditionalDocumentReference>` : ''

  const qrRef = inv.qrBase64 ? `
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${inv.qrBase64}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>` : ''

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${CUSTOMIZATION_ID}</cbc:CustomizationID>
  <cbc:ProfileID>${PROFILE_ID}</cbc:ProfileID>
  <cbc:ID>${inv.invoiceNumber}</cbc:ID>
  <cbc:UUID>${inv.uuid}</cbc:UUID>
  <cbc:IssueDate>${inv.issueDateTime.slice(0,10)}</cbc:IssueDate>
  <cbc:IssueTime>${inv.issueDateTime.slice(11,19)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${inv.currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${inv.currency}</cbc:TaxCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="VAT">${vat}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${sellerName}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:Country><cbc:IdentificationCode>${seller.countryCode}</cbc:IdentificationCode></cbc:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingSupplierParty>
  ${qrRef}
  ${icvRef}
  ${pihRef}
  ${linesXml}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${inv.summary.taxAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${inv.summary.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${inv.summary.taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>15</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${inv.summary.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${inv.summary.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${inv.summary.taxInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${inv.summary.taxInclusiveAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`

  return xml
}

export function injectQrIntoSignedXml(signedXml: string, qrBase64: string): string {
  // naive inject: replace or insert QR AdditionalDocumentReference
  if (signedXml.includes('<cbc:ID>QR</cbc:ID>')) {
    return signedXml.replace(/<cbc:ID>QR<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/, `
    <cbc:ID>QR<\/cbc:ID>
    <cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text\/plain">${qrBase64}<\/cbc:EmbeddedDocumentBinaryObject><\/cac:Attachment>
  <\/cac:AdditionalDocumentReference>`)
  }
  // insert before closing Invoice
  return signedXml.replace(/<\/Invoice>$/, `
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR<\/cbc:ID>
    <cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text\/plain">${qrBase64}<\/cbc:EmbeddedDocumentBinaryObject><\/cac:Attachment>
  <\/cac:AdditionalDocumentReference>
<\/Invoice>`) 
}


