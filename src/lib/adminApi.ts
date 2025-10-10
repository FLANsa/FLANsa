import { auth } from './firebase'

const DEFAULT_FUNCTIONS_BASE = 'https://us-central1-qayd-pos.cloudfunctions.net/adminApi';
function getAdminApiBase(): string {
  const envBase = (import.meta as any)?.env?.VITE_ADMIN_API_BASE as string | undefined;
  if (envBase && envBase.trim()) return envBase.replace(/\/$/, '');
  // If running on Firebase Hosting, the rewrite works with relative /api/admin/
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const isFirebaseHosting = /web\.app$|firebaseapp\.com$/.test(host);
  if (isFirebaseHosting) return '/api/admin';
  // Otherwise (e.g., Render/Vercel), call the Cloud Function directly
  return DEFAULT_FUNCTIONS_BASE;
}

async function authedFetch(path: string, init?: RequestInit) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const token = await user.getIdToken()
  const base = getAdminApiBase()
  const url = `${base}/${path.replace(/^\//, '')}`
  const res = await fetch(url, {
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


