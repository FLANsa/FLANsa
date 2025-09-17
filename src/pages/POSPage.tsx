import React, { useState } from 'react'
import { Plus, Minus, Trash2, Phone, Printer } from 'lucide-react'
import { useAuth } from '../hooks/useFirebase'
import { useItems } from '../hooks/useFirebase'
import { useOrders } from '../hooks/useFirebase'
import { useCustomers } from '../hooks/useFirebase'

const POSPage: React.FC = () => {
  const { user } = useAuth()
  const { items, updateStock } = useItems()
  const { addOrder } = useOrders()
  const { customers, addCustomer } = useCustomers()
  
  const [cart, setCart] = useState([])
  const [selectedMode, setSelectedMode] = useState('dine-in')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)

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

  const handleCheckout = async () => {
    if (cart.length === 0) return
    
    setLoading(true)
    
    try {
      // Create or find customer
      let customerId = null
      if (customerPhone) {
        const existingCustomer = customers.find(c => c.phone === customerPhone)
        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          // Create new customer
          customerId = await addCustomer({
            name: `عميل ${customerPhone}`,
            phone: customerPhone,
            email: ''
          })
        }
      }

      // Create order
      const orderData = {
        customerId,
        customerName: customerPhone ? `عميل ${customerPhone}` : 'عميل بدون رقم',
        customerPhone: customerPhone || '',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          nameEn: item.nameEn,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal,
        vat,
        discount,
        total,
        mode: selectedMode,
        status: 'pending',
        paymentMethod: 'cash',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        branchId: user?.branchId || 'main',
        terminalId: user?.terminalId || 'terminal-1',
        cashierId: user?.id || ''
      }

      const orderId = await addOrder(orderData)

      // Update stock
      for (const cartItem of cart) {
        const newStock = Math.max(0, cartItem.stock - cartItem.quantity)
        await updateStock(cartItem.id, newStock)
      }

      // Store order for printing
      localStorage.setItem('lastOrder', JSON.stringify({
        id: orderId,
        ...orderData,
        timestamp: new Date().toISOString()
      }))

      // Clear cart
      setCart([])
      setCustomerPhone('')
      setDiscount(0)

      // Navigate to print page
      window.location.href = `/print/${orderId}`
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('حدث خطأ أثناء إنشاء الطلب. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
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
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 arabic">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
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
              {items.map(item => (
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
                    disabled={cart.length === 0 || loading}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed arabic font-semibold"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        جاري المعالجة...
                      </div>
                    ) : (
                      'إتمام الطلب'
                    )}
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

export default POSPage
