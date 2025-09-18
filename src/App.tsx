import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Lock, Mail,
  ShoppingCart, Package, Settings, Receipt, Save, Printer, BarChart3
} from 'lucide-react'
import { generateZATCAQR, formatZATCATimestamp, generateUUID } from './lib/zatca'
import SalesReportsPageTest from './pages/SalesReportsPage'
import POSEnhanced from './pages/POSEnhanced'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import { formatToEnglish } from './utils/numberUtils'
import LoginPage from './pages/LoginPage'

/* Login page now comes from src/pages/LoginPage */

/* =========================
   Print Page
========================= */
function PrintPage() {
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    const orderData = localStorage.getItem('lastOrder')
    if (!orderData) return
    const parsed = JSON.parse(orderData)
    setOrder(parsed)

    ;(async () => {
      try {
        const qr = await generateZATCAQR({
          sellerName: 'Big Diet Restaurant',
          vatNumber: '123456789012345',
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
  }, [])

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
          <h1 className="text-lg font-bold arabic">مطعم Big Diet</h1>
          <p className="text-sm english">Big Diet Restaurant</p>
          <div className="text-xs text-gray-600 mt-2">
            <p>VAT: 123456789012345</p>
            <p>CR: 1010101010</p>
            <p>Tel: 0112345678</p>
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
                <span className="arabic flex-1">{item.name}</span>
                <span className="text-left">{formatToEnglish(item.quantity)}x</span>
            </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span className="english">{item.nameEn}</span>
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
  const [user] = useState(() => {
    const data = localStorage.getItem('user')
    return data ? JSON.parse(data) : { name: 'أحمد محمد', role: 'admin' }
  })
  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0, totalProducts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Load orders from Firebase
      const ordersRef = collection(db, 'orders')
      const ordersSnapshot = await getDocs(ordersRef)
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Load products from Firebase
      const itemsRef = collection(db, 'items')
      const itemsSnapshot = await getDocs(itemsRef)
      const products = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Calculate stats
      const totalOrders = orders.length
      const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      const totalProducts = products.length
      
      setStats({ totalOrders, totalSales, totalProducts })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Fallback to localStorage
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      const localProducts = JSON.parse(localStorage.getItem('inventory') || '[]')
      setStats({
        totalOrders: localOrders.length,
        totalSales: localOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        totalProducts: localProducts.length || 9
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    // Force page reload to clear all state
    window.location.href = '/login'
  }

  const menuItems = [
    { name: 'نقطة البيع', nameEn: 'POS',       icon: ShoppingCart, href: '/pos',       color: 'bg-blue-500' },
    { name: 'المنتجات',   nameEn: 'Products',  icon: Package,      href: '/products',  color: 'bg-purple-500' },
    { name: 'التقارير',   nameEn: 'Reports',   icon: BarChart3,    href: '/reports',   color: 'bg-indigo-500' },
    { name: 'الإعدادات',  nameEn: 'Settings',  icon: Settings,     href: '/settings',  color: 'bg-gray-500' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-700 to-green-600 text-white shadow-lg">
        <div aria-hidden className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_-10%,rgba(255,255,255,.25),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <div className="text-xs/5 uppercase tracking-wider english opacity-80">Dashboard</div>
              <h1 className="mt-0.5 text-2xl sm:text-3xl font-extrabold arabic tracking-tight">لوحة التحكم</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold arabic">{user.name}</p>
                <p className="text-[11px] opacity-90">{user.role}</p>
              </div>
              <button onClick={handleLogout} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-3 py-2 rounded-lg text-sm backdrop-blur transition arabic">
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 arabic mb-2">لوحة التحكم</h2>
          <p className="text-gray-600 arabic">مرحباً بك في نظام نقطة البيع لمطعم Big Diet</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={() => navigate(item.href)}
                className="text-right bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-lg font-semibold text-gray-900 arabic">{item.name}</h3>
                    <p className="text-sm text-gray-500 english">{item.nameEn}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 arabic">
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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalOrders}
                </p>
                <p className="text-sm text-gray-500 arabic">إجمالي الطلبات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalSales.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500 arabic">ريال سعودي</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">
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
  const [isLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true')

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/pos" element={<POSEnhanced />} />
        <Route path="/products" element={<ProductsPage />} />
      <Route path="/reports" element={<SalesReportsPageTest />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/print/:orderId" element={<PrintPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
  )
}

export default App
