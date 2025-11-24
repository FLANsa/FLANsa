// Fallback Admin API using Firestore directly when Functions are not available
import { auth } from './firebase'
import { tenantService, userService } from './firebaseServices'
import { firebaseConfig } from './firebaseConfig'

// Helper to check if user has admin permissions
async function checkAdminPermission(): Promise<boolean> {
  const user = auth.currentUser
  if (!user) return false
  
  try {
    const token = await user.getIdTokenResult()
    const role = (token.claims as any).role
    const email = (user.email || '').toLowerCase()
    return role === 'owner' || role === 'admin' || email === 'admin@bigdiet.com' || email === 'admin@qayd.com'
  } catch {
    return false
  }
}

export const adminApiFallback = {
  // Tenants
  async listTenants() {
    if (!(await checkAdminPermission())) {
      throw new Error('غير مصرح - يجب أن تكون admin أو owner')
    }
    const tenants = await tenantService.getTenants()
    return { ok: true, tenants }
  },

  async createTenant(payload: any) {
    if (!(await checkAdminPermission())) {
      throw new Error('غير مصرح - يجب أن تكون admin أو owner')
    }
    const tenantId = await tenantService.createTenant({
      name: payload.name || '',
      nameAr: payload.nameAr || '',
      email: payload.email || '',
      phone: payload.phone || '',
      address: payload.address || '',
      addressAr: payload.addressAr || '',
      vatNumber: payload.vatNumber || '',
      crNumber: payload.crNumber || '',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: payload.isActive !== false
    })
    return { ok: true, id: tenantId }
  },

  // Users - Note: Creating users requires Firebase Admin SDK, so this is limited
  async listUsers(tenantId?: string) {
    if (!(await checkAdminPermission())) {
      throw new Error('غير مصرح - يجب أن تكون admin أو owner')
    }
    const users = tenantId 
      ? await userService.getUsersByTenant(tenantId)
      : await userService.getUsers()
    return { ok: true, users }
  },

  // Create user using Firebase REST API (won't sign them in automatically)
  // Note: Custom claims (role, tenantId) cannot be set from Client SDK
  // They need to be set manually via Firebase Console or Functions later
  async createUser(payload: { email: string; password?: string; name?: string; role?: string; tenantId: string; isActive?: boolean }) {
    if (!(await checkAdminPermission())) {
      throw new Error('غير مصرح - يجب أن تكون admin أو owner')
    }

    if (!payload.email || !payload.tenantId) {
      throw new Error('البريد الإلكتروني والمتجر مطلوبان')
    }

    if (!payload.password || payload.password.length < 6) {
      throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    }

    // Verify current user is logged in
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('يجب تسجيل الدخول أولاً')
    }

    try {
      // Use Firebase REST API to create user without signing them in
      const apiKey = firebaseConfig.apiKey
      const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`
      
      const response = await fetch(signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          returnSecureToken: false // Don't return token, so user won't be signed in
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific errors
        if (data.error?.message?.includes('EMAIL_EXISTS') || data.error?.message?.includes('email-already-in-use')) {
          throw new Error('البريد الإلكتروني مستخدم بالفعل')
        } else if (data.error?.message?.includes('INVALID_EMAIL')) {
          throw new Error('البريد الإلكتروني غير صحيح')
        } else if (data.error?.message?.includes('WEAK_PASSWORD')) {
          throw new Error('كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل)')
        } else if (data.error?.message?.includes('OPERATION_NOT_ALLOWED')) {
          throw new Error('إنشاء المستخدمين غير مفعّل في Firebase Authentication. يرجى تفعيله من Firebase Console.')
        } else {
          throw new Error(`خطأ في إنشاء المستخدم: ${data.error?.message || 'خطأ غير معروف'}`)
        }
      }

      // Extract user ID from response
      // Note: REST API returns localId as the user ID
      const newUserId = data.localId || data.uid

      if (!newUserId) {
        throw new Error('فشل في الحصول على معرف المستخدم الجديد')
      }

      // Create user document in Firestore with role and tenantId
      // Note: These won't be in custom claims, but will be in Firestore
      await userService.createUser({
        id: newUserId,
        tenantId: payload.tenantId,
        name: payload.name || '',
        email: payload.email,
        role: (payload.role as 'admin' | 'manager' | 'cashier') || 'cashier',
        isActive: payload.isActive !== false,
        createdAt: null,
        updatedAt: null
      })

      // Current user session is maintained - no need to re-authenticate
      return { 
        ok: true, 
        uid: newUserId,
        message: 'تم إنشاء المستخدم بنجاح'
      }
    } catch (error: any) {
      // Handle network errors or other issues
      if (error.message && !error.message.includes('البريد') && !error.message.includes('كلمة المرور') && !error.message.includes('مفعّل')) {
        throw new Error(`خطأ في إنشاء المستخدم: ${error.message || 'خطأ غير معروف'}`)
      }
      throw error
    }
  },

  async updateUser(uid: string, payload: any) {
    if (!(await checkAdminPermission())) {
      throw new Error('غير مصرح - يجب أن تكون admin أو owner')
    }
    await userService.updateUser(uid, payload)
    return { ok: true }
  },

  async deleteUser(uid: string) {
    throw new Error('حذف المستخدمين يتطلب Firebase Functions. يرجى ترقية المشروع إلى Blaze plan.')
  },

  async getSystemStats() {
    if (!(await checkAdminPermission())) {
      throw new Error('غير مصرح - يجب أن تكون admin أو owner')
    }
    // Basic stats from Firestore
    const tenants = await tenantService.getTenants()
    const users = await userService.getUsers()
    
    return {
      ok: true,
      totals: {
        tenants: tenants.length,
        users: users.length,
        activeTenants: tenants.filter(t => t.isActive).length,
        activeUsers: users.filter(u => u.isActive).length
      }
    }
  }
}

