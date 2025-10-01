import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'

// Demo credentials for Firebase Auth
export const DEMO_CREDENTIALS = {
  'alrashid': {
    admin: { email: 'admin@alrashid.com', password: '123456' },
    manager: { email: 'manager@alrashid.com', password: '123456' },
    cashier: { email: 'cashier@alrashid.com', password: '123456' }
  },
  'cafedelight': {
    admin: { email: 'admin@cafedelight.com', password: '123456' },
    cashier: { email: 'cashier@cafedelight.com', password: '123456' }
  },
  'quickmart': {
    admin: { email: 'admin@quickmart.com', password: '123456' },
    manager: { email: 'manager@quickmart.com', password: '123456' },
    cashier: { email: 'cashier@quickmart.com', password: '123456' }
  }
}

export const createFirebaseAuthUsers = async () => {
  try {
    console.log('Creating Firebase Auth users...')
    
    const allCredentials = [
      ...Object.values(DEMO_CREDENTIALS.alrashid),
      ...Object.values(DEMO_CREDENTIALS.cafedelight),
      ...Object.values(DEMO_CREDENTIALS.quickmart)
    ]

    let createdCount = 0
    let existingCount = 0

    for (const credential of allCredentials) {
      try {
        await createUserWithEmailAndPassword(auth, credential.email, credential.password)
        console.log(`✅ Created Firebase Auth user: ${credential.email}`)
        createdCount++
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`ℹ️ User already exists: ${credential.email}`)
          existingCount++
        } else {
          console.error(`❌ Error creating user ${credential.email}:`, error.message)
        }
      }
    }
    
    console.log(`Firebase Auth users creation completed! Created: ${createdCount}, Existing: ${existingCount}`)
    return { createdCount, existingCount }
  } catch (error) {
    console.error('Error creating Firebase Auth users:', error)
    throw error
  }
}

// Function to create a single user
export const createSingleFirebaseUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    console.log(`Created Firebase Auth user: ${email}`)
    return userCredential.user
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`User already exists: ${email}`)
      // Try to get the existing user by signing in
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return userCredential.user
      } catch (signInError) {
        console.error(`Error signing in existing user ${email}:`, signInError)
        return null
      }
    } else {
      console.error(`Error creating user ${email}:`, error.message)
      return null
    }
  }
}
