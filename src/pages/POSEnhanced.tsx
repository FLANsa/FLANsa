import React, { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, Phone, Printer, CreditCard, Receipt, ShoppingCart, User, Percent, Calculator, CheckCircle, AlertCircle, RefreshCw, Package } from 'lucide-react'
import { parseNumber, formatToEnglish, formatCurrencyEnglish, cleanNumberInput, isValidNumberInput } from '../utils/numberUtils'

const POSEnhanced: React.FC = () => {
  const [cart, setCart] = useState([])
  const [selectedMode, setSelectedMode] = useState('dine-in')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discount, setDiscount] = useState(0)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [receivedAmount, setReceivedAmount] = useState(0)
  const [change, setChange] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [menuItems, setMenuItems] = useState([])

  // Load products from localStorage and listen for changes
  useEffect(() => {
    const loadProducts = () => {
      const savedInventory = localStorage.getItem('inventory')
      if (savedInventory) {
        setMenuItems(JSON.parse(savedInventory))
      } else {
        // Default products if none exist
        const defaultProducts = [
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
        setMenuItems(defaultProducts)
        localStorage.setItem('inventory', JSON.stringify(defaultProducts))
      }
    }

    // Load products on component mount
    loadProducts()

    // Listen for storage changes (when products are updated from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'inventory') {
        loadProducts()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check for changes every 2 seconds (for same-tab updates)
    const interval = setInterval(loadProducts, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Manual refresh function
  const refreshProducts = () => {
    setIsRefreshing(true)
    const savedInventory = localStorage.getItem('inventory')
    if (savedInventory) {
      const products = JSON.parse(savedInventory)
      setMenuItems(products)
      alert(`تم تحديث المنتجات! تم تحميل ${products.length} منتج`)
    } else {
      alert('لا توجد منتجات محفوظة')
    }
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Calculate totals (price includes VAT, so we need to extract VAT from total)
  const totalWithVat = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const subtotal = totalWithVat / 1.15 // Extract subtotal from VAT-inclusive price
  const vat = totalWithVat - subtotal // Calculate VAT amount
  const total = totalWithVat - discount

  // Update change when received amount changes
  useEffect(() => {
    setChange(Math.max(0, receivedAmount - total))
  }, [receivedAmount, total])

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0
    
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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('السلة فارغة. أضف أصناف للبدء')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const order = {
        id: Date.now(),
        items: cart,
        mode: selectedMode,
        customerPhone,
        subtotal,
        vat,
        discount,
        total,
        paymentMethod,
        receivedAmount,
        change,
        timestamp: new Date().toISOString(),
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`
      }
      
      // Store order for printing
      localStorage.setItem('lastOrder', JSON.stringify(order))
      
      // Update inventory
      const updatedItems = menuItems.map(item => {
        const cartItem = cart.find(cartItem => cartItem.id === item.id)
        if (cartItem) {
          return { ...item, stock: Math.max(0, item.stock - cartItem.quantity) }
        }
        return item
      })
      
      // Save updated inventory to localStorage
      localStorage.setItem('inventory', JSON.stringify(updatedItems))
      setMenuItems(updatedItems)
      
      // Add to orders
      const newOrder = {
        id: order.id,
        customer: customerPhone ? `عميل ${customerPhone}` : 'عميل بدون رقم',
        phone: customerPhone || '',
        items: cart.map(item => ({
          name: item.name,
          nameEn: item.nameEn,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: order.subtotal,
        vat: order.vat,
        total: order.total,
        status: 'completed',
        timestamp: new Date().toISOString(),
        mode: order.mode,
        paymentMethod: order.paymentMethod
      }
      
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      existingOrders.unshift(newOrder)
      localStorage.setItem('orders', JSON.stringify(existingOrders))
      
      // Clear cart and reset
      setCart([])
      setCustomerPhone('')
      setDiscount(0)
      setReceivedAmount(0)
      setChange(0)
      setShowPaymentModal(false)
      
      // Show success message
      alert('تم إتمام البيع بنجاح! جاري فتح صفحة الطباعة...')
      
      // Navigate to print page
      window.location.href = `/print/${order.id}`
      
    } catch (error) {
      console.error('Error processing order:', error)
      alert('حدث خطأ أثناء معالجة الطلب. حاول مرة أخرى.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'main': return 'bg-red-100 text-red-800'
      case 'drinks': return 'bg-blue-100 text-blue-800'
      case 'sides': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockColor = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800'
    if (stock <= 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div>
              <h1 className="text-2xl font-extrabold arabic">نقطة البيع</h1>
              <p className="text-sm/6 opacity-90 english">Point of Sale</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium arabic">
                  {JSON.parse(localStorage.getItem('user') || '{}').name || 'مستخدم'}
                </p>
                <p className="text-xs/5 opacity-90">
                  {JSON.parse(localStorage.getItem('user') || '{}').role || 'role'}
                </p>
              </div>
              <button
                onClick={() => window.history.back()}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md text-sm backdrop-blur arabic transition"
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
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-wrap gap-3">
                {/* Mode Selection */}
                <div className="flex space-x-2">
                  {[
                    { value: 'dine-in', label: 'محلي', labelEn: 'Dine In', icon: '🍽️' },
                    { value: 'takeaway', label: 'سفري', labelEn: 'Takeaway', icon: '🥡' },
                    { value: 'delivery', label: 'توصيل', labelEn: 'Delivery', icon: '🚚' }
                  ].map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => setSelectedMode(mode.value)}
                      className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
                        selectedMode === mode.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <span className="arabic">{mode.label}</span>
                    </button>
                  ))}
                </div>

                {/* Quick Buttons */}
                {/* removed quick actions: customer, discount, refresh products, manage products */}

                {cart.length > 0 && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 flex items-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span className="arabic">دفع</span>
                  </button>
                )}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-lg transition-all duration-200 cursor-pointer ring-1 ring-gray-100 hover:-translate-y-1"
                  onClick={() => addToCart(item)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 arabic text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500 english">{item.nameEn}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-white bg-blue-600 rounded-lg px-2 py-0.5 inline-block">{formatToEnglish(item.price)}</span>
                      <p className="text-xs text-gray-500">SAR (شامل الضريبة)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStockColor(item.stock)}`}>
                        {formatToEnglish(item.stock)} متوفر
                      </span>
                    </div>
                    <button 
                      className={`px-3 py-1 rounded-md text-sm flex items-center space-x-1 ${
                        item.stock === 0 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={item.stock === 0}
                    >
                      <Plus className="h-4 w-4" />
                      <span>أضف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-4 ring-1 ring-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 arabic flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  سلة الطلبات
                </h2>
                {cart.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {cart.length} أصناف
                  </span>
                )}
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 arabic">السلة فارغة</p>
                  <p className="text-sm text-gray-400 arabic mb-4">أضف أصناف للبدء</p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 arabic"
                  >
                    استعرض المنتجات
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Items */}
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between border-b pb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 arabic">{item.name}</h4>
                          <p className="text-sm text-gray-500">{formatToEnglish(item.price)} SAR (شامل الضريبة)</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="bg-gray-200 text-gray-700 p-1 rounded hover:bg-gray-300"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{formatToEnglish(item.quantity)}</span>
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
                  </div>
                  
                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="arabic">المجموع (شامل الضريبة):</span>
                      <span className="font-medium">{formatToEnglish(totalWithVat)} SAR</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="arabic">المجموع الفرعي:</span>
                      <span className="font-medium">{formatToEnglish(subtotal)} SAR</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="arabic">ضريبة القيمة المضافة (15%):</span>
                      <span className="font-medium">{formatToEnglish(vat)} SAR</span>
                    </div>
                    {/* removed discount row */}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="arabic">المجموع الكلي:</span>
                      <span className="text-green-600">{formatToEnglish(total)} SAR</span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {/* removed customer info row */}

                  {/* Checkout Button */}
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={cart.length === 0}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed arabic font-semibold flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>إتمام البيع</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {false && showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 arabic mb-4">معلومات العميل</h3>
            <div className="space-y-4">
              <div>
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
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic"
              >
                إلغاء
              </button>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {false && showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 arabic mb-4">تطبيق خصم</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  مبلغ الخصم (ريال)
                </label>
                <input
                  type="text"
                  value={discount > 0 ? discount.toString() : ''}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value)
                    if (!isNaN(value) && value >= 0 && value <= subtotal) {
                      setDiscount(value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>
              <div className="text-sm text-gray-600 arabic">
                المجموع (شامل الضريبة): {formatToEnglish(totalWithVat)} SAR
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setDiscount(0)
                  setShowDiscountModal(false)
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic"
              >
                إلغاء
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 arabic mb-4">إتمام الدفع</h3>
            
            <div className="space-y-4">
              {/* Total Amount */}
              <div className="bg-green-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 arabic">المبلغ المطلوب:</span>
                  <span className="text-2xl font-bold text-green-600">{formatToEnglish(total)} SAR</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  طريقة الدفع
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: 'نقداً', icon: '💵' },
                    { value: 'card', label: 'بطاقة', icon: '💳' }
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-3 rounded-md border-2 flex items-center justify-center space-x-2 ${
                        paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span>{method.icon}</span>
                      <span className="arabic">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Received Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  المبلغ المستلم
                </label>
                <input
                  type="text"
                  value={receivedAmount > 0 ? receivedAmount.toString() : ''}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value)
                    if (!isNaN(value) && value >= 0) {
                      setReceivedAmount(value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              {/* Change */}
              {change > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 arabic">المبلغ المتبقي:</span>
                    <span className="text-lg font-bold text-blue-600">{formatToEnglish(change)} SAR</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic"
              >
                إلغاء
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing || (paymentMethod === 'cash' && receivedAmount < total)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed arabic flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>إتمام البيع</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default POSEnhanced
