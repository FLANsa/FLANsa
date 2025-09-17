import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'

// Pages
import LoginPage from './pages/LoginPage'
import PinPage from './pages/PinPage'
import SellPage from './pages/SellPage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import PrintPage from './pages/PrintPage'
import SalesReportsPage from './pages/SalesReportsPage'

// Components
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, setUser, setLoading, loading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/sell" replace />} />
        <Route path="/pin" element={<PinPage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reports" element={<SalesReportsPage />} />
        <Route path="/print/:orderId" element={<PrintPage />} />
        <Route path="*" element={<Navigate to="/sell" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
