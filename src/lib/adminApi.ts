import { auth } from './firebase'

async function authedFetch(path: string, init?: RequestInit) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const token = await user.getIdToken()
  const res = await fetch(`/api/admin/${path.replace(/^\//, '')}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {})
    }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const adminApi = {
  // Users
  createUser(payload: { email: string; password?: string; name?: string; role?: string; tenantId: string; isActive?: boolean }) {
    return authedFetch('users', { method: 'POST', body: JSON.stringify(payload) })
  },
  updateUser(uid: string, payload: { role?: string; isActive?: boolean }) {
    return authedFetch(`users/${uid}`, { method: 'PATCH', body: JSON.stringify(payload) })
  },
  deleteUser(uid: string) {
    return authedFetch(`users/${uid}`, { method: 'DELETE' })
  },
  testAuth() {
    return authedFetch('users/test', { method: 'POST' })
  },

  // Tenants
  createTenant(payload: any) {
    return authedFetch('tenants', { method: 'POST', body: JSON.stringify(payload) })
  },
  listTenants() {
    return authedFetch('tenants', { method: 'GET' })
  },
  getTenant(tenantId: string) {
    return authedFetch(`tenants/${tenantId}`, { method: 'GET' })
  },
  updateTenantSettings(tenantId: string, settings: any) {
    return authedFetch(`tenants/${tenantId}/settings`, { method: 'PUT', body: JSON.stringify(settings) })
  },

  // Stats
  getSystemStats() {
    return authedFetch('stats', { method: 'GET' })
  }
}


