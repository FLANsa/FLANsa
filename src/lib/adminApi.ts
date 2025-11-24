import { auth } from './firebase'
import { adminApiFallback } from './adminApiFallback'

const DEFAULT_FUNCTIONS_BASE = 'https://us-central1-big-diet-restaurant-pos.cloudfunctions.net/adminApi';
let functionsAvailable: boolean | null = null; // null = not checked, true/false = checked

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

// Check if Functions are available
async function checkFunctionsAvailable(): Promise<boolean> {
  if (functionsAvailable !== null) return functionsAvailable;
  
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const isFirebaseHosting = /web\.app$|firebaseapp\.com$/.test(host);
  const isLocalhost = /localhost|127\.0\.0\.1/.test(host);
  
  // On Firebase Hosting or localhost, assume Functions are not available
  // (Firebase Hosting requires Blaze plan, localhost may have CORS issues)
  if (isFirebaseHosting || isLocalhost) {
    functionsAvailable = false;
    return false;
  }
  
  // For other hosts (production with custom domain, etc.), try to check
  try {
    const user = auth.currentUser
    if (!user) {
      functionsAvailable = false;
      return false;
    }
    
    const token = await user.getIdToken()
    const base = getAdminApiBase()
    const testUrl = `${base}/users/test`
    
    // Use AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000) // 1 second timeout
    
    try {
      const res = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // If we get 404, Functions are not deployed
      functionsAvailable = res.status !== 404;
      return functionsAvailable;
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      // Silently handle errors (404, CORS, network, etc.) - they're expected
      if (fetchError.name === 'AbortError' || 
          fetchError.message?.includes('404') || 
          fetchError.message?.includes('CORS') ||
          fetchError.message?.includes('Failed to fetch')) {
        functionsAvailable = false;
        return false;
      }
      throw fetchError
    }
  } catch (error: any) {
    // If any error, assume Functions not available
    functionsAvailable = false;
    return false;
  }
  
  // Default: assume not available
  functionsAvailable = false;
  return false;
}

async function authedFetch(path: string, init?: RequestInit) {
  // Check if Functions are available first
  const available = await checkFunctionsAvailable();
  if (!available) {
    throw new Error('FALLBACK_NEEDED')
  }

  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const token = await user.getIdToken()
  const base = getAdminApiBase()
  const url = `${base}/${path.replace(/^\//, '')}`
  
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {})
      }
    })
    
    if (!res.ok) {
      // If 404, Functions might not be deployed
      if (res.status === 404) {
        functionsAvailable = false;
        throw new Error('FALLBACK_NEEDED')
      }
      const text = await res.text().catch(() => '')
      throw new Error(text || `HTTP ${res.status}`)
    }
    return res.json()
  } catch (error: any) {
    // If fetch fails completely (network error, CORS, etc.)
    if (error.message?.includes('Failed to fetch') || error.message?.includes('404') || error.message === 'FALLBACK_NEEDED') {
      functionsAvailable = false;
      throw new Error('FALLBACK_NEEDED')
    }
    throw error
  }
}

async function tryWithFallback<T>(fn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
  // If Functions are not available, use fallback directly
  const available = await checkFunctionsAvailable();
  if (!available) {
    // Silently use fallback - no console warning needed
    return await fallbackFn()
  }
  
  try {
    return await fn()
  } catch (error: any) {
    if (error.message === 'FALLBACK_NEEDED' || error.message?.includes('404') || error.message?.includes('Failed to fetch') || error.message?.includes('Page not found')) {
      // Silently use fallback - no console warning needed
      try {
        return await fallbackFn()
      } catch (fallbackError: any) {
        console.error('❌ Fallback failed:', fallbackError)
        throw fallbackError
      }
    }
    throw error
  }
}

export const adminApi = {
  // Users
  async createUser(payload: { email: string; password?: string; name?: string; role?: string; tenantId: string; isActive?: boolean }) {
    return tryWithFallback(
      () => authedFetch('users', { method: 'POST', body: JSON.stringify(payload) }),
      () => adminApiFallback.createUser(payload)
    )
  },
  async listUsers(tenantId?: string) {
    return tryWithFallback(
      () => {
        const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''
        return authedFetch(`users${qs}`, { method: 'GET' })
      },
      () => adminApiFallback.listUsers(tenantId)
    )
  },
  async updateUser(uid: string, payload: { role?: string; isActive?: boolean }) {
    return tryWithFallback(
      () => authedFetch(`users/${uid}`, { method: 'PATCH', body: JSON.stringify(payload) }),
      () => adminApiFallback.updateUser(uid, payload)
    )
  },
  async deleteUser(uid: string) {
    return tryWithFallback(
      () => authedFetch(`users/${uid}`, { method: 'DELETE' }),
      () => adminApiFallback.deleteUser(uid)
    )
  },
  async testAuth() {
    return authedFetch('users/test', { method: 'POST' })
  },

  // Tenants
  async createTenant(payload: any) {
    return tryWithFallback(
      () => authedFetch('tenants', { method: 'POST', body: JSON.stringify(payload) }),
      () => adminApiFallback.createTenant(payload)
    )
  },
  async listTenants() {
    return tryWithFallback(
      () => authedFetch('tenants', { method: 'GET' }),
      () => adminApiFallback.listTenants()
    )
  },
  async getTenant(tenantId: string) {
    return authedFetch(`tenants/${tenantId}`, { method: 'GET' })
  },
  async updateTenantSettings(tenantId: string, settings: any) {
    return authedFetch(`tenants/${tenantId}/settings`, { method: 'PUT', body: JSON.stringify(settings) })
  },

  // Stats
  async getSystemStats() {
    return tryWithFallback(
      () => authedFetch('stats', { method: 'GET' }),
      () => adminApiFallback.getSystemStats()
    )
  }
}


