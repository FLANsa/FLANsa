import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Plus, Search, Tag, Image as ImageIcon, X, Trash2, Layers, Home, Edit3, Eye, Package, TrendingUp, Star, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import LoadingSpinner from '../components/LoadingSpinner'
import { authService } from '../lib/authService'

type InventoryItem = {
  id: string
  name: string
  nameEn?: string
  price: number
  imageUrl?: string
  category?: string
}

type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'name'

function ProductsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [price, setPrice] = useState<string>('')
  const [category, setCategory] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [error, setError] = useState('')
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI controls
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  // Load items from Firebase
  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const tenantId = authService.getCurrentTenantId()
      if (!tenantId) {
        setItems([])
        setLoading(false)
        return
      }

      const itemsRef = collection(db, 'items')
      const q = query(
        itemsRef, 
        where('tenantId', '==', tenantId)
      )
      const querySnapshot = await getDocs(q)
      
      const loadedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as unknown as InventoryItem[]
      
      // Sort items by createdAt in JavaScript instead of Firestore
      loadedItems.sort((a, b) => ((b as any).createdAt?.getTime() || 0) - ((a as any).createdAt?.getTime() || 0))
      
      setItems(loadedItems)
      
      // Also save to localStorage for offline access
      localStorage.setItem('inventory', JSON.stringify(loadedItems))
    } catch (error) {
      console.error('Error loading items:', error)
      // Fallback to localStorage
      const data = localStorage.getItem('inventory')
      try {
        setItems(data ? JSON.parse(data) : [])
      } catch {
        setItems([])
      }
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setName(''); setNameEn(''); setPrice(''); setCategory(''); setError('')
    setUploadedImage(null); setImagePreview('')
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('يرجى اختيار ملف صورة صالح')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
        return
      }
      
      setUploadedImage(file)
      setError('')
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Convert image to base64 for storage
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    
    const trimmedName = name.trim()
    const numericPrice = Number(price)
    if (!trimmedName) return setError('الاسم مطلوب')
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return setError('السعر غير صحيح')

    try {
      const tenantId = authService.getCurrentTenantId()
      if (!tenantId) {
        setError('خطأ في تحديد المحل')
        return
      }

      // Handle image - only uploaded file
      let finalImageUrl = ''
      if (uploadedImage) {
        try {
          finalImageUrl = await convertImageToBase64(uploadedImage)
        } catch (error) {
          console.error('Error converting image:', error)
          setError('خطأ في معالجة الصورة')
          return
        }
      }

      const newItem = {
        tenantId,
        name: nameEn.trim() || trimmedName,
        nameAr: trimmedName,
        price: Math.round(numericPrice),
        imageUrl: finalImageUrl,
        category: category.trim() || 'غير مصنف',
        stock: 100, // Default stock
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Add to Firebase
      const docRef = await addDoc(collection(db, 'items'), newItem)
      
      // Add to local state
      const itemWithId = { id: docRef.id, ...newItem }
      setItems([itemWithId, ...items])
      
      // Update localStorage
      const updatedItems = [itemWithId, ...items]
      localStorage.setItem('inventory', JSON.stringify(updatedItems))
      
      resetForm()
      setIsOpen(false)
    } catch (error) {
      console.error('Error adding item:', error)
      setError('حدث خطأ أثناء إضافة المنتج')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, 'items', id))
      
      // Update local state
      const updatedItems = items.filter(i => i.id !== id)
      setItems(updatedItems)
      
      // Update localStorage
      localStorage.setItem('inventory', JSON.stringify(updatedItems))
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('حدث خطأ أثناء حذف المنتج')
    }
  }

  // Categories + counts
  const { categories, counts } = useMemo(() => {
    const set = new Set<string>()
    const map = new Map<string, number>()
    items.forEach(i => {
      const c = (i.category || 'غير مصنف')
      set.add(c)
      map.set(c, (map.get(c) || 0) + 1)
    })
    return { categories: ['all', ...Array.from(set)], counts: map }
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = items.filter(i => {
      const isAll = selectedCategory === 'all'
      const inCat = isAll || (i.category || 'غير مصنف').toLowerCase() === selectedCategory.toLowerCase()
      if (!inCat) return false
      if (!q) return true
      return (
        i.name.toLowerCase().includes(q) ||
        (i.nameEn || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      )
    })
    switch (sortKey) {
      case 'priceAsc':  list = [...list].sort((a,b)=>a.price-b.price); break
      case 'priceDesc': list = [...list].sort((a,b)=>b.price-a.price); break
      case 'name':      list = [...list].sort((a,b)=>a.name.localeCompare(b.name,'ar')); break
      default: break
    }
    return list
  }, [items, search, selectedCategory, sortKey])

  // Stats
  const totalItems = items.length
  const uniqueCats = new Set(items.map(i => i.category || 'غير مصنف')).size
  const avgPrice = totalItems ? Math.round(items.reduce((s, i) => s + i.price, 0) / totalItems) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50" dir="rtl">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-700 to-green-600 text-white shadow-lg">
        {/* decorative light + highlight */}
        <div aria-hidden className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_-10%,rgba(255,255,255,.25),transparent)]" />

        {/* Home button in top-left corner */}
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/20 arabic"
          aria-label="الصفحة الرئيسية"
        >
          <Home className="h-5 w-5" />
          الصفحة الرئيسية
        </button>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 pb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
            {/* Title */}
            <div className="text-right">
              <div className="text-xs/5 uppercase tracking-wider english opacity-80">Products</div>
              <h1 className="mt-0.5 text-2xl sm:text-3xl font-extrabold arabic tracking-tight">المنتجات</h1>
              <p className="mt-0.5 text-sm/6 opacity-90 arabic">إدارة قائمة الأصناف والأسعار</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
              <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm arabic"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة منتج
              </button>

              <select
                className="h-8 w-28 px-2 text-xs rounded-md bg-white/10 text-white border border-white/20 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/60 arabic"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="newest">الأحدث</option>
                <option value="priceAsc">السعر: من الأقل</option>
                <option value="priceDesc">السعر: من الأعلى</option>
                <option value="name">الاسم</option>
              </select>

              {/* Search */}
              <div className="relative w-full sm:w-64 md:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/80 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث عن منتج..."
                  className="pr-9 pl-3 py-2 w-full rounded-xl bg-white/10 placeholder-white/70 text-white
                       border border-white/20 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/60"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-xl p-3 bg-white/10 border border-white/15 backdrop-blur-sm">
              <div className="text-sm opacity-90 arabic">إجمالي المنتجات</div>
              <div className="mt-1 text-2xl font-bold">{totalItems}</div>
            </div>
            <div className="rounded-xl p-3 bg-white/10 border border-white/15 backdrop-blur-sm">
              <div className="text-sm opacity-90 arabic">التصنيفات</div>
              <div className="mt-1 text-2xl font-bold">{uniqueCats}</div>
            </div>
            <div className="rounded-xl p-3 bg-white/10 border border-white/15 backdrop-blur-sm">
              <div className="text-sm opacity-90 arabic">متوسط السعر (SAR)</div>
              <div className="mt-1 text-2xl font-bold">{avgPrice}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Category Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 relative z-20">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => {
              const active = selectedCategory === cat
              const label = cat === 'all' ? 'الكل' : cat
              const count = cat === 'all' ? items.length : (counts.get(cat) || 0)
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition
                    ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}
                  `}
                >
                  <Tag className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-emerald-600'}`} />
                  <span className="text-sm arabic">{label}</span>
                  <span className={`text-[11px] leading-5 px-1.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-700'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
            <div className="sm:ml-auto w-full sm:w-auto flex items-center text-gray-500 text-sm gap-2 mt-2 sm:mt-0">
              <Layers className="h-4 w-4" />
              <span className="arabic">ترتيب:</span>
              <span className="font-medium">
                {sortKey === 'newest' ? 'الأحدث' :
                 sortKey === 'priceAsc' ? 'السعر: من الأقل' :
                 sortKey === 'priceDesc' ? 'السعر: من الأعلى' : 'الاسم'}
              </span>
            </div>
          </div>
          </div>
        </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="mr-3 text-gray-600 arabic">جاري تحميل المنتجات...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <ImageIcon className="h-7 w-7" />
            </div>
            <p className="text-gray-800 arabic text-lg">لا توجد عناصر مطابقة</p>
            <p className="text-sm text-gray-500 english mt-1">No matching items</p>
            <div className="mt-6">
              <button
                onClick={() => setIsOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 arabic"
              >
                إضافة منتج
              </button>
                  </div>
                </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs arabic">لا توجد صورة</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                        <Eye className="h-4 w-4 text-gray-700" />
                      </button>
                      <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                        <Edit3 className="h-4 w-4 text-blue-700" />
                      </button>
                    </div>
                  </div>

                  {/* Price badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-bold shadow-lg">
                      <Star className="h-3 w-3" />
                      {Math.round(item.price)} SAR
                    </span>
                  </div>

                  {/* Category badge */}
                  {item.category && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-white/95 text-emerald-700 border border-emerald-200 arabic font-medium">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 arabic text-lg group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                    {item.nameEn && (
                      <p className="text-sm text-gray-500 english mt-1 line-clamp-1">{item.nameEn}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span className="arabic">متوفر</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="arabic">شائع</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors arabic text-sm font-medium">
                      <Edit3 className="h-4 w-4" />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors arabic text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
              </div>
          )}
      </div>

      {/* Modal: Add Product */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsOpen(false); resetForm() }} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border overflow-hidden transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold arabic">إضافة منتج جديد</h3>
                    <p className="text-xs opacity-90 arabic">أضف منتجاً جديداً إلى قائمة الأصناف</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsOpen(false); resetForm() }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

                  <form onSubmit={handleAdd} className="p-6 overflow-y-auto flex-1 min-h-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                      {/* النموذج (عمودان) */}
                      <div className="md:col-span-2 space-y-5">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-base font-semibold text-gray-800 arabic mb-3">معلومات المنتج</h4>
                      
                      <div className="space-y-5">
                        {/* الاسم بالعربية */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 arabic mb-2">الاسم بالعربية *</label>
                          <input
                            type="text"
                            autoComplete="off"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-base"
                            placeholder="مثل: برجر لحم"
                          />
                        </div>
                        
                        {/* الاسم بالإنجليزية */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 english mb-2">Name (English)</label>
                          <input
                            type="text"
                            autoComplete="off"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-base"
                            placeholder="e.g. Beef Burger"
                            dir="ltr"
                          />
                        </div>
                        
                        {/* السعر والتصنيف في صف واحد */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 arabic mb-2">السعر (SAR) *</label>
                            <div className="relative">
                              <input
                                type="number"
                                autoComplete="off"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full pr-3 pl-16 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                                placeholder="مثال: 25.00"
                                dir="ltr"
                                min={0}
                                step="0.01"
                              />
                              {/* RTL: لاحقة SAR على اليسار */}
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-3 text-sm text-gray-600 border-r bg-gray-100 rounded-l-lg">SAR</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 arabic">يمكنك استخدام الكسور العشرية (مثال: 12.50)</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 arabic mb-2">التصنيف</label>
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-base"
                            >
                              <option value="">اختر التصنيف</option>
                              <option value="ساندوتشات">ساندوتشات</option>
                              <option value="برجر">برجر</option>
                              <option value="سلطات">سلطات</option>
                              <option value="مشروبات">مشروبات</option>
                              <option value="حلويات">حلويات</option>
                              <option value="مقبلات">مقبلات</option>
                              <option value="وجبات رئيسية">وجبات رئيسية</option>
                              <option value="عصائر طبيعية">عصائر طبيعية</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* صورة المنتج */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 arabic mb-3">صورة المنتج</label>
                          
                          {/* Upload Area */}
                          <div className="space-y-4">
                            {/* File Upload */}
                            <div 
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-emerald-100 rounded-full">
                                  <Upload className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-base font-medium text-gray-700 arabic">اضغط لرفع صورة</p>
                                  <p className="text-sm text-gray-500 arabic">PNG, JPG, GIF حتى 5MB</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Image Preview */}
                            {imagePreview && (
                              <div className="relative">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview('')
                                    setUploadedImage(null)
                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {error && (
                          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm arabic flex items-center gap-2">
                            <X className="h-4 w-4" />
                            {error}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>

                    {/* المعاينة (عمود ثالث ثابت) */}
                    <aside className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-100 md:sticky md:top-4 md:self-start">
                      <h4 className="text-base font-semibold text-gray-800 arabic mb-3">معاينة المنتج</h4>
                      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="relative overflow-hidden">
                          {imagePreview ? (
                            <img src={imagePreview} alt={name || 'preview'} className="h-32 w-full object-cover" />
                          ) : (
                            <div className="h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                                <p className="text-xs arabic">لا توجد صورة</p>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg">
                              <Star className="h-2 w-2" />
                              {price ? `${Math.round(Number(price) || 0)} SAR` : '—'}
                            </span>
                          </div>
                          {category && (
                            <div className="absolute top-2 right-2">
                              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-white/95 text-emerald-700 border border-emerald-200 arabic font-medium">
                                {category}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-gray-900 arabic text-base">{name || 'اسم المنتج'}</h4>
                          <p className="text-sm text-gray-500 english mt-1">{nameEn || 'Product name'}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1"><Package className="h-3 w-3" /><span className="arabic">متوفر</span></div>
                            <div className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /><span className="arabic">شائع</span></div>
                          </div>
                        </div>
                      </div>
                    </aside>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); resetForm() }}
                    className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors arabic font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 arabic font-medium shadow-lg hover:shadow-xl"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        جاري الحفظ...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        إضافة المنتج
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
