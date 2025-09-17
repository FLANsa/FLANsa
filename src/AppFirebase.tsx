import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useFirebase'
import { seedData, checkDataExists } from './lib/seedData'
import LoginPageFirebase from './pages/LoginPageFirebase'
import SalesReportsPage from './pages/SalesReportsPage'
import DashboardPage from './pages/DashboardPage'
import POSPage from './pages/POSPage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import PrintPage from './pages/PrintPage'

function AppFirebase() {
  const { user, loading } = useAuth()

  useEffect(() => {
    // Seed data on first load
    const initializeData = async () => {
      try {
        const dataExists = await checkDataExists()
        if (!dataExists) {
          console.log('No data found, seeding initial data...')
          await seedData()
        } else {
          console.log('Data already exists, skipping seed')
        }
      } catch (error) {
        console.error('Error initializing data:', error)
        // Continue even if seeding fails
      }
    }
    
    initializeData()
  }, [])

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
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPageFirebase />} 
      />
      <Route 
        path="/dashboard" 
        element={user ? <DashboardPage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/pos" 
        element={user ? <POSPage /> : <Navigate to="/" replace />} 
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

export default AppFirebase
