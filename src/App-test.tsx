import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Lock, Mail,
  ShoppingCart, Package, Settings, Receipt, Save, Printer, BarChart3
} from 'lucide-react'
import { generateZATCAQR, formatZATCATimestamp, generateUUID } from './lib/zatca'
import SalesReportsPageTest from './pages/SalesReportsPageTest'
import POSEnhanced from './pages/POSEnhanced'
import ProductsPage from './pages/ProductsPage'
import { formatToEnglish } from './utils/numberUtils'

/* =========================
   Login Page
========================= */
function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    setTimeout(() => {
      let userData: null | { name: string; role: 'admin' | 'manager' | 'cashier' } = null

      if (email === 'admin@bigdiet.com' && password === 'password123') {
        userData = { name: 'أحمد محمد', role: 'admin' }
      } else if (email === 'manager@bigdiet.com' && password === 'password123') {
        userData = { name: 'فاطمة أحمد', role: 'manager' }
      } else if (email === 'cashier@bigdiet.com' && password === 'password123') {
        userData = { name: 'محمد علي', role: 'cashier' }
      }

      if (userData) {
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('user', JSON.stringify(userData))
        navigate('/dashboard', { replace: true })
      } else {
        setError('بيانات الدخول غير صحيحة. جرب: admin@bigdiet.com / password123')
        setLoading(false)
      }
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 arabic">تسجيل الدخول</h2>
          <p className="mt-2 text-center text-sm text-gray-600 arabic">نظام نقطة البيع - مطعم Big Diet</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 arabic">البريد الإلكتروني</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="admin@bigdiet.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 arabic">كلمة المرور</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-md block w-full px-3 py-2 pr-10 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="password123"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800 arabic">خطأ في تسجيل الدخول</h3>
              <div className="mt-2 text-sm text-red-700 arabic">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <span className="arabic">تسجيل الدخول</span>}
          </button>
        </form>

        {/* Demo credentials (remove/guard for production) */}
        <div className="text-center">
          <p className="text-xs text-gray-500 arabic">مطعم Big Diet - نظام نقطة البيع</p>
          <p className="text-xs text-gray-400 english">Big Diet Restaurant - Point of Sale System</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-800 arabic font-medium mb-2">بيانات تسجيل الدخول:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>مدير:</strong> admin@bigdiet.com / password123</p>
              <p><strong>مدير فرع:</strong> manager@bigdiet.com / password123</p>
              <p><strong>كاشير:</strong> cashier@bigdiet.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
      <div className="max-w-md mx.auto bg-white p-4 print:p-2 print:max-w-none print:mx-0" style={{ width: '58mm' }}>
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
   Settings Page
========================= */
function SettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('restaurantSettings')
    return saved ? JSON.parse(saved) : {
      restaurantName: 'مطعم Big Diet',
      vatNumber: '123456789012345',
      crNumber: '1010101010',
      phone: '0112345678',
      address: 'الرياض، المملكة العربية السعودية',
      vatRate: 15
    }
  })

  const saveSettings = () => {
    localStorage.setItem('restaurantSettings', JSON.stringify(settings))
    alert('تم حفظ الإعدادات بنجاح!')
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg.white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">الإعدادات</h1>
              <p className="text-sm text-gray-500 english">System Settings</p>
            </div>
            <button onClick={() => navigate(-1)} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 arabic">العودة</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 arabic mb-6">إعدادات المطعم</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">اسم المطعم</label>
              <input
                type="text"
                value={settings.restaurantName}
                onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline.none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">رقم ضريبة القيمة المضافة</label>
              <input
                type="text"
                value={settings.vatNumber}
                onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline.none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">رقم السجل التجاري</label>
              <input
                type="text"
                value={settings.crNumber}
                onChange={(e) => setSettings({ ...settings, crNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline.none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline.none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">العنوان</label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline.none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">نسبة ضريبة القيمة المضافة (%)</label>
              <input
                type="number"
                value={settings.vatRate}
                onChange={(e) => setSettings({ ...settings, vatRate: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline.none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={100}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => navigate(-1)} className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 arabic">إلغاء</button>
            <button onClick={saveSettings} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 arabic">
              <Save className="h-4 w-4 inline mr-2" />
              حفظ الإعدادات
            </button>
          </div>
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

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    navigate('/', { replace: true })
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">مطعم Big Diet</h1>
              <p className="text-sm text-gray-500 english">Big Diet Restaurant POS</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 arabic">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 arabic">
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>

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
                  {(() => {
                    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
                    return orders.length
                  })()}
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
                  {(() => {
                    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
                    const total = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
                    return total.toFixed(0)
                  })()}
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
                  {(() => {
                    const inventory = JSON.parse(localStorage.getItem('inventory') || '[]')
                    return inventory.length || 9
                  })()}
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

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={isLoggedIn ? <DashboardPage /> : <Navigate to="/" replace />} />
      <Route path="/pos" element={isLoggedIn ? <POSEnhanced /> : <Navigate to="/" replace />} />
      <Route path="/products" element={isLoggedIn ? <ProductsPage /> : <Navigate to="/" replace />} />
      <Route path="/reports" element={isLoggedIn ? <SalesReportsPageTest /> : <Navigate to="/" replace />} />
      <Route path="/settings" element={isLoggedIn ? <SettingsPage /> : <Navigate to="/" replace />} />
      <Route path="/print/:orderId" element={isLoggedIn ? <PrintPage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ShoppingCart, Package, Settings, Receipt, Save, Printer, BarChart3 } from 'lucide-react'
import { generateZATCAQR, formatZATCATimestamp, generateUUID } from './lib/zatca'
import SalesReportsPageTest from './pages/SalesReportsPageTest'
import POSEnhanced from './pages/POSEnhanced'
import ProductsPage from './pages/ProductsPage'
import { formatToEnglish } from './utils/numberUtils'

// Login Page Component
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simulate login
    setTimeout(() => {
      let userData = null
      
      if (email === 'admin@bigdiet.com' && password === 'password123') {
        userData = { name: 'أحمد محمد', role: 'admin' }
      } else if (email === 'manager@bigdiet.com' && password === 'password123') {
        userData = { name: 'فاطمة أحمد', role: 'manager' }
      } else if (email === 'cashier@bigdiet.com' && password === 'password123') {
        userData = { name: 'محمد علي', role: 'cashier' }
      }
      
      if (userData) {
        // Store login state in localStorage
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('user', JSON.stringify(userData))
        // Reload to trigger navigation
        window.location.href = '/dashboard'
      } else {
        setError('بيانات الدخول غير صحيحة. جرب: admin@bigdiet.com / password123')
        setLoading(false)
      }
    }, 1000)
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 arabic">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 arabic">
            نظام نقطة البيع - مطعم Big Diet
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 arabic">
                البريد الإلكتروني
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="admin@bigdiet.com"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 arabic">
                كلمة المرور
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="password123"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-red-800 arabic">
                    خطأ في تسجيل الدخول
                  </h3>
                  <div className="mt-2 text-sm text-red-700 arabic">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="arabic">تسجيل الدخول</span>
              )}
            </button>
          </div>
        </form>
        
                <div className="text-center">
                  <p className="text-xs text-gray-500 arabic">
                    مطعم Big Diet - نظام نقطة البيع
                  </p>
                  <p className="text-xs text-gray-400 english">
                    Big Diet Restaurant - Point of Sale System
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-800 arabic font-medium mb-2">بيانات تسجيل الدخول:</p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p><strong>مدير:</strong> admin@bigdiet.com / password123</p>
                      <p><strong>مدير فرع:</strong> manager@bigdiet.com / password123</p>
                      <p><strong>كاشير:</strong> cashier@bigdiet.com / password123</p>
                    </div>
                  </div>
                </div>
      </div>
    </div>
  )
 

// POS Page Component
/* end removed POSPage block */

// Orders Page Component
/* removed: OrdersPage */
/*
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem('orders')
    const defaultOrders = [
      {
        id: 'ORD-001',
        customer: 'أحمد محمد',
        phone: '0501234567',
        items: ['شاورما دجاج كبير', '7UP'],
        total: 27.00,
        status: 'completed',
        timestamp: '2024-01-15 14:30',
        mode: 'dine-in'
      },
      {
        id: 'ORD-002',
        customer: 'فاطمة أحمد',
        phone: '0507654321',
        items: ['برجر لحم', 'بطاطس مقلية'],
        total: 28.00,
        status: 'preparing',
        timestamp: '2024-01-15 14:25',
        mode: 'takeaway'
      },
      {
        id: 'ORD-003',
        customer: 'محمد علي',
        phone: '0509876543',
        items: ['شاورما لحم كبير', 'سلطة خضراء', 'بيبسي'],
        total: 36.00,
        status: 'pending',
        timestamp: '2024-01-15 14:20',
        mode: 'delivery'
      }
    ]
    return savedOrders ? JSON.parse(savedOrders) : defaultOrders
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'preparing': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'مكتمل'
      case 'preparing': return 'قيد التحضير'
      case 'pending': return 'في الانتظار'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">الطلبات</h1>
              <p className="text-sm text-gray-500 english">Orders Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 arabic"
              >
                العودة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                البحث
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="رقم الطلب، اسم العميل، أو رقم الهاتف"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                حالة الطلب
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الطلبات</option>
                <option value="pending">في الانتظار</option>
                <option value="preparing">قيد التحضير</option>
                <option value="completed">مكتمل</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic">
                <Download className="h-4 w-4 inline mr-2" />
                تصدير
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 arabic">
              قائمة الطلبات ({filteredOrders.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">
                    رقم الطلب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">
                    العميل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">
                    الأصناف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">
                    الوقت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 arabic">{order.customer}</div>
                        <div className="text-sm text-gray-500">{order.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 arabic">
                        {order.items.join('، ')}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">{order.mode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.total.toFixed(2)} SAR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 arabic">
                          عرض
                        </button>
                        <button 
                          onClick={() => {
                            // Create order data for printing
                            const printOrder = {
                              id: order.id,
                              items: order.items.map(item => ({ name: item, nameEn: item, price: 0, quantity: 1 })),
                              mode: order.mode,
                              customerPhone: order.phone,
                              subtotal: order.total / 1.15,
                              vat: order.total * 0.15 / 1.15,
                              discount: 0,
                              total: order.total,
                              timestamp: order.timestamp,
                              invoiceNumber: order.id
                            }
                            localStorage.setItem('lastOrder', JSON.stringify(printOrder))
                            window.open(`/print/${order.id}`, '_blank')
                          }}
                          className="text-green-600 hover:text-green-900 arabic"
                        >
                          طباعة
                        </button>
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="text-yellow-600 hover:text-yellow-900 arabic"
                          >
                            بدء التحضير
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="text-green-600 hover:text-green-900 arabic"
                          >
                            إكمال الطلب
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
*/

// Kitchen Page Component
/* end removed KitchenPage block */

// Inventory Page Component
/* end removed InventoryPage block */

// Customers Page Component
/* end removed CustomersPage block */


// Settings Page Component
function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('restaurantSettings')
    return savedSettings ? JSON.parse(savedSettings) : {
      restaurantName: 'مطعم Big Diet',
      vatNumber: '123456789012345',
      crNumber: '1010101010',
      phone: '0112345678',
      address: 'الرياض، المملكة العربية السعودية',
      vatRate: 15
    }
  })

  const saveSettings = () => {
    localStorage.setItem('restaurantSettings', JSON.stringify(settings))
    alert('تم حفظ الإعدادات بنجاح!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">الإعدادات</h1>
              <p className="text-sm text-gray-500 english">System Settings</p>
            </div>
            <button onClick={() => window.history.back()} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 arabic">العودة</button>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 arabic mb-6">إعدادات المطعم</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                اسم المطعم
              </label>
              <input
                type="text"
                value={settings.restaurantName}
                onChange={(e) => setSettings({...settings, restaurantName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                رقم ضريبة القيمة المضافة
              </label>
              <input
                type="text"
                value={settings.vatNumber}
                onChange={(e) => setSettings({...settings, vatNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                رقم السجل التجاري
              </label>
              <input
                type="text"
                value={settings.crNumber}
                onChange={(e) => setSettings({...settings, crNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                العنوان
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                نسبة ضريبة القيمة المضافة (%)
              </label>
              <input
                type="number"
                value={settings.vatRate}
                onChange={(e) => setSettings({...settings, vatRate: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <button className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 arabic">
              إلغاء
            </button>
            <button 
              onClick={saveSettings}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 arabic"
            >
              <Save className="h-4 w-4 inline mr-2" />
              حفظ الإعدادات
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Print Page Component
function PrintPage() {
  const [order, setOrder] = useState(null)
  const [qrUrl, setQrUrl] = useState('')

  React.useEffect(() => {
    const orderData = localStorage.getItem('lastOrder')
    if (orderData) {
      const parsedOrder = JSON.parse(orderData)
      setOrder(parsedOrder)
      
      // Generate ZATCA QR image (TLV Base64 -> QR PNG data URL)
      const buildQR = async () => {
        try {
          const qr = await generateZATCAQR({
            sellerName: 'Big Diet Restaurant',
            vatNumber: '123456789012345',
            timestamp: parsedOrder.timestamp || formatZATCATimestamp(new Date()),
            total: parsedOrder.total || 0,
            vatTotal: parsedOrder.vat || 0,
            uuid: generateUUID()
          })
          setQrUrl(qr)
        } catch (e) {
          console.error('QR generation failed', e)
        }
      }
      buildQR()
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    window.location.href = '/pos'
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 arabic">لا يوجد طلب للطباعة</h2>
          <div className="mt-4 space-x-4">
            <button onClick={handleBack} className="bg-blue-600 text-white px-4 py-2 rounded-md arabic">
              العودة لنقطة البيع
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="bg-green-600 text-white px-4 py-2 rounded-md arabic"
            >
              🏠 الصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">طباعة الفاتورة</h1>
              <p className="text-sm text-gray-500 english">Print Receipt</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handlePrint}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 arabic"
              >
                <Printer className="h-4 w-4 inline mr-2" />
                طباعة
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic"
              >
                🏠 الصفحة الرئيسية
              </button>
              <button
                onClick={handleBack}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic"
              >
                العودة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-md mx-auto bg-white p-4 print:p-2 print:max-w-none print:mx-0" style={{ width: '58mm' }}>
        {/* Restaurant Header */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold arabic">مطعم Big Diet</h1>
          <p className="text-sm english">Big Diet Restaurant</p>
          <div className="text-xs text-gray-600 mt-2">
            <p>VAT: 123456789012345</p>
            <p>CR: 1010101010</p>
            <p>Tel: 0112345678</p>
          </div>
        </div>

        <div className="border-t border-b border-gray-300 py-2 my-2">
          <div className="flex justify-between text-sm">
            <span className="arabic">رقم الفاتورة:</span>
            <span>{order.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="arabic">التاريخ:</span>
            <span>{new Date(order.timestamp).toLocaleDateString('ar-SA')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="arabic">الوقت:</span>
            <span>{new Date(order.timestamp).toLocaleTimeString('ar-SA')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="arabic">النوع:</span>
            <span className="arabic">
              {order.mode === 'dine-in' ? 'تناول في المطعم' : 
               order.mode === 'takeaway' ? 'طلب خارجي' : 'توصيل'}
            </span>
          </div>
          {order.customerPhone && (
            <div className="flex justify-between text-sm">
              <span className="arabic">الهاتف:</span>
              <span>{order.customerPhone}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <div className="text-center text-sm font-semibold mb-2 arabic">تفاصيل الطلب</div>
          {order.items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between text-sm">
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
          <div className="flex justify-between text-sm mb-1">
            <span className="arabic">المجموع (شامل الضريبة):</span>
            <span>{formatToEnglish(order.subtotal + order.vat)} SAR</span>
          </div>
          <div className="flex justify-between text-sm mb-1 text-gray-600">
            <span className="arabic">المجموع الفرعي:</span>
            <span>{formatToEnglish(order.subtotal)} SAR</span>
          </div>
          <div className="flex justify-between text-sm mb-1 text-gray-600">
            <span className="arabic">ضريبة القيمة المضافة (15%):</span>
            <span>{formatToEnglish(order.vat)} SAR</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm mb-1 text-red-600">
              <span className="arabic">خصم:</span>
              <span>-{formatToEnglish(order.discount)} SAR</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
            <span className="arabic">المجموع الكلي:</span>
            <span>{formatToEnglish(order.total)} SAR</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center mt-4">
          <div className="text-xs text-gray-600 mb-2 arabic">رمز ZATCA</div>
          {qrUrl ? (
            <img src={qrUrl} alt="ZATCA QR" className="inline-block w-28 h-28" />
          ) : (
            <div className="bg-gray-100 p-2 rounded text-xs text-gray-500">جاري إنشاء الرمز...</div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-xs text-gray-600">
          <p className="arabic">شكراً لزيارتكم</p>
          <p className="english">Thank you for your visit</p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Page Component
function DashboardPage() {
  const [user] = useState(() => {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : { name: 'أحمد محمد', role: 'admin' }
  })

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  const menuItems = [
    { name: 'نقطة البيع', nameEn: 'POS', icon: ShoppingCart, href: '/pos', color: 'bg-blue-500' },
    { name: 'المنتجات', nameEn: 'Products', icon: Package, href: '/products', color: 'bg-purple-500' },
    { name: 'التقارير', nameEn: 'Reports', icon: BarChart3, href: '/reports', color: 'bg-indigo-500' },
    { name: 'الإعدادات', nameEn: 'Settings', icon: Settings, href: '/settings', color: 'bg-gray-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">مطعم Big Diet</h1>
              <p className="text-sm text-gray-500 english">Big Diet Restaurant POS</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 arabic">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 arabic"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 arabic mb-2">
            لوحة التحكم
          </h2>
          <p className="text-gray-600 arabic">
            مرحباً بك في نظام نقطة البيع لمطعم Big Diet
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  window.location.href = item.href
                }}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-lg font-semibold text-gray-900 arabic">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 english">
                      {item.nameEn}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 arabic">
                  {item.name === 'نقطة البيع' && 'إدارة المبيعات والطلبات'}
                  {item.name === 'المنتجات' && 'إدارة المنتجات والأصناف - إضافة وتعديل وحذف'}
                  {item.name === 'التقارير' && 'تقارير المبيعات والتحليلات'}
                  {item.name === 'الإعدادات' && 'إعدادات النظام والمطعم'}
                </p>
              </div>
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
                  {(() => {
                    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
                    return orders.length
                  })()}
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
                  {(() => {
                    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
                    const total = orders.reduce((sum, order) => sum + (order.total || 0), 0)
                    return total.toFixed(0)
                  })()}
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
                  {(() => {
                    const inventory = JSON.parse(localStorage.getItem('inventory') || '[]')
                    return inventory.length || 9
                  })()}
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

// Main App Component
function App() {
  const [isLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true'
  })

  return (
            <Routes>
              <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
              <Route path="/dashboard" element={isLoggedIn ? <DashboardPage /> : <Navigate to="/" replace />} />
              <Route path="/pos" element={isLoggedIn ? <POSEnhanced /> : <Navigate to="/" replace />} />
              <Route path="/products" element={isLoggedIn ? <ProductsPage /> : <Navigate to="/" replace />} />
              <Route path="/reports" element={isLoggedIn ? <SalesReportsPageTest /> : <Navigate to="/" replace />} />
              <Route path="/settings" element={isLoggedIn ? <SettingsPage /> : <Navigate to="/" replace />} />
              <Route path="/print/:orderId" element={isLoggedIn ? <PrintPage /> : <Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
  )
}

export default App
