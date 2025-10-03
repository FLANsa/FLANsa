import { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Package, Settings, Receipt, Printer, BarChart3, Home
} from 'lucide-react'
import { generateZATCAQR, formatZATCATimestamp, generateUUID } from './lib/zatca'
import { formatToEnglish } from './utils/numberUtils'
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

/* Login page now comes from src/pages/LoginPage */

/* =========================
   Print Page
========================= */
function PrintPage() {
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [tenant, setTenant] = useState<any>(null)

  useEffect(() => {
    const orderData = localStorage.getItem('lastOrder')
    if (!orderData) return
    const parsed = JSON.parse(orderData)
    setOrder(parsed)

    // Get tenant data
    const currentTenant = authService.getCurrentTenant()
    setTenant(currentTenant)

    ;(async () => {
      try {
        const qr = await generateZATCAQR({
          sellerName: tenant?.name || 'Qayd POS System',
          vatNumber: tenant?.vatNumber || '123456789012345',
          timestamp: parsed.timestamp || formatZATCATimestamp(new Date()),
          total: parsed.total || 0,
          vatTotal: parsed.vat || 0,
          uuid: generateUUID(),
        })
        setQrUrl(qr)
      } catch (e) {
        console.error('QR generation failed', e)
      }
    })()
  }, [tenant])

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" dir="rtl">
          <h2 className="text-xl font-semibold text-gray-900 arabic">لا يوجد طلب للطباعة</h2>
          <div className="mt-4 flex gap-3 justify-center">
            <button onClick={() => navigate('/pos')} className="bg-blue-600 text-white px-4 py-2 rounded-md arabic">العودة لنقطة البيع</button>
            <button onClick={() => navigate('/dashboard')} className="bg-green-600 text-white px-4 py-2 rounded-md arabic">🏠 الصفحة الرئيسية</button>
        </div>
      </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">طباعة الفاتورة</h1>
              <p className="text-sm text-gray-500 english">Print Receipt</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 arabic">
                <Printer className="h-4 w-4 inline mr-2" />
                طباعة
              </button>
              <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic">🏠 الصفحة الرئيسية</button>
              <button onClick={() => navigate('/pos')} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic">العودة</button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt (58mm) */}
      <div className="max-w-md mx-auto bg-white p-4 print:p-2 print:max-w-none print:mx-0" style={{ width: '58mm' }}>
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold arabic">{tenant?.nameAr || 'قيد'}</h1>
          <p className="text-sm english">{tenant?.name || 'Qayd - POS System'}</p>
          <div className="text-xs text-gray-600 mt-2">
            <p>VAT: {tenant?.vatNumber || '123456789012345'}</p>
            <p>CR: {tenant?.crNumber || '1010101010'}</p>
            <p>Tel: {tenant?.phone || '0112345678'}</p>
          </div>
        </div>

        <div className="border-t border-b border-gray-300 py-2 my-2" dir="rtl">
          <div className="flex justify-between text-sm"><span className="arabic">رقم الفاتورة:</span><span>{order.invoiceNumber}</span></div>
          <div className="flex justify-between text-sm"><span className="arabic">التاريخ:</span><span>{new Date(order.timestamp).toLocaleDateString('ar-SA')}</span></div>
          <div className="flex justify-between text-sm"><span className="arabic">الوقت:</span><span>{new Date(order.timestamp).toLocaleTimeString('ar-SA')}</span></div>
          <div className="flex justify-between text-sm">
            <span className="arabic">النوع:</span>
            <span className="arabic">
              {order.mode === 'dine-in' ? 'تناول في المطعم' :
               order.mode === 'takeaway' ? 'طلب خارجي' : 'توصيل'}
                      </span>
          </div>
          {order.customerPhone && (
            <div className="flex justify-between text-sm"><span className="arabic">الهاتف:</span><span>{order.customerPhone}</span></div>
                        )}
                      </div>

        {/* Items */}
        <div className="mb-4">
          <div className="text-center text-sm font-semibold mb-2 arabic">تفاصيل الطلب</div>
          {order.items.map((item: any, index: number) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between text-sm" dir="rtl">
                <div className="flex-1">
                  <div className="arabic font-medium">{item.nameAr || item.name}</div>
                  <div className="english text-xs text-gray-500">{item.nameEn || item.name}</div>
                </div>
                <span className="text-left">{formatToEnglish(item.quantity)}x</span>
            </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span></span>
                <span>{formatToEnglish(item.price)} SAR (شامل الضريبة)</span>
          </div>
                  </div>
                ))}
              </div>

        {/* Totals */}
        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between text-sm mb-1"><span className="arabic">المجموع (شامل الضريبة):</span><span>{formatToEnglish(order.subtotal + order.vat)} SAR</span></div>
          <div className="flex justify-between text-sm mb-1 text-gray-600"><span className="arabic">المجموع الفرعي:</span><span>{formatToEnglish(order.subtotal)} SAR</span></div>
          <div className="flex justify-between text-sm mb-1 text-gray-600"><span className="arabic">ضريبة القيمة المضافة (15%):</span><span>{formatToEnglish(order.vat)} SAR</span></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm mb-1 text-red-600"><span className="arabic">خصم:</span><span>-{formatToEnglish(order.discount)} SAR</span></div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2"><span className="arabic">المجموع الكلي:</span><span>{formatToEnglish(order.total)} SAR</span></div>
          </div>

        {/* QR Code */}
        <div className="text-center mt-4">
          <div className="text-xs text-gray-600 mb-2 arabic">رمز ZATCA</div>
          {qrUrl ? <img src={qrUrl} alt="ZATCA QR" className="inline-block w-28 h-28" /> : <div className="bg-gray-100 p-2 rounded text-xs text-gray-500">جاري إنشاء الرمز...</div>}
            </div>

        <div className="text-center mt-4 text-xs text-gray-600">
          <p className="arabic">شكراً لزيارتكم</p>
          <p className="english">Thank you for your visit</p>
                </div>
      </div>
    </div>
  )
}


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
        <Route path="/print/:orderId" element={<PrintPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
