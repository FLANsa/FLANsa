// Minimal in-memory fallback; replace with Firestore/DB implementation
const icvStore = new Map<string, number>()
const pihStore = new Map<string, string>()

function key(tenantId: string, egsUnitId: string): string {
  return `${tenantId}:${egsUnitId}`
}

export async function getNextICV(tenantId: string, egsUnitId: string): Promise<number> {
  const k = key(tenantId, egsUnitId)
  const next = (icvStore.get(k) || 0) + 1
  icvStore.set(k, next)
  return next
}

export async function getPreviousInvoiceHash(tenantId: string, egsUnitId: string): Promise<string> {
  const k = key(tenantId, egsUnitId)
  return pihStore.get(k) || '0000000000000000000000000000000000000000000000000000000000000000'
}

export async function setPreviousInvoiceHash(tenantId: string, egsUnitId: string, currentXmlHashBase64: string): Promise<void> {
  const k = key(tenantId, egsUnitId)
  pihStore.set(k, currentXmlHashBase64)
}


