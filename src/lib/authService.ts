import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from './firebase'
import { userService, tenantService, User, Tenant } from './firebaseServices'

export interface AuthUser extends User {
  firebaseUser: FirebaseUser
  tenant?: Tenant
}

class AuthService {
  private currentUser: AuthUser | null = null
  private authStateListeners: ((user: AuthUser | null) => void)[] = []

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await userService.getUser(firebaseUser.uid)
          if (userData) {
            // Get tenant data if user has tenantId
            let tenantData: Tenant | undefined
            if (userData.tenantId) {
              const tenant = await tenantService.getTenant(userData.tenantId)
              tenantData = tenant || undefined
            }
            
            this.currentUser = {
              ...userData,
              firebaseUser,
              tenant: tenantData
            }
          } else {
            // User data not found, sign out
            await this.signOut()
            this.currentUser = null
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          this.currentUser = null
        }
      } else {
        this.currentUser = null
      }
      
      // Notify all listeners
      console.log('Notifying', this.authStateListeners.length, 'auth state listeners')
      this.authStateListeners.forEach((listener, index) => {
        console.log(`Calling listener ${index} with user:`, this.currentUser)
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
        
        // For demo purposes, assign to default tenant
        const defaultTenantId = 'main'
        
        userData = {
          id: userCredential.user.uid,
          tenantId: defaultTenantId,
          name,
          email: userCredential.user.email || '',
          role: role as 'admin' | 'manager' | 'cashier',
          isActive: true,
          createdAt: null,
          updatedAt: null
        }
        
        try {
          // Save user data to Firestore
          await userService.createUser(userData)
          console.log('User data created successfully in Firestore')
        } catch (firestoreError: any) {
          console.warn('Failed to save user data to Firestore:', firestoreError.message)
          console.log('Continuing with local user data...')
          // Continue with the user data even if Firestore fails
        }
      }

      // Get tenant data if user has tenantId
      let tenantData: Tenant | undefined
      if (userData.tenantId) {
        try {
          const tenant = await tenantService.getTenant(userData.tenantId)
          tenantData = tenant || undefined
        } catch (tenantError: any) {
          console.warn('Failed to load tenant data:', tenantError.message)
          // Create default tenant data if Firestore fails
          tenantData = {
            id: 'main',
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
            subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
        tenantId,
        name: 'مدير النظام',
        email: 'admin@qayd.com',
        role: 'admin' as const,
        isActive: true
      },
      {
        tenantId,
        name: 'مدير المحل',
        email: 'manager@qayd.com',
        role: 'manager' as const,
        isActive: true
      },
      {
        tenantId,
        name: 'كاشير',
        email: 'cashier@qayd.com',
        role: 'cashier' as const,
        isActive: true
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
