import React, { useState } from 'react'
import { Save } from 'lucide-react'
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
    currency: settings?.currency || 'SAR',
    language: settings?.language || 'ar'
  })

  const handleSave = async () => {
    try {
      await updateSettings(formData)
      alert('تم حفظ الإعدادات بنجاح!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('حدث خطأ أثناء حفظ الإعدادات')
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic">الإعدادات</h1>
              <p className="text-sm text-gray-500 english">System Settings</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => (window.location.href = '/dashboard')} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 arabic">الصفحة الرئيسية</button>
              <button onClick={() => window.history.back()} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 arabic">العودة</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 arabic mb-6">إعدادات المطعم</h2>
          
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
            </div>
            
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
            </div>
            
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
            </div>
            
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-2">
                العملة
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <button className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 arabic">
              إلغاء
            </button>
            <button 
              onClick={handleSave}
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

export default SettingsPage