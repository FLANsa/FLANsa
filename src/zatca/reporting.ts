export async function reportSimplifiedInvoice(xml: string): Promise<{ accepted: boolean, statusCode: number, body: any }> {
  try {
    const endpoint = (typeof window === 'undefined')
      ? (process.env.ZATCA_REPORTING_URL as string)
      : (import.meta.env.VITE_ZATCA_REPORTING_URL as string)

    const base64Xml = typeof Buffer !== 'undefined' ? Buffer.from(xml, 'utf8').toString('base64') : btoa(xml)
    const payload = {
      uuid: 'TEMP_UUID',
      invoiceHash: 'TEMP_HASH',
      invoiceXMLBase64: base64Xml
    }

    // client should call backend proxy; here just call server route if available
    const proxyUrl = '/api/zatca/reporting'
    const resp = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const body = await resp.json().catch(() => ({}))
    return { accepted: resp.ok, statusCode: resp.status, body }
  } catch (e: any) {
    return { accepted: false, statusCode: 0, body: { error: e?.message || 'report error' } }
  }
}


