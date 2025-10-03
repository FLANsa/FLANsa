import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2, Phone, CreditCard, CheckCircle, ShoppingCart, X } from 'lucide-react'
import { generateUUID } from '../lib/zatca'
import { parseNumber, formatToEnglish } from '../utils/numberUtils'
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { authService } from '../lib/authService'
import { itemService, Item } from '../lib/firebaseServices'

// Define cart item type
interface CartItem extends Item {
  quantity: number
}

const POSEnhanced: React.FC = () => {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartItem[]>([])
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

  const [menuItems, setMenuItems] = useState<Item[]>([])

  // Load products from Firebase filtered by tenant
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const tenantId = authService.getCurrentTenantId()
        if (!tenantId) {
          console.log('No tenant ID found, using empty menu')
          setMenuItems([])
          return
        }

        console.log('Loading products for tenant:', tenantId)
        const items = await itemService.getActiveItemsByTenant(tenantId)
        console.log('Loaded products for POS:', items.length, 'items')
        setMenuItems(items)

        // Also save to localStorage for offline access
        localStorage.setItem('inventory', JSON.stringify(items))
      } catch (error) {
        console.error('Error loading products for POS:', error)
        // Fallback to localStorage if Firebase fails
        const savedInventory = localStorage.getItem('inventory')
        if (savedInventory) {
          setMenuItems(JSON.parse(savedInventory))
        } else {
          setMenuItems([])
        }
      }
    }

    // Load products on component mount
    loadProducts()

    // Listen for storage changes (when products are updated from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inventory') {
        loadProducts()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check for changes every 5 seconds (for same-tab updates)
    const interval = setInterval(loadProducts, 5000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])


  // Calculate totals (price includes VAT, so we need to extract VAT from total)
  const totalWithVat = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const subtotal = totalWithVat / 1.15 // Extract subtotal from VAT-inclusive price
  const vat = totalWithVat - subtotal // Calculate VAT amount
  const total = totalWithVat - discount

  // Update change when received amount changes
  useEffect(() => {
    setChange(Math.max(0, receivedAmount - total))
  }, [receivedAmount, total])

  const addToCart = (item: Item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0
    
    if (currentQuantity >= item.stock) {
      alert(`لا يوجد مخزون كافي من ${item.nameAr || item.name}. المتوفر: ${item.stock}`)
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

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
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
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        uuid: generateUUID()
      }
      
      // Try to save to Firebase first
      try {
        const tenantId = authService.getCurrentTenantId()
        const currentUser = authService.getCurrentUser()
        
        const orderData = {
        tenantId: tenantId,
        items: cart.map(item => ({
          nameAr: item.nameAr || item.name,
          nameEn: item.name || item.nameEn,
          price: item.price,
          quantity: item.quantity,
          itemId: item.id
        })),
          mode: selectedMode,
          customerPhone,
          subtotal,
          vat,
          discount,
          total,
          paymentMethod,
          receivedAmount,
          change,
          status: 'completed',
          uuid: generateUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          invoiceNumber: order.invoiceNumber,
          branchId: 'main',
          terminalId: 'pos-1',
          cashierId: currentUser?.id || 'cashier-1'
        }

        const docRef = await addDoc(collection(db, 'orders'), orderData)
        
        // Update inventory stock in Firebase
        for (const cartItem of cart) {
          try {
            const itemDoc = doc(db, 'items', cartItem.id)
            await updateDoc(itemDoc, {
              stock: Math.max(0, (cartItem.stock || 100) - cartItem.quantity),
              updatedAt: new Date()
            })
          } catch (error) {
            console.error(`Error updating stock for item ${cartItem.id}:`, error)
          }
        }
        
        console.log('Order saved to Firebase:', docRef.id)
      } catch (firebaseError) {
        console.error('Firebase save failed, continuing with localStorage only:', firebaseError)
      }
      
      // Store order for printing
      localStorage.setItem('lastOrder', JSON.stringify(order))
      
      // Update inventory locally
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
          name: item.nameAr || item.name,
          nameEn: item.name || item.nameEn,
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
      navigate(`/print/${order.id}`)
      
    } catch (error) {
      console.error('Error processing order:', error)
      alert('حدث خطأ أثناء معالجة الطلب. حاول مرة أخرى.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'main': return 'bg-red-100 text-red-800'
      case 'drinks': return 'bg-blue-100 text-blue-800'
      case 'sides': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <div className="bg-gradient-to-l from-emerald-700 to-green-600 rounded-2xl shadow-lg border border-emerald-600 p-6 mb-6">
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
                          ? 'bg-white text-emerald-700'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <span className="arabic">{mode.label}</span>
                    </button>
                  ))}
                </div>

                {/* Quick Buttons */}
                {/* removed quick actions: customer, discount, refresh products, manage products */}

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
                  {/* Product Image */}
                  <div className="mb-3">
                    {item.imageUrl ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.nameAr || item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-white/90 text-gray-700 font-medium">
                            {item.category || 'غير مصنف'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500 arabic mr-2">لا توجد صورة</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 arabic text-lg">{item.nameAr || item.name}</h3>
                      <p className="text-sm text-gray-500 english">{item.name || item.nameEn}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-white bg-emerald-600 rounded-lg px-2 py-0.5 inline-block">{formatToEnglish(item.price)}</span>
                      <p className="text-xs text-gray-500">SAR (شامل الضريبة)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                    <button 
                      className="px-3 py-1 rounded-md text-sm flex items-center space-x-1 bg-emerald-600 text-white hover:bg-emerald-700"
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
                        <div className="flex items-center space-x-3">
                          {/* Product Image in Cart */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.nameAr || item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 arabic">{item.nameAr || item.name}</h4>
                            <p className="text-xs text-gray-500 english">{item.name || item.nameEn}</p>
                            <p className="text-sm text-gray-500">{formatToEnglish(item.price)} SAR (شامل الضريبة)</p>
                          </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold arabic">إتمام الدفع</h3>
                    <p className="text-sm text-white/80 arabic">أكمل عملية البيع</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Total Amount */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-semibold text-gray-900 arabic block">المبلغ المطلوب</span>
                    <span className="text-sm text-gray-600 arabic">شامل الضريبة</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-green-600">{formatToEnglish(total)}</span>
                    <span className="text-sm text-gray-600 block">ريال سعودي</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 arabic mb-3">
                  طريقة الدفع
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'نقداً', icon: '💵', color: 'from-green-500 to-emerald-500' },
                    { value: 'card', label: 'بطاقة', icon: '💳', color: 'from-blue-500 to-indigo-500' }
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        paymentMethod === method.value
                          ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-2xl">{method.icon}</span>
                        <span className="font-semibold text-gray-900 arabic">{method.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Received Amount */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 arabic mb-3">
                    المبلغ المستلم
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={receivedAmount > 0 ? receivedAmount.toString() : ''}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        // السماح بمسح الحقل أو إدخال أرقام صحيحة
                        if (inputValue === '' || inputValue === '0') {
                          setReceivedAmount(0)
                        } else {
                          const value = parseNumber(inputValue)
                          if (!isNaN(value) && value >= 0) {
                            setReceivedAmount(value)
                          }
                        }
                      }}
                      className="w-lg px-3 py-2 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-medium"
                      placeholder="0.00"
                      dir="ltr"
                    />
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">SAR</span>
                  </div>
                </div>
              )}

              {/* Change */}
              {change > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold text-gray-900 arabic block">المبلغ المتبقي</span>
                      <span className="text-sm text-gray-600 arabic">المبلغ المرتجح للعميل</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">{formatToEnglish(change)}</span>
                      <span className="text-sm text-gray-600 block">ريال سعودي</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 arabic mb-3">ملخص الطلب</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 arabic">عدد الأصناف:</span>
                    <span className="font-semibold">{cart.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 arabic">طريقة الدفع:</span>
                    <span className="font-semibold arabic">{paymentMethod === 'cash' ? 'نقداً' : 'بطاقة'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-semibold arabic transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing || (paymentMethod === 'cash' && receivedAmount < total)}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed arabic flex items-center space-x-2 font-semibold shadow-lg transition-all duration-200"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
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