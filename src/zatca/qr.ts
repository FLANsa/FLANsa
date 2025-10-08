export function encodeTLV(pairs: Array<{ tag: number; value: string | Uint8Array }>): Uint8Array {
  const chunks: number[] = []
  const encoder = new TextEncoder()

  for (const { tag, value } of pairs) {
    const valBytes = typeof value === 'string' ? encoder.encode(value) : value
    chunks.push(tag)
    chunks.push(valBytes.length)
    for (const b of valBytes) chunks.push(b)
  }
  return new Uint8Array(chunks)
}

export function tlvToBase64(tlv: Uint8Array): string {
  let binary = ''
  for (const b of tlv) binary += String.fromCharCode(b)
  // eslint-disable-next-line no-undef
  return typeof Buffer !== 'undefined' ? Buffer.from(tlv).toString('base64') : btoa(binary)
}

export function buildInvoiceQRBase64(args: {
  sellerName: string
  vat: string
  isoDateTime: string
  totalWithVat: string
  vatAmount: string
  xmlHashBase64?: string
  signatureDataBase64?: string
}): string {
  const pairs: Array<{ tag: number; value: string | Uint8Array }> = []
  const num = (s: string) => s

  pairs.push({ tag: 1, value: args.sellerName })
  pairs.push({ tag: 2, value: args.vat })
  pairs.push({ tag: 3, value: args.isoDateTime })
  pairs.push({ tag: 4, value: num(args.totalWithVat) })
  pairs.push({ tag: 5, value: num(args.vatAmount) })
  if (args.xmlHashBase64) pairs.push({ tag: 6, value: args.xmlHashBase64 })
  if (args.signatureDataBase64) pairs.push({ tag: 7, value: args.signatureDataBase64 })

  return tlvToBase64(encodeTLV(pairs))
}


