import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './lib/firebase'
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import LoginPageFirebase from './pages/LoginPageFirebase'
import DashboardPage from './pages/DashboardPage'
import POSPage from './pages/POSPage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import PrintPage from './pages/PrintPage'
import SalesReportsPage from './pages/SalesReportsPage'
import SalesReportsPage from './pages/SalesReportsPage'

interface User {
  uid: string
  email: string | null
  displayName: string | null
  role: string
}

function AppFirebaseSimple() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Determine role based on email
        const role = firebaseUser.email?.includes('admin') ? 'admin' : 
                    firebaseUser.email?.includes('manager') ? 'manager' : 'cashier'
        const name = firebaseUser.email?.includes('admin') ? 'أحمد محمد' :
                    firebaseUser.email?.includes('manager') ? 'فاطمة أحمد' : 'محمد علي'
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: name,
          role
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 arabic">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPageFirebase onSignIn={handleSignIn} />} 
      />
      <Route 
        path="/dashboard" 
        element={user ? <DashboardPage user={user} onSignOut={handleSignOut} /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/pos" 
        element={user ? <POSPage user={user} /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/products" 
        element={user ? <ProductsPage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/reports" 
        element={user ? <SalesReportsPage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/settings" 
        element={user ? <SettingsPage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/print/:orderId" 
        element={user ? <PrintPage /> : <Navigate to="/" replace />} 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppFirebaseSimple
