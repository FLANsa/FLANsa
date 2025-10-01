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

    for (const credential of allCredentials) {
      try {
        await createUserWithEmailAndPassword(auth, credential.email, credential.password)
        console.log(`Created Firebase Auth user: ${credential.email}`)
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`User already exists: ${credential.email}`)
        } else {
          console.error(`Error creating user ${credential.email}:`, error.message)
        }
      }
    }
    
    console.log('Firebase Auth users creation completed!')
  } catch (error) {
    console.error('Error creating Firebase Auth users:', error)
  }
}

// Function to create a single user
export const createSingleFirebaseUser = async (email: string, password: string) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password)
    console.log(`Created Firebase Auth user: ${email}`)
    return true
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`User already exists: ${email}`)
      return true
    } else {
      console.error(`Error creating user ${email}:`, error.message)
      return false
    }
  }
}
