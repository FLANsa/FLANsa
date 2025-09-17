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
}

// POS Page Component
/* removed: POSPage */
  const [cart, setCart] = useState([])
  const [selectedMode, setSelectedMode] = useState('dine-in')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discount, setDiscount] = useState(0)

  const menuItems = [
    { id: 1, name: 'شاورما دجاج كبير', nameEn: 'Large Chicken Shawarma', price: 22.00, category: 'main', stock: 15 },
    { id: 2, name: 'شاورما لحم كبير', nameEn: 'Large Beef Shawarma', price: 25.00, category: 'main', stock: 8 },
    { id: 3, name: 'برجر دجاج', nameEn: 'Chicken Burger', price: 18.00, category: 'main', stock: 12 },
    { id: 4, name: 'برجر لحم', nameEn: 'Beef Burger', price: 20.00, category: 'main', stock: 3 },
    { id: 5, name: '7UP (330ml)', nameEn: '7UP (330ml)', price: 5.00, category: 'drinks', stock: 25 },
    { id: 6, name: 'بيبسي (330ml)', nameEn: 'Pepsi (330ml)', price: 5.00, category: 'drinks', stock: 0 },
    { id: 7, name: 'ماء (500ml)', nameEn: 'Water (500ml)', price: 2.00, category: 'drinks', stock: 50 },
    { id: 8, name: 'بطاطس مقلية', nameEn: 'French Fries', price: 8.00, category: 'sides', stock: 6 },
    { id: 9, name: 'سلطة خضراء', nameEn: 'Green Salad', price: 6.00, category: 'sides', stock: 2 },
  ]

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0
    
    // Check if adding one more would exceed stock
    if (currentQuantity >= item.stock) {
      alert(`لا يوجد مخزون كافي من ${item.name}. المتوفر: ${item.stock}`)
      return
    }
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ))
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const vat = subtotal * 0.15
  const total = subtotal + vat - discount

  const handleCheckout = () => {
    if (cart.length === 0) return
    
    const order = {
      id: Date.now(),
      items: cart,
      mode: selectedMode,
      customerPhone,
      subtotal,
      vat,
      discount,
      total,
      timestamp: new Date().toISOString(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`
    }
    
    // Store order in localStorage for printing
    localStorage.setItem('lastOrder', JSON.stringify(order))
    
    // Update inventory (simulate stock reduction)
    const updatedItems = menuItems.map(item => {
      const cartItem = cart.find(cartItem => cartItem.id === item.id)
      if (cartItem) {
        return { ...item, stock: Math.max(0, item.stock - cartItem.quantity) }
      }
      return item
    })
    
    // Save updated inventory
    localStorage.setItem('inventory', JSON.stringify(updatedItems))
    
    // Add order to orders list
    const newOrder = {
      id: order.id,
      customer: customerPhone ? `عميل ${customerPhone}` : 'عميل بدون رقم',
      phone: customerPhone || '',
      items: cart.map(item => item.name),
      total: order.total,
      status: 'pending',
      timestamp: new Date().toLocaleString('ar-SA'),
      mode: order.mode
    }
    
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    existingOrders.unshift(newOrder)
    localStorage.setItem('orders', JSON.stringify(existingOrders))
    
    // Clear cart
    setCart([])
    setCustomerPhone('')
    setDiscount(0)
    
    // Navigate to print page
    window.location.href = `/print/${order.id}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">نقطة البيع</h1>
              <p className="text-sm text-gray-500 english">Point of Sale</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 arabic mb-4">قائمة الطعام</h2>
              
              {/* Mode Selection */}
              <div className="flex space-x-4 mb-6">
                {[
                  { value: 'dine-in', label: 'تناول في المطعم', labelEn: 'Dine In' },
                  { value: 'takeaway', label: 'طلب خارجي', labelEn: 'Takeaway' },
                  { value: 'delivery', label: 'توصيل', labelEn: 'Delivery' }
                ].map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedMode === mode.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <span className="arabic">{mode.label}</span>
                    <br />
                    <span className="english text-xs">{mode.labelEn}</span>
                  </button>
                ))}
              </div>

              {/* Customer Phone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  رقم الهاتف (اختياري)
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => addToCart(item)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 arabic">{item.name}</h3>
                      <p className="text-sm text-gray-500 english">{item.nameEn}</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{item.price.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400 uppercase">{item.category}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.stock <= 5 ? 'bg-red-100 text-red-800' : 
                        item.stock <= 10 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.stock} متوفر
                      </span>
                    </div>
                    <button 
                      className={`px-3 py-1 rounded-md text-sm ${
                        item.stock === 0 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={item.stock === 0}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 arabic mb-4">سلة الطلبات</h2>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 arabic text-center py-8">السلة فارغة</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 arabic">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.price.toFixed(2)} SAR</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 p-1 rounded hover:bg-gray-300"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="bg-gray-200 text-gray-700 p-1 rounded hover:bg-gray-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="bg-red-200 text-red-700 p-1 rounded hover:bg-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Discount */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                      خصم
                    </label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="arabic">المجموع الفرعي:</span>
                      <span>{subtotal.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="arabic">ضريبة القيمة المضافة (15%):</span>
                      <span>{vat.toFixed(2)} SAR</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span className="arabic">خصم:</span>
                        <span>-{discount.toFixed(2)} SAR</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="arabic">المجموع الكلي:</span>
                      <span>{total.toFixed(2)} SAR</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed arabic font-semibold"
                  >
                    إتمام الطلب
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Orders Page Component
/* removed: OrdersPage */
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
}

// Kitchen Page Component
/* removed: KitchenPage */
  const [orders] = useState([
    { id: 'ORD-001', items: ['شاورما دجاج كبير', '7UP'], status: 'preparing', time: '14:30', table: 'T-01' },
    { id: 'ORD-002', items: ['برجر لحم', 'بطاطس مقلية'], status: 'pending', time: '14:25', table: 'T-05' },
    { id: 'ORD-003', items: ['شاورما لحم كبير', 'سلطة خضراء'], status: 'ready', time: '14:20', table: 'T-03' }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">المطبخ</h1>
              <p className="text-sm text-gray-500 english">Kitchen Display</p>
            </div>
            <button onClick={() => window.history.back()} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 arabic">العودة</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['pending', 'preparing', 'ready'].map(status => (
            <div key={status} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 arabic mb-4">
                {status === 'pending' ? 'في الانتظار' : status === 'preparing' ? 'قيد التحضير' : 'جاهز للتسليم'}
              </h2>
              <div className="space-y-4">
                {orders.filter(order => order.status === status).map(order => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">{order.id}</span>
                      <span className="text-sm text-gray-500">{order.time}</span>
                    </div>
                    <div className="text-sm text-gray-600 arabic mb-2">
                      {order.items.join('، ')}
                    </div>
                    <div className="text-xs text-gray-500">طاولة: {order.table}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Inventory Page Component
/* removed: InventoryPage */
  const [items, setItems] = useState([
    { id: 1, name: 'دجاج', nameEn: 'Chicken', stock: 50, unit: 'كيلو', minStock: 10, price: 25.00, category: 'main' },
    { id: 2, name: 'لحم', nameEn: 'Beef', stock: 30, unit: 'كيلو', minStock: 5, price: 35.00, category: 'main' },
    { id: 3, name: 'خبز', nameEn: 'Bread', stock: 100, unit: 'قطعة', minStock: 20, price: 1.00, category: 'bread' },
    { id: 4, name: 'بطاطس', nameEn: 'Potatoes', stock: 5, unit: 'كيلو', minStock: 10, price: 8.00, category: 'sides' }
  ])
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    nameEn: '',
    stock: 0,
    unit: 'قطعة',
    minStock: 0,
    price: 0,
    category: 'main'
  })

  const addNewItem = () => {
    if (newItem.name && newItem.nameEn && newItem.price > 0) {
      const item = {
        id: Date.now(),
        ...newItem
      }
      setItems([...items, item])
      setNewItem({
        name: '',
        nameEn: '',
        stock: 0,
        unit: 'قطعة',
        minStock: 0,
        price: 0,
        category: 'main'
      })
      setShowAddForm(false)
      alert('تم إضافة الصنف بنجاح!')
    } else {
      alert('يرجى ملء جميع الحقول المطلوبة')
    }
  }

  const updateStock = (itemId, newStock) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, stock: newStock } : item
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">المخزون</h1>
              <p className="text-sm text-gray-500 english">Inventory Management</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 arabic"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                إضافة صنف
              </button>
              <button onClick={() => window.history.back()} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 arabic">العودة</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Item Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 arabic mb-4">إضافة صنف جديد</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 arabic mb-2">الاسم بالعربية</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم الصنف"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 arabic mb-2">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={newItem.nameEn}
                    onChange={(e) => setNewItem({...newItem, nameEn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Item Name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 arabic mb-2">السعر (ريال)</label>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 arabic mb-2">الوحدة</label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="قطعة">قطعة</option>
                      <option value="كيلو">كيلو</option>
                      <option value="لتر">لتر</option>
                      <option value="صندوق">صندوق</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 arabic mb-2">الكمية المتاحة</label>
                    <input
                      type="number"
                      value={newItem.stock}
                      onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 arabic mb-2">الحد الأدنى</label>
                    <input
                      type="number"
                      value={newItem.minStock}
                      onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 arabic mb-2">الفئة</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="main">أطباق رئيسية</option>
                    <option value="drinks">مشروبات</option>
                    <option value="sides">أطباق جانبية</option>
                    <option value="bread">خبز</option>
                    <option value="desserts">حلويات</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic"
                >
                  إلغاء
                </button>
                <button
                  onClick={addNewItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 arabic">قائمة المخزون</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الصنف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">السعر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الكمية المتاحة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الحد الأدنى</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 arabic">{item.name}</div>
                        <div className="text-sm text-gray-500 english">{item.nameEn}</div>
                        <div className="text-xs text-gray-400 uppercase">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.price.toFixed(2)} SAR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateStock(item.id, item.stock - 1)}
                          className="bg-gray-200 text-gray-700 p-1 rounded hover:bg-gray-300"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm text-gray-900 w-12 text-center">{item.stock}</span>
                        <button
                          onClick={() => updateStock(item.id, item.stock + 1)}
                          className="bg-gray-200 text-gray-700 p-1 rounded hover:bg-gray-300"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <span className="text-xs text-gray-500">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.stock <= item.minStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.stock <= item.minStock ? 'نفد المخزون' : 'متوفر'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 arabic">تعديل</button>
                        <button className="text-red-600 hover:text-red-900 arabic">حذف</button>
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
}

// Customers Page Component
/* removed: CustomersPage */
  const [customers, setCustomers] = useState([
    { id: 1, name: 'أحمد محمد', phone: '0501234567', email: 'ahmed@example.com', orders: 15, totalSpent: 450.00 },
    { id: 2, name: 'فاطمة أحمد', phone: '0507654321', email: 'fatima@example.com', orders: 8, totalSpent: 280.00 },
    { id: 3, name: 'محمد علي', phone: '0509876543', email: 'mohammed@example.com', orders: 22, totalSpent: 650.00 }
  ])
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  })

  const [searchTerm, setSearchTerm] = useState('')

  const addNewCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      const customer = {
        id: Date.now(),
        ...newCustomer,
        orders: 0,
        totalSpent: 0.00
      }
      setCustomers([...customers, customer])
      setNewCustomer({ name: '', phone: '', email: '' })
      setShowAddForm(false)
      alert('تم إضافة العميل بنجاح!')
    } else {
      alert('يرجى ملء الاسم ورقم الهاتف')
    }
  }

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">العملاء</h1>
              <p className="text-sm text-gray-500 english">Customer Management</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 arabic"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                إضافة عميل
              </button>
              <button onClick={() => window.history.back()} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 arabic">العودة</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Customer Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 arabic mb-4">إضافة عميل جديد</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 arabic mb-2">الاسم</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم العميل"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 arabic mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 arabic mb-2">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@example.com"
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic"
                >
                  إلغاء
                </button>
                <button
                  onClick={addNewCustomer}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="البحث بالاسم، رقم الهاتف، أو البريد الإلكتروني"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 arabic">
              قاعدة بيانات العملاء ({filteredCustomers.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الاسم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الهاتف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">البريد الإلكتروني</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">عدد الطلبات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">إجمالي المشتريات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 arabic">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.totalSpent.toFixed(2)} SAR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 arabic">عرض</button>
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
}


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
