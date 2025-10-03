import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth
} from 'firebase/auth'
import { auth } from './firebase'
import { userService, tenantService, settingsService, User, Tenant } from './firebaseServices'

export interface AuthUser extends User {
  firebaseUser: FirebaseUser
  tenant?: Tenant
}

class AuthService {
  private currentUser: AuthUser | null = null
  private authStateListeners: ((user: AuthUser | null) => void)[] = []

  constructor() {
    // Listen to auth state changes
    console.log('[AuthService] Setting up onAuthStateChanged listener')
    onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[onAuthStateChanged] Called with Firebase user =', firebaseUser?.uid || null)
      console.log('[onAuthStateChanged] Firebase user email =', firebaseUser?.email || null)
      
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          console.log('[onAuthStateChanged] Getting user data from Firestore for UID:', firebaseUser.uid)
          const userData = await userService.getUser(firebaseUser.uid)
          console.log('[onAuthStateChanged] User data from Firestore:', userData)
          
          if (userData) {
            // Get tenant data if user has tenantId
            let tenantData: Tenant | undefined
            if (userData.tenantId) {
              console.log('[onAuthStateChanged] Getting tenant data for tenantId:', userData.tenantId)
              const tenant = await tenantService.getTenant(userData.tenantId)
              tenantData = tenant || undefined
              console.log('[onAuthStateChanged] Tenant data:', tenantData)
            }
            
            this.currentUser = {
              ...userData,
              firebaseUser,
              tenant: tenantData
            }
            console.log('[onAuthStateChanged] Current user set to:', this.currentUser)
          } else {
            console.log('[onAuthStateChanged] No user data found in Firestore, creating default user data')
            // Create unique tenant for this user
            const uniqueTenantId = `tenant_${firebaseUser.uid}`
            
            // Create default user data instead of signing out
            this.currentUser = {
              id: firebaseUser.uid,
              tenantId: uniqueTenantId,
              name: 'مستخدم',
              email: firebaseUser.email || '',
              role: 'cashier',
              isActive: true,
              createdAt: null,
              updatedAt: null,
              firebaseUser,
              tenant: {
                id: uniqueTenantId,
                name: 'My Store',
                nameAr: 'متجري',
                email: firebaseUser.email || '',
                phone: '+966 11 123 4567',
                address: 'Riyadh, Saudi Arabia',
                addressAr: 'الرياض، المملكة العربية السعودية',
                vatNumber: '123456789012345',
                crNumber: '1010101010',
                subscriptionPlan: 'basic' as const,
                subscriptionStatus: 'active' as const,
                subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true,
                createdAt: null,
                updatedAt: null
              }
            }
            console.log('[onAuthStateChanged] Created default user data:', this.currentUser)
          }
        } catch (error) {
          console.error('[onAuthStateChanged] Error fetching user data:', error)
          this.currentUser = null
        }
      } else {
        console.log('[onAuthStateChanged] No Firebase user, setting currentUser to null')
        this.currentUser = null
      }

      // Notify all listeners
      console.log('[onAuthStateChanged] Notifying', this.authStateListeners.length, 'auth state listeners')
      this.authStateListeners.forEach((listener, index) => {
        console.log(`[onAuthStateChanged] Calling listener ${index} with user:`, this.currentUser)
        listener(this.currentUser)
      })
    })
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      console.log('Attempting to sign in with:', email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Firebase Auth successful, user ID:', userCredential.user.uid)
      
      // Create user data if not exists (for demo purposes)
      let userData = await userService.getUser(userCredential.user.uid)
      console.log('User data from Firestore:', userData)
      
      if (!userData) {
        console.log('Creating new user data...')
        // Create user data based on email
        const role = email.includes('admin') ? 'admin' : 
                    email.includes('manager') ? 'manager' : 'cashier'
        const name = email.includes('admin') ? 'مدير النظام' :
                    email.includes('manager') ? 'مدير المحل' : 'كاشير'
        
        // Create unique tenant for each new user
        const uniqueTenantId = `tenant_${userCredential.user.uid}`
        
        // Create tenant data for this user
        const tenantData = {
          id: uniqueTenantId,
          name: `${name}'s Store`,
          nameAr: `متجر ${name}`,
          email: userCredential.user.email || '',
          phone: '+966 11 123 4567',
          address: 'Riyadh, Saudi Arabia',
          addressAr: 'الرياض، المملكة العربية السعودية',
          vatNumber: '123456789012345',
          crNumber: '1010101010',
          subscriptionPlan: 'basic' as const,
          subscriptionStatus: 'active' as const,
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
          isActive: true
        }
        
        userData = {
          id: userCredential.user.uid,
          tenantId: uniqueTenantId,
          name,
          email: userCredential.user.email || '',
          role: role as 'admin' | 'manager' | 'cashier',
          isActive: true,
          createdAt: null,
          updatedAt: null
        }
        
        try {
          // Create tenant in Firestore first
          console.log('[signIn] Creating tenant with data:', tenantData)
          await tenantService.createTenant(tenantData)
          console.log('[signIn] Tenant created successfully in Firestore')
          
          // Save user data to Firestore
          console.log('[signIn] Creating user with data:', userData)
          await userService.createUser(userData)
          console.log('[signIn] User data created successfully in Firestore')
          
          // Create default settings for this tenant using tenant data
          console.log('[signIn] Creating settings for tenant:', uniqueTenantId)
          await settingsService.createDefaultSettingsForTenant(uniqueTenantId, tenantData)
          console.log('[signIn] Default settings created for tenant with actual data')
        } catch (firestoreError: any) {
          console.warn('Failed to save tenant/user/settings data to Firestore:', firestoreError.message)
          console.log('Continuing with local user data...')
          // Continue with the user data even if Firestore fails
        }
      }

      // Get tenant data if user has tenantId
      let tenantData: Tenant | undefined
      if (userData.tenantId) {
        try {
          console.log('[signIn] Loading tenant data for tenantId:', userData.tenantId)
          const tenant = await tenantService.getTenant(userData.tenantId)
          tenantData = tenant || undefined
          console.log('[signIn] Tenant data loaded:', tenantData)
        } catch (tenantError: any) {
          console.warn('Failed to load tenant data:', tenantError.message)
          // Create default tenant data if Firestore fails
          tenantData = {
            id: userData.tenantId,
            name: 'My Store',
            nameAr: 'متجري',
            email: userData.email,
            phone: '+966 11 123 4567',
            address: 'Riyadh, Saudi Arabia',
            addressAr: 'الرياض، المملكة العربية السعودية',
            vatNumber: '123456789012345',
            crNumber: '1010101010',
            subscriptionPlan: 'basic' as const,
            subscriptionStatus: 'active' as const,
            subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true,
            createdAt: null,
            updatedAt: null
          }
        }
      }

      const authUser: AuthUser = {
        ...userData,
        firebaseUser: userCredential.user,
        tenant: tenantData
      }

      this.currentUser = authUser
      console.log('Sign in completed successfully, user:', authUser)
      console.log('Current user set to:', this.currentUser)
      console.log('isAuthenticated() returns:', this.isAuthenticated())
      
      // Manually notify listeners since onAuthStateChanged might not trigger immediately
      console.log('Manually notifying auth state listeners after sign in')
      this.authStateListeners.forEach((listener, index) => {
        console.log(`Manually calling listener ${index} with user:`, this.currentUser)
        listener(this.currentUser)
      })
      
      return authUser
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth)
      this.currentUser = null
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin'
  }

  isManager(): boolean {
    return this.currentUser?.role === 'manager' || this.currentUser?.role === 'admin'
  }

  isCashier(): boolean {
    return this.currentUser?.role === 'cashier' || this.isManager()
  }

  getCurrentTenantId(): string | null {
    return this.currentUser?.tenantId || null
  }

  getCurrentTenant(): Tenant | null {
    return this.currentUser?.tenant || null
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback)
    
    // Check Firebase Auth state immediately and call callback synchronously
    const firebaseUser = getAuth().currentUser
    if (firebaseUser && this.currentUser) {
      console.log('[onAuthStateChange] Firebase user exists, calling callback immediately')
      // Use setTimeout to ensure callback is called after current execution
      setTimeout(() => callback(this.currentUser), 0)
    } else if (firebaseUser && !this.currentUser) {
      console.log('[onAuthStateChange] Firebase user exists but no currentUser, will be set by onAuthStateChanged')
      // Don't call callback yet, let onAuthStateChanged handle it
    } else {
      console.log('[onAuthStateChange] No Firebase user, calling callback with null')
      setTimeout(() => callback(null), 0)
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }
}

// Create singleton instance
export const authService = new AuthService()

// Demo users for testing (remove in production)
export const createDemoUsers = async () => {
  try {
    // Check if demo users already exist
    const users = await userService.getUsers()
    if (users.length > 0) {
      console.log('Demo users already exist')
      return
    }

    // Create demo tenant first
    const demoTenant = {
      name: 'Qayd Demo Store',
      nameAr: 'متجر قيد التجريبي',
      email: 'demo@qayd.com',
      phone: '+966 11 123 4567',
      address: 'Riyadh, Saudi Arabia',
      addressAr: 'الرياض، المملكة العربية السعودية',
      vatNumber: '123456789012345',
      crNumber: '1010101010',
      subscriptionPlan: 'premium' as const,
      subscriptionStatus: 'active' as const,
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isActive: true
    }
    
    const tenantId = await tenantService.createTenant(demoTenant)
    
    // Create demo users
    const demoUsers = [
      {
        id: 'demo_admin',
        tenantId,
        name: 'مدير النظام',
        email: 'admin@qayd.com',
        role: 'admin' as const,
        isActive: true,
        createdAt: null,
        updatedAt: null
      },
      {
        id: 'demo_manager',
        tenantId,
        name: 'مدير المحل',
        email: 'manager@qayd.com',
        role: 'manager' as const,
        isActive: true,
        createdAt: null,
        updatedAt: null
      },
      {
        id: 'demo_cashier',
        tenantId,
        name: 'كاشير',
        email: 'cashier@qayd.com',
        role: 'cashier' as const,
        isActive: true,
        createdAt: null,
        updatedAt: null
      }
    ]

    for (const user of demoUsers) {
      await userService.createUser(user)
    }

    console.log('Demo users created successfully')
  } catch (error) {
    console.error('Error creating demo users:', error)
  }
}
