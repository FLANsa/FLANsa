export function validateSimplifiedInvoiceXml(xml: string): void {
  if (!xml.includes('<cbc:CustomizationID>')) throw new Error('Missing CustomizationID')
  if (!xml.includes('<cbc:ProfileID>')) throw new Error('Missing ProfileID')
  if (!xml.includes('<cbc:ID>')) throw new Error('Missing invoice ID')
  if (!xml.includes('<cbc:UUID>')) throw new Error('Missing UUID')
  if (!xml.includes('<cbc:InvoiceTypeCode')) throw new Error('Missing InvoiceTypeCode')
  if (!xml.includes('<cac:AdditionalDocumentReference')) throw new Error('Missing AdditionalDocumentReference')
}


