import { create } from 'zustand'
import { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface UserProfile {
  uid: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'cashier'
  branchId: string
  terminalId?: string
  pin?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  fetchProfile: (uid: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  
  setUser: (user) => {
    set({ user })
    if (user) {
      get().fetchProfile(user.uid)
    } else {
      set({ profile: null })
    }
  },
  
  setProfile: (profile) => set({ profile }),
  
  setLoading: (loading) => set({ loading }),
  
  fetchProfile: async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const profile: UserProfile = {
          uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          branchId: userData.branchId,
          terminalId: userData.terminalId,
          pin: userData.pin,
          isActive: userData.isActive,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        }
        set({ profile })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  },
  
  logout: () => {
    set({ user: null, profile: null })
  },
}))
