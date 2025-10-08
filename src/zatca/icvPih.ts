// Firestore-backed with in-memory fallback
import { db } from '../lib/firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const icvStore = new Map<string, number>()
const pihStore = new Map<string, string>()

function key(tenantId: string, egsUnitId: string): string {
  return `${tenantId}:${egsUnitId}`
}

export async function getNextICV(tenantId: string, egsUnitId: string): Promise<number> {
  const k = key(tenantId, egsUnitId)
  try {
    const ref = doc(db, 'zatca_state', k)
    const snap = await getDoc(ref)
    const current = snap.exists() ? (snap.data().icv as number || 0) : 0
    const next = current + 1
    if (snap.exists()) {
      await updateDoc(ref, { icv: next, updatedAt: serverTimestamp() })
    } else {
      await setDoc(ref, { tenantId, egsUnitId, icv: next, updatedAt: serverTimestamp() })
    }
    icvStore.set(k, next)
    return next
  } catch {
    const next = (icvStore.get(k) || 0) + 1
    icvStore.set(k, next)
    return next
  }
}

export async function getPreviousInvoiceHash(tenantId: string, egsUnitId: string): Promise<string> {
  const k = key(tenantId, egsUnitId)
  try {
    const ref = doc(db, 'zatca_state', k)
    const snap = await getDoc(ref)
    if (snap.exists() && snap.data().pih) {
      const v = snap.data().pih as string
      pihStore.set(k, v)
      return v
    }
  } catch { /* ignore */ }
  return pihStore.get(k) || '0000000000000000000000000000000000000000000000000000000000000000'
}

export async function setPreviousInvoiceHash(tenantId: string, egsUnitId: string, currentXmlHashBase64: string): Promise<void> {
  const k = key(tenantId, egsUnitId)
  pihStore.set(k, currentXmlHashBase64)
  try {
    const ref = doc(db, 'zatca_state', k)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      await updateDoc(ref, { pih: currentXmlHashBase64, updatedAt: serverTimestamp() })
    } else {
      await setDoc(ref, { tenantId, egsUnitId, icv: 1, pih: currentXmlHashBase64, updatedAt: serverTimestamp() })
    }
  } catch { /* ignore */ }
}


