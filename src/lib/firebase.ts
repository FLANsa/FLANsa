import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { firebaseConfig } from './firebaseConfig'

const env: any = (import.meta as any).env

console.log('Firebase Config:', firebaseConfig)
console.log('Firebase Auth Domain:', firebaseConfig.authDomain)
console.log('Firebase Project ID:', firebaseConfig.projectId)

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
export const storage = getStorage(app)

// Initialize Analytics only when supported to avoid runtime crashes (e.g., Safari private / non-HTTPS)
export let analytics: Analytics | undefined
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app)
        } catch (_) {
          // ignore analytics failures in dev
        }
      }
    })
    .catch(() => {
      // ignore analytics support errors
    })
}

// Connect to emulators in development (only if explicitly enabled)
if (env.DEV && env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectFunctionsEmulator(functions, 'localhost', 5001)
    connectStorageEmulator(storage, 'localhost', 9199)
    console.log('Connected to Firebase emulators')
  } catch (error) {
    // Emulators already connected
    console.log('Emulators already connected')
  }
} else {
  console.log('Using Firebase production services')
}

export default app
