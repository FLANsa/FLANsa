// Server-side XAdES B-B signing via API
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

export async function signXmlXadesB(xml: string, _pfxBase64?: string, _password?: string): Promise<{ signedXml: string, dsigDigestBase64: string }> {
  try {
    // Call server-side signing endpoint (pfx/password read from server .env)
    const response = await fetch('/api/zatca/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xml })
    })
    
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.message || 'Server signing failed')
    }
    
    return {
      signedXml: result.signedXml,
      dsigDigestBase64: result.dsigDigestBase64
    }
  } catch (error: any) {
    console.error('Client-side signing error:', error)
    throw new Error(`Signing failed: ${error.message}`)
  }
}


