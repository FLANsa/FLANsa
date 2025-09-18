import React, { useMemo, useState } from 'react'
import { Save, CheckCircle, AlertCircle } from 'lucide-react'
import { useSettings } from '../hooks/useFirebase'

const SettingsPage: React.FC = () => {
  const { settings, loading, updateSettings } = useSettings()
  const [formData, setFormData] = useState({
    restaurantName: settings?.restaurantName || 'مطعم Big Diet',
    restaurantNameAr: settings?.restaurantNameAr || 'مطعم Big Diet',
    vatNumber: settings?.vatNumber || '123456789012345',
    crNumber: settings?.crNumber || '1010101010',
    phone: settings?.phone || '+966 11 123 4567',
    address: settings?.address || 'Riyadh, Saudi Arabia',
    addressAr: settings?.addressAr || 'الرياض، المملكة العربية السعودية',
    email: settings?.email || 'info@bigdiet.com',
    vatRate: settings?.vatRate || 15,
    language: settings?.language || 'ar'
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validators = useMemo(() => ({
    vatNumber: (v: string) => (/^\d{15}$/.test(v) ? '' : 'رقم الضريبة يجب أن يكون 15 رقمًا'),
    crNumber: (v: string) => (/^\d{8,15}$/.test(v) ? '' : 'رقم السجل التجاري غير صحيح'),
    email: (v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'البريد الإلكتروني غير صحيح'),
    phone: (v: string) => (/^[+\d][\d\s()-]{6,}$/.test(v) ? '' : 'رقم الهاتف غير صحيح'),
    vatRate: (v: number) => (v >= 0 && v <= 100 ? '' : 'النسبة يجب أن تكون بين 0 و 100'),
    restaurantName: (v: string) => (v.trim().length > 0 ? '' : 'اسم المطعم (إنجليزي) مطلوب'),
    restaurantNameAr: (v: string) => (v.trim().length > 0 ? '' : 'اسم المطعم (عربي) مطلوب'),
  }), [])

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {}
    const add = (key: string, msg: string) => { if (msg) newErrors[key] = msg }
    add('restaurantNameAr', validators.restaurantNameAr(formData.restaurantNameAr))
    add('restaurantName', validators.restaurantName(formData.restaurantName))
    add('vatNumber', validators.vatNumber(formData.vatNumber))
    add('crNumber', validators.crNumber(formData.crNumber))
    add('email', validators.email(formData.email))
    add('phone', validators.phone(formData.phone))
    add('vatRate', validators.vatRate(formData.vatRate))
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    setSuccess(null)
    setSubmitError(null)
    if (!validateAll()) return
    setSaving(true)
    try {
      // احفظ محلياً فوراً لضمان عدم فقدان التعديلات
      try {
        localStorage.setItem('restaurantSettings', JSON.stringify(formData))
      } catch (_) {}

      // حاول المزامنة مع السحابة
      await updateSettings(formData)
      setSuccess('تم حفظ الإعدادات ومزامنتها بنجاح')
    } catch (error) {
      console.error('Error saving settings:', error)
      // في حال فشل المزامنة السحابية، نبقي الحفظ المحلي ونبلغ المستخدم
      setSuccess('تم الحفظ محلياً (تعذّرت المزامنة مع السحابة)')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 arabic">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="relative overflow-hidden rounded-3xl bg-green-600 text-white shadow-lg">
        <div aria-hidden className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_-10%,rgba(255,255,255,.15),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold arabic">الإعدادات</h1>
              <p className="text-sm/6 opacity-90 english">System Settings</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => (window.location.href = '/dashboard')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm arabic transition">الصفحة الرئيسية</button>
              <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm arabic transition">العودة</button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-green-800 flex items-center gap-2 arabic">
            <CheckCircle className="h-4 w-4" /> {success}
          </div>
        )}
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-red-800 flex items-center gap-2 arabic">
            <AlertCircle className="h-4 w-4" /> {submitError}
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 arabic mb-2">إعدادات المطعم</h2>
          <p className="text-sm text-gray-500 mb-6 arabic">تأكد من صحة بيانات الضرائب والاتصال قبل الحفظ.</p>
          
          {/* Restaurant names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                اسم المطعم (عربي)
              </label>
              <input
                type="text"
                value={formData.restaurantNameAr}
                onChange={(e) => setFormData({...formData, restaurantNameAr: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.restaurantNameAr && <p className="mt-1 text-xs text-red-600 arabic">{errors.restaurantNameAr}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                اسم المطعم (إنجليزي)
              </label>
              <input
                type="text"
                value={formData.restaurantName}
                onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.restaurantName && <p className="mt-1 text-xs text-red-600 arabic">{errors.restaurantName}</p>}
            </div>
            
            {/* Tax & registry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                رقم ضريبة القيمة المضافة
              </label>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
              {errors.vatNumber && <p className="mt-1 text-xs text-red-600 arabic">{errors.vatNumber}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                رقم السجل التجاري
              </label>
              <input
                type="text"
                value={formData.crNumber}
                onChange={(e) => setFormData({...formData, crNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
              {errors.crNumber && <p className="mt-1 text-xs text-red-600 arabic">{errors.crNumber}</p>}
            </div>
            
            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600 arabic">{errors.phone}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600 arabic">{errors.email}</p>}
            </div>
            
            {/* Addresses */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                العنوان (عربي)
              </label>
              <textarea
                value={formData.addressAr}
                onChange={(e) => setFormData({...formData, addressAr: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                العنوان (إنجليزي)
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* VAT rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                نسبة ضريبة القيمة المضافة (%)
              </label>
              <input
                type="number"
                value={formData.vatRate}
                onChange={(e) => setFormData({...formData, vatRate: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
              />
              {errors.vatRate && <p className="mt-1 text-xs text-red-600 arabic">{errors.vatRate}</p>}
            </div>
            
            
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <button disabled={saving} className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:opacity-60 arabic">
              إلغاء
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 arabic"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جارٍ الحفظ...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 inline mr-2" />
                  حفظ الإعدادات
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage