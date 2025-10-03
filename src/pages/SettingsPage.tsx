import React, { useMemo, useState, useEffect } from 'react'
import { Save, CheckCircle, AlertCircle } from 'lucide-react'
import { authService } from '../lib/authService'
import { settingsService, tenantService } from '../lib/firebaseServices'

const SettingsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantNameAr: '',
    vatNumber: '',
    crNumber: '',
    phone: '',
    address: '',
    addressAr: '',
    email: '',
    vatRate: 15,
    language: 'ar'
  })

  // Load settings from Firebase on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const tenantId = authService.getCurrentTenantId()
        if (!tenantId) {
          console.log('No tenant ID found, using default settings')
          return
        }

        // Load settings from Firebase
        const settings = await settingsService.getSettingsByTenant(tenantId)
        
        // Load tenant data from Firebase
        const tenant = await tenantService.getTenant(tenantId)
        
        if (settings) {
          // Use settings data if available
          setFormData(prev => ({
            ...prev,
            restaurantName: settings.restaurantName || '',
            restaurantNameAr: settings.restaurantNameAr || '',
            vatNumber: settings.vatNumber || '',
            crNumber: settings.crNumber || '',
            phone: settings.phone || '',
            address: settings.address || '',
            addressAr: settings.addressAr || '',
            email: settings.email || '',
            vatRate: settings.vatRate || 15,
            language: settings.language || 'ar'
          }))
          console.log('Settings loaded from Firebase:', settings)
        } else if (tenant) {
          // Use tenant data if no settings found
          setFormData(prev => ({
            ...prev,
            restaurantName: tenant.name || '',
            restaurantNameAr: tenant.nameAr || '',
            vatNumber: tenant.vatNumber || '',
            crNumber: tenant.crNumber || '',
            phone: tenant.phone || '',
            address: tenant.address || '',
            addressAr: tenant.addressAr || '',
            email: tenant.email || '',
            vatRate: 15, // Keep default VAT rate
            language: 'ar' // Keep default language
          }))
          console.log('Tenant data loaded from Firebase:', tenant)
        } else {
          // Fallback to tenant data from authService
          const currentTenant = authService.getCurrentTenant()
          if (currentTenant) {
            setFormData(prev => ({
              ...prev,
              restaurantName: currentTenant.name || '',
              restaurantNameAr: currentTenant.nameAr || '',
              vatNumber: currentTenant.vatNumber || '',
              crNumber: currentTenant.crNumber || '',
              phone: currentTenant.phone || '',
              address: currentTenant.address || '',
              addressAr: currentTenant.addressAr || '',
              email: currentTenant.email || '',
              vatRate: 15, // Keep default VAT rate
              language: 'ar' // Keep default language
            }))
            console.log('Tenant data loaded from authService:', currentTenant)
          } else {
            console.log('No settings or tenant data found, using defaults')
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        // Fallback to localStorage if Firebase fails
        const saved = localStorage.getItem('restaurantSettings')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            setFormData(prev => ({ ...prev, ...parsed }))
          } catch (_) {}
        }
      }
    }

    loadSettings()
  }, [])
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
      const tenantId = authService.getCurrentTenantId()
      if (!tenantId) {
        throw new Error('No tenant ID found')
      }

      // Get existing settings for this tenant
      const existingSettings = await settingsService.getSettingsByTenant(tenantId)
      
      if (existingSettings) {
        // Update existing settings
        await settingsService.updateSettingsByTenant(tenantId, formData)
        console.log('Settings updated in Firebase')
      } else {
        // Create new settings
        await settingsService.createDefaultSettingsForTenant(tenantId, formData)
        console.log('New settings created in Firebase')
      }

      // Also save to localStorage as backup
      localStorage.setItem('restaurantSettings', JSON.stringify(formData))
      
      // Update tenant data in authService to reflect changes immediately
      const currentTenant = authService.getCurrentTenant()
      if (currentTenant) {
        // Update tenant data with new settings
        const updatedTenant = {
          ...currentTenant,
          name: formData.restaurantName,
          nameAr: formData.restaurantNameAr,
          vatNumber: formData.vatNumber,
          crNumber: formData.crNumber,
          phone: formData.phone,
          address: formData.address,
          addressAr: formData.addressAr,
          email: formData.email
        }
        
        // Update the tenant in authService
        if (authService.currentUser) {
          authService.currentUser.tenant = updatedTenant
        }
        
        console.log('Tenant data updated in authService:', updatedTenant)
      }
      
      setSuccess('تم حفظ الإعدادات بنجاح')
      
      // Reload settings to ensure display is correct
      setTimeout(async () => {
        try {
          const tenantId = authService.getCurrentTenantId()
          if (tenantId) {
            const settings = await settingsService.getSettingsByTenant(tenantId)
            if (settings) {
              setFormData(prev => ({
                ...prev,
                restaurantName: settings.restaurantName || '',
                restaurantNameAr: settings.restaurantNameAr || '',
                vatNumber: settings.vatNumber || '',
                crNumber: settings.crNumber || '',
                phone: settings.phone || '',
                address: settings.address || '',
                addressAr: settings.addressAr || '',
                email: settings.email || '',
                vatRate: settings.vatRate || 15,
                language: settings.language || 'ar'
              }))
              console.log('Settings reloaded after save:', settings)
            }
          }
        } catch (error) {
          console.error('Error reloading settings:', error)
        }
      }, 500)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSubmitError('تعذّر الحفظ. تحقق من اتصال الإنترنت')
    } finally {
      setSaving(false)
    }
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
          <p className="text-sm text-gray-500 mb-4 arabic">تأكد من صحة بيانات الضرائب والاتصال قبل الحفظ.</p>
          
          {/* Info message */}
          <div className="mb-6 rounded-md bg-blue-50 p-3 text-blue-800 flex items-center gap-2 arabic">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">البيانات المعروضة مأخوذة من بيانات التسجيل. يمكنك تعديلها وحفظها.</span>
          </div>
          
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