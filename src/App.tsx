import { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Package, Settings, Receipt, BarChart3, Home
} from 'lucide-react'
import { authService } from './lib/authService'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './lib/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import Layout from './components/Layout'

// Import login page directly for instant loading
import LoginPageMultiTenant from './pages/LoginPageMultiTenant'

// Lazy load other components for better performance
const SalesReportsPageTest = lazy(() => import('./pages/SalesReportsPage'))
const POSEnhanced = lazy(() => import('./pages/POSEnhanced'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ZATCASettingsPage = lazy(() => import('./pages/ZATCASettingsPage'))
const PrintPage = lazy(() => import('./pages/PrintPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

/* Login page now comes from src/pages/LoginPage */



/* =========================
   Dashboard Page
========================= */
function DashboardPage() {
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<any>(null)
  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0, totalProducts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current tenant
    const currentTenant = authService.getCurrentTenant()
    
    setTenant(currentTenant)
    
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      console.log('loadStats called - Firebase functions available:', {
        collection: typeof collection,
        getDocs: typeof getDocs,
        query: typeof query,
        where: typeof where,
        db: typeof db
      })
      
      const tenantId = authService.getCurrentTenantId()
      if (!tenantId) {
        setStats({ totalOrders: 0, totalSales: 0, totalProducts: 0 })
        setLoading(false)
        return
      }

      // Load orders from Firebase filtered by tenant
      const ordersQuery = query(
        collection(db, 'orders'),
        where('tenantId', '==', tenantId)
      )
      const ordersSnapshot = await getDocs(ordersQuery)
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Load products from Firebase filtered by tenant
      const itemsQuery = query(
        collection(db, 'items'),
        where('tenantId', '==', tenantId)
      )
      const itemsSnapshot = await getDocs(itemsQuery)
      const products = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Calculate stats
      const totalOrders = orders.length
      const totalSales = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      const totalProducts = products.length
      
      setStats({ totalOrders, totalSales, totalProducts })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Fallback to localStorage
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      const localProducts = JSON.parse(localStorage.getItem('inventory') || '[]')
      setStats({
        totalOrders: localOrders.length,
        totalSales: localOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
        totalProducts: localProducts.length || 9
      })
    } finally {
      setLoading(false)
    }
  }


  const menuItems = [
    { name: 'نقطة البيع', nameEn: 'POS',       icon: ShoppingCart, href: '/pos',       color: 'bg-blue-500' },
    { name: 'المنتجات',   nameEn: 'Products',  icon: Package,      href: '/products',  color: 'bg-purple-500' },
    { name: 'التقارير',   nameEn: 'Reports',   icon: BarChart3,    href: '/reports',   color: 'bg-indigo-500' },
    { name: 'الإعدادات',  nameEn: 'Settings',  icon: Settings,     href: '/settings',  color: 'bg-gray-500' },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-4">
                <Home className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 arabic mb-2">مرحباً بك في لوحة التحكم</h2>
              <p className="text-gray-600 arabic text-lg">
                نظام قيد - {tenant?.nameAr || tenant?.name || 'نظام نقاط البيع السحابي'}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={() => navigate(item.href)}
                className="group text-right bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-emerald-200"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-4 rounded-xl ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-lg font-bold text-gray-900 arabic group-hover:text-emerald-700 transition-colors">{item.name}</h3>
                    <p className="text-sm text-gray-500 english">{item.nameEn}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 arabic leading-relaxed">
                  {item.name === 'نقطة البيع' && 'إدارة المبيعات والطلبات'}
                  {item.name === 'المنتجات' && 'إدارة المنتجات والأصناف - إضافة وتعديل وحذف'}
                  {item.name === 'التقارير' && 'تقارير المبيعات والتحليلات'}
                  {item.name === 'الإعدادات' && 'إعدادات النظام والمطعم'}
                </p>
              </button>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                <Receipt className="h-7 w-7 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalOrders}
                </p>
                <p className="text-sm text-gray-500 arabic">إجمالي الطلبات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                <ShoppingCart className="h-7 w-7 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalSales.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500 arabic">ريال سعودي</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                <Package className="h-7 w-7 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalProducts}
                </p>
                <p className="text-sm text-gray-500 arabic">المنتجات المتاحة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================
   App (Routes)
========================= */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('Firebase auth state changed:', fbUser ? 'User logged in' : 'User logged out');

      // حسم قرار الواجهة مباشرةً من Firebase
      setIsLoggedIn(!!fbUser);
      setIsInitialized(true);

      // (اختياري) بعدها بسكّة جانبية، زامن authService/tenant بدون ما تأثر على isInitialized
      try {
        if (fbUser) {
          // Sync user data if needed
          console.log('User authenticated:', fbUser.uid);
        }
      } catch (e) {
        console.warn('authService sync failed:', e);
      }
    });

    return unsubscribe;
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 arabic">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    console.log('App: User not logged in, showing login page')
    return <LoginPageMultiTenant />
  }

        // Show dashboard if logged in
        console.log('App: User is logged in, showing dashboard')
  return (
    <Layout>
      <Routes>
              <Route path="/admin" element={
                <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>}>
                  <AdminDashboard />
                </Suspense>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>}>
                  <DashboardPage />
                </Suspense>
              } />
              <Route path="/pos" element={
                <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>}>
                  <POSEnhanced />
                </Suspense>
              } />
              <Route path="/products" element={
                <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>}>
                  <ProductsPage />
                </Suspense>
              } />
              <Route path="/reports" element={
                <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>}>
                  <SalesReportsPageTest />
                </Suspense>
              } />
              <Route path="/settings" element={
                <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>}>
                  <SettingsPage />
                </Suspense>
              } />
              <Route path="/zatca-settings" element={
                <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>}>
                  <ZATCASettingsPage />
                </Suspense>
              } />
        <Route path="/print/:orderId" element={<PrintPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
