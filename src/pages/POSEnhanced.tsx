import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Category, Item } from '../types'
import { usePOSStore } from '../stores/posStore'
import LoadingSpinner from '../components/LoadingSpinner'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Users, Home, Truck } from 'lucide-react'
import { formatCurrency, getCartItemCount } from '../lib/utils'

export default function POSEnhanced() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const {
    cart,
    selectedCustomer,
    orderMode,
    tableNumber,
    orderDiscount,
    orderDiscountType,
    serviceCharge,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    setSelectedCustomer,
    setOrderMode,
    setTableNumber,
    setOrderDiscount,
    setServiceCharge,
    getCartSubtotal,
    getCartVAT,
    getCartTotal,
    getCartItemCount: getItemCount
  } = usePOSStore()

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const categoriesRef = collection(db, 'categories')
      const q = query(categoriesRef, where('isActive', '==', true), orderBy('sortOrder'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Category[]
    }
  })

  // Fetch items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items', selectedCategory],
    queryFn: async () => {
      const itemsRef = collection(db, 'items')
      let q = query(itemsRef, where('isActive', '==', true), where('isAvailable', '==', true))
      
      if (selectedCategory) {
        q = query(q, where('categoryId', '==', selectedCategory))
      }
      
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Item[]
    }
  })

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nameAr.includes(searchTerm) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddToCart = (item: Item) => {
    const cartItem = {
      id: `${item.id}-${Date.now()}`,
      itemId: item.id,
      name: item.name,
      nameAr: item.nameAr,
      price: item.price,
      quantity: 1,
      modifiers: [],
      notes: ''
    }
    addToCart(cartItem)
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
    } else {
      updateCartItemQuantity(itemId, newQuantity)
    }
  }

  const handleCheckout = () => {
    // This would typically navigate to a checkout page or open a modal
    console.log('Checkout:', {
      cart,
      selectedCustomer,
      orderMode,
      tableNumber,
      orderDiscount,
      orderDiscountType,
      serviceCharge,
      subtotal: getCartSubtotal(),
      vat: getCartVAT(),
      total: getCartTotal()
    })
  }

  if (categoriesLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Panel - Menu */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="البحث في القائمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 arabic"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            الكل
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.nameAr}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleAddToCart(item)}
            >
              {item.image && (
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-medium text-gray-900 arabic mb-1">
                {item.nameAr}
              </h3>
              <p className="text-xs text-gray-500 english mb-2">
                {item.name}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(item.price)}
                </span>
                <button className="p-1 bg-primary-100 text-primary-600 rounded-full hover:bg-primary-200">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
          {/* Cart Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 arabic">
              السلة ({getItemCount()})
            </h2>
            <button
              onClick={clearCart}
              className="text-gray-400 hover:text-gray-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          {/* Order Mode */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 arabic mb-2">
              نوع الطلب
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setOrderMode('dine-in')}
                className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                  orderMode === 'dine-in'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Home className="h-4 w-4 mx-auto mb-1" />
                في المطعم
              </button>
              <button
                onClick={() => setOrderMode('takeaway')}
                className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                  orderMode === 'takeaway'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Truck className="h-4 w-4 mx-auto mb-1" />
                طلب خارجي
              </button>
              <button
                onClick={() => setOrderMode('delivery')}
                className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                  orderMode === 'delivery'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Truck className="h-4 w-4 mx-auto mb-1" />
                توصيل
              </button>
            </div>
          </div>

          {/* Table Number (for dine-in) */}
          {orderMode === 'dine-in' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                رقم الطاولة
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="أدخل رقم الطاولة"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 arabic"
              />
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="arabic">السلة فارغة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 arabic">
                        {item.nameAr}
                      </h4>
                      <p className="text-sm text-gray-500 english">
                        {item.name}
                      </p>
                      <p className="text-sm font-medium text-primary-600">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="arabic">المجموع الفرعي:</span>
                <span>{formatCurrency(getCartSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="arabic">ضريبة القيمة المضافة (15%):</span>
                <span>{formatCurrency(getCartVAT())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span className="arabic">المجموع الكلي:</span>
                <span className="text-primary-600">{formatCurrency(getCartTotal())}</span>
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full mt-4 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <CreditCard className="h-5 w-5" />
            <span className="arabic">الدفع</span>
          </button>
        </div>
      </div>
    </div>
  )
}