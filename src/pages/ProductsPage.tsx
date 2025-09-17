import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, Save, X, Package, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react'
import { parseNumber, formatToEnglish, formatCurrencyEnglish, cleanNumberInput, isValidNumberInput } from '../utils/numberUtils'

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    price: '',
    category: 'main',
    stock: '',
    description: ''
  })

  const categories = [
    { value: 'main', label: 'الأطباق الرئيسية', labelEn: 'Main Dishes' },
    { value: 'drinks', label: 'المشروبات', labelEn: 'Drinks' },
    { value: 'sides', label: 'الأطباق الجانبية', labelEn: 'Sides' },
    { value: 'desserts', label: 'الحلويات', labelEn: 'Desserts' },
    { value: 'appetizers', label: 'المقبلات', labelEn: 'Appetizers' }
  ]

  // Load products from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('inventory')
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
    }
  }, [])

  // Save products to localStorage
  const saveProducts = (newProducts) => {
    setProducts(newProducts)
    localStorage.setItem('inventory', JSON.stringify(newProducts))
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = () => {
    if (!formData.name || !formData.price) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setLoading(true)
    
    const newProduct = {
      id: Date.now(),
      name: formData.name,
      nameEn: formData.nameEn || formData.name,
      price: parseNumber(formData.price),
      category: formData.category,
      stock: parseInt(parseNumber(formData.stock).toString()) || 0,
      description: formData.description || '',
      createdAt: new Date().toISOString()
    }

    const updatedProducts = [...products, newProduct]
    saveProducts(updatedProducts)
    
    // Reset form
    setFormData({
      name: '',
      nameEn: '',
      price: '',
      category: 'main',
      stock: '',
      description: ''
    })
    setShowAddModal(false)
    setLoading(false)
    
    alert('تم إضافة المنتج بنجاح!')
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      nameEn: product.nameEn,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      description: product.description || ''
    })
    setShowAddModal(true)
  }

  const handleUpdateProduct = () => {
    if (!formData.name || !formData.price) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setLoading(true)
    
    const updatedProducts = products.map(product =>
      product.id === editingProduct.id
        ? {
            ...product,
            name: formData.name,
            nameEn: formData.nameEn || formData.name,
            price: parseNumber(formData.price),
            category: formData.category,
            stock: parseInt(parseNumber(formData.stock).toString()) || 0,
            description: formData.description || '',
            updatedAt: new Date().toISOString()
          }
        : product
    )
    
    saveProducts(updatedProducts)
    
    // Reset form
    setFormData({
      name: '',
      nameEn: '',
      price: '',
      category: 'main',
      stock: '',
      description: ''
    })
    setEditingProduct(null)
    setShowAddModal(false)
    setLoading(false)
    
    alert('تم تحديث المنتج بنجاح!')
  }

  const handleDeleteProduct = (productId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      const updatedProducts = products.filter(product => product.id !== productId)
      saveProducts(updatedProducts)
      alert('تم حذف المنتج بنجاح!')
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'main': return 'bg-red-100 text-red-800'
      case 'drinks': return 'bg-blue-100 text-blue-800'
      case 'sides': return 'bg-green-100 text-green-800'
      case 'desserts': return 'bg-purple-100 text-purple-800'
      case 'appetizers': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockColor = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800'
    if (stock <= 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">إدارة المنتجات</h1>
              <p className="text-sm text-gray-500 english">Products Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 arabic">
                  {JSON.parse(localStorage.getItem('user') || '{}').name || 'مستخدم'}
                </p>
                <p className="text-xs text-gray-500">
                  {JSON.parse(localStorage.getItem('user') || '{}').role || 'role'}
                </p>
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
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 arabic"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 arabic"
                >
                  <option value="all">جميع الفئات</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Product Button */}
            <button
              onClick={() => {
                setEditingProduct(null)
                setFormData({
                  name: '',
                  nameEn: '',
                  price: '',
                  category: 'main',
                  stock: '',
                  description: ''
                })
                setShowAddModal(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة منتج جديد</span>
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 arabic mb-2">
                {searchTerm || filterCategory !== 'all' ? 'لا توجد نتائج' : 'لا توجد منتجات'}
              </h3>
              <p className="text-gray-500 arabic">
                {searchTerm || filterCategory !== 'all' 
                  ? 'جرب تغيير معايير البحث' 
                  : 'ابدأ بإضافة منتج جديد'
                }
              </p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 arabic">{product.name}</h3>
                    <p className="text-sm text-gray-500 english">{product.nameEn}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 arabic mt-1">{product.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-blue-600">{formatToEnglish(product.price)}</span>
                    <p className="text-xs text-gray-500">SAR (شامل الضريبة)</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(product.category)}`}>
                      {categories.find(cat => cat.value === product.category)?.label || product.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStockColor(product.stock)}`}>
                      {formatToEnglish(product.stock)} متوفر
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm arabic flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm arabic flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 arabic mb-4">
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  اسم المنتج (عربي) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 arabic"
                  placeholder="مثال: شاورما دجاج"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 english mb-2">
                  Product Name (English)
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Example: Chicken Shawarma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  السعر (ريال سعودي) *
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value
                    if (isValidNumberInput(value)) {
                      setFormData({ ...formData, price: value })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  الفئة
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 arabic"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  الكمية المتوفرة
                </label>
                <input
                  type="text"
                  value={formData.stock}
                  onChange={(e) => {
                    const value = e.target.value
                    if (isValidNumberInput(value)) {
                      setFormData({ ...formData, stock: value })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 arabic"
                  placeholder="وصف المنتج..."
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingProduct(null)
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic"
              >
                إلغاء
              </button>
              <button
                onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed arabic flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingProduct ? 'تحديث' : 'إضافة'}</span>
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

export default ProductsPage
