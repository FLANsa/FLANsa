// NOTE: This is a placeholder API for XAdES B-B signing.
// Integrate xadesjs or xml-crypto with WebCrypto in server-side code.

export function sha256Base64(input: string | Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(input)
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(buf).digest('base64')
  } else {
    // eslint-disable-next-line no-undef
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
    // eslint-disable-next-line no-undef
    return btoa(String.fromCharCode(...bytes))
  }
}

export async function signXmlXadesB(xml: string, pfxBase64: string, password: string): Promise<{ signedXml: string, dsigDigestBase64: string }> {
  // TODO: Implement real XAdES B-B signing using PFX on server side only
  // For now, return the same XML with a placeholder Signature node and digest
  const digest = sha256Base64(xml)
  const signedXml = xml.replace(/<Invoice[\s\S]*?>/, (open) => open + `\n  <cac:Signature>\n    <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice<\/cbc:ID>\n  <\/cac:Signature>\n`)
  return { signedXml, dsigDigestBase64: digest }
}


