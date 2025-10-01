import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Tag, Image as ImageIcon, X, Trash2, Layers, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore'
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
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')

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
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const loadedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as InventoryItem[]
      
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
    setName(''); setNameEn(''); setPrice(''); setCategory(''); setImageUrl(''); setError('')
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

      const newItem = {
        tenantId,
        name: nameEn.trim() || trimmedName,
        nameAr: trimmedName,
        price: Math.round(numericPrice),
        imageUrl: imageUrl.trim() || '',
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all"
              >
                <div className="relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-44 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <ImageIcon className="h-7 w-7" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <div className="flex items-end gap-2">
                      {item.category && (
                        <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-white/90 text-emerald-700 border border-emerald-100 arabic">
                          {item.category}
                    </span>
                      )}
                      <span className="ml-auto text-white text-sm font-bold bg-emerald-600/95 px-2.5 py-1 rounded-md shadow-sm">
                        {Math.round(item.price)} SAR
                    </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 arabic group-hover:text-emerald-700 transition-colors">
                    {item.name}
                  </h3>
                  {item.nameEn && <p className="text-sm text-gray-500 english">{item.nameEn}</p>}

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {item.category ? <span className="arabic">{item.category}</span> : <span className="text-gray-400 arabic">غير مصنف</span>}
                    </div>
                  <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 arabic"
                  >
                    <Trash2 className="h-4 w-4" />
                      حذف
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
          <div className="absolute inset-0 bg-black/50" onClick={() => { setIsOpen(false); resetForm() }} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-l from-emerald-600 to-green-600 text-white flex items-center justify-between">
                <h3 className="text-lg font-semibold arabic">إضافة منتج</h3>
                <button
                  onClick={() => { setIsOpen(false); resetForm() }}
                  className="text-white/90 hover:text-white"
                  aria-label="إغلاق"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
              <div>
                    <label className="block text-sm text-gray-700 arabic mb-1">الاسم (عربي)</label>
                <input
                  type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="مثل: برجر لحم"
                />
              </div>
              <div>
                    <label className="block text-sm text-gray-700 english mb-1">Name (English)</label>
                <input
                  type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Beef Burger"
                  dir="ltr"
                />
              </div>
                  <div className="grid grid-cols-2 gap-4">
              <div>
                      <label className="block text-sm text-gray-700 arabic mb-1">السعر (SAR)</label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="مثال: 25"
                        dir="ltr"
                        min={0}
                        step="0.01"
                      />
              </div>
              <div>
                      <label className="block text-sm text-gray-700 arabic mb-1">التصنيف</label>
                <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  <div>
                    <label className="block text-sm text-gray-700 english mb-1">Image URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://..."
                  dir="ltr"
                />
                  </div>
                  {error && (
                    <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm arabic">{error}</div>
                  )}
              </div>

                {/* Live Preview */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b text-sm text-gray-600 arabic">معاينة</div>
                  <div className="p-4">
                    <div className="group bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="relative">
                        {imageUrl ? (
                          <img src={imageUrl} alt={name || 'preview'} className="h-44 w-full object-cover" />
                        ) : (
                          <div className="h-44 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <ImageIcon className="h-7 w-7" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-2">
                          <div className="flex items-end gap-2">
                            {category && (
                              <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-white/90 text-emerald-700 border border-emerald-100 arabic">
                                {category}
                              </span>
                            )}
                            <span className="ml-auto text-white text-sm font-bold bg-emerald-600/95 px-2.5 py-1 rounded-md shadow-sm">
                              {price ? `${Math.round(Number(price) || 0)} SAR` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 arabic">{name || 'اسم المنتج'}</h4>
                        <p className="text-sm text-gray-500 english">{nameEn || 'Product name'}</p>
                      </div>
                    </div>
              </div>
            </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                    type="button"
                    onClick={() => { setIsOpen(false); resetForm() }}
                    className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 arabic"
              >
                إلغاء
              </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 arabic"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        جاري الحفظ...
                      </span>
                    ) : (
                      'إضافة المنتج'
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
