import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { userService, User } from './firebaseServices'

export interface AuthUser extends User {
  firebaseUser: FirebaseUser
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
            this.currentUser = {
              ...userData,
              firebaseUser
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
      this.authStateListeners.forEach(listener => listener(this.currentUser))
    })
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Create user data if not exists (for demo purposes)
      let userData = await userService.getUser(userCredential.user.uid)
      
      if (!userData) {
        // Create user data based on email
        const role = email.includes('admin') ? 'admin' : 
                    email.includes('manager') ? 'manager' : 'cashier'
        const name = email.includes('admin') ? 'أحمد محمد' :
                    email.includes('manager') ? 'فاطمة أحمد' : 'محمد علي'
        
        userData = {
          id: userCredential.user.uid,
          name,
          email: userCredential.user.email || '',
            role: role as 'admin' | 'manager' | 'cashier',
            isActive: true,
            createdAt: null,
            updatedAt: null
        }
        
        // Save user data to Firestore
        await userService.createUser(userData)
      }

      const authUser: AuthUser = {
        ...userData,
        firebaseUser: userCredential.user
      }

      this.currentUser = authUser
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

    // Create demo users
    const demoUsers = [
      {
        name: 'أحمد محمد',
        email: 'admin@bigdiet.com',
        role: 'admin' as const,
        isActive: true
      },
      {
        name: 'فاطمة أحمد',
        email: 'manager@bigdiet.com',
        role: 'manager' as const,
        isActive: true
      },
      {
        name: 'محمد علي',
        email: 'cashier@bigdiet.com',
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
