import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

const env: any = (import.meta as any).env

// Demo Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBvOkBwvOeJ4UaK9mF8nG7hI6jK5lM4nO3p",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "qayd-pos-demo.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "qayd-pos-demo",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "qayd-pos-demo.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEF1234",
}

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
