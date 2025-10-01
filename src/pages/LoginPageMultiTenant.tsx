import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../lib/authService'
import { tenantService } from '../lib/firebaseServices'
import { Tenant } from '../lib/firebaseServices'
import { DEMO_CREDENTIALS } from '../lib/seedMultiTenantData'
import { createFirebaseAuthUsers } from '../lib/createFirebaseUsers'

export default function LoginPageMultiTenant() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTenantForm, setShowTenantForm] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [creatingUsers, setCreatingUsers] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
      navigate('/dashboard')
    }
    
    // Load available tenants
    loadTenants()
  }, [navigate])

  const loadTenants = async () => {
    try {
      const activeTenants = await tenantService.getActiveTenants()
      setTenants(activeTenants)
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authService.signIn(email, password)
      navigate('/dashboard')
    } catch (error: any) {
      setError(error.message || 'خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  const handleTenantRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const tenantData = {
        name: formData.get('name') as string,
        nameAr: formData.get('nameAr') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        addressAr: formData.get('addressAr') as string,
        vatNumber: formData.get('vatNumber') as string,
        crNumber: formData.get('crNumber') as string,
        subscriptionPlan: 'basic' as const,
        subscriptionStatus: 'active' as const,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        isActive: true
      }

      const tenantId = await tenantService.createTenant(tenantData)
      
      // Create admin user for this tenant
      const adminUserData = {
        tenantId,
        name: formData.get('adminName') as string,
        email: formData.get('adminEmail') as string,
        role: 'admin' as const,
        isActive: true
      }

      // Note: In a real app, you would create Firebase Auth user first
      // For demo purposes, we'll just show success message
      setError('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول باستخدام بيانات المدير.')
      setShowTenantForm(false)
      
    } catch (error: any) {
      setError(error.message || 'خطأ في إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDemoUsers = async () => {
    setCreatingUsers(true)
    setError('')
    
    try {
      await createFirebaseAuthUsers()
      setError('تم إنشاء الحسابات التجريبية بنجاح! يمكنك الآن تسجيل الدخول.')
    } catch (error: any) {
      setError(error.message || 'خطأ في إنشاء الحسابات التجريبية')
    } finally {
      setCreatingUsers(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 arabic">قيد</h1>
          <h2 className="text-2xl font-semibold text-gray-700 english">Qayd POS System</h2>
          <p className="mt-2 text-sm text-gray-600 arabic">نظام نقاط البيع السحابي</p>
        </div>

        {!showTenantForm ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 arabic text-center">تسجيل الدخول</h3>
                <p className="text-sm text-gray-600 english text-center">Sign in to your account</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded arabic">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 arabic">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin@qayd.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 arabic">
                    كلمة المرور
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </button>
              </form>

              <div className="text-center space-y-2">
                <button
                  onClick={() => setShowTenantForm(true)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium arabic block"
                >
                  إنشاء حساب جديد للمحل
                </button>
                <button
                  onClick={handleCreateDemoUsers}
                  disabled={creatingUsers}
                  className="text-green-600 hover:text-green-500 text-sm font-medium arabic disabled:opacity-50"
                >
                  {creatingUsers ? 'جاري إنشاء الحسابات...' : 'إنشاء الحسابات التجريبية'}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 arabic mb-2">حسابات تجريبية:</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="border-b pb-2">
                    <div className="font-medium arabic">مطعم الرشيد</div>
                    <div className="english">admin@alrashid.com</div>
                    <div className="english">manager@alrashid.com</div>
                    <div className="english">cashier@alrashid.com</div>
                  </div>
                  <div className="border-b pb-2">
                    <div className="font-medium arabic">مقهى ديلايت</div>
                    <div className="english">admin@cafedelight.com</div>
                    <div className="english">cashier@cafedelight.com</div>
                  </div>
                  <div>
                    <div className="font-medium arabic">سوق سريع</div>
                    <div className="english">admin@quickmart.com</div>
                    <div className="english">manager@quickmart.com</div>
                    <div className="english">cashier@quickmart.com</div>
                  </div>
                  <div className="arabic text-gray-500 mt-2">كلمة المرور لجميع الحسابات: 123456</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 arabic text-center">إنشاء حساب جديد</h3>
                <p className="text-sm text-gray-600 english text-center">Register your store</p>
              </div>

              {error && (
                <div className={`px-4 py-3 rounded arabic ${
                  error.includes('نجاح') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleTenantRegistration} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 english">
                      Store Name (English)
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="My Store"
                    />
                  </div>
                  <div>
                    <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700 arabic">
                      اسم المحل (عربي)
                    </label>
                    <input
                      id="nameAr"
                      name="nameAr"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="محلي"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 english">
                      Store Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="store@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 arabic">
                      رقم الهاتف
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+966 50 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 english">
                      VAT Number
                    </label>
                    <input
                      id="vatNumber"
                      name="vatNumber"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123456789012345"
                    />
                  </div>
                  <div>
                    <label htmlFor="crNumber" className="block text-sm font-medium text-gray-700 english">
                      CR Number
                    </label>
                    <input
                      id="crNumber"
                      name="crNumber"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1010101010"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 english">
                      Address (English)
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Riyadh, Saudi Arabia"
                    />
                  </div>
                  <div>
                    <label htmlFor="addressAr" className="block text-sm font-medium text-gray-700 arabic">
                      العنوان (عربي)
                    </label>
                    <input
                      id="addressAr"
                      name="addressAr"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="الرياض، المملكة العربية السعودية"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 arabic mb-3">بيانات المدير</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 arabic">
                        اسم المدير
                      </label>
                      <input
                        id="adminName"
                        name="adminName"
                        type="text"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="أحمد محمد"
                      />
                    </div>
                    <div>
                      <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 english">
                        Admin Email
                      </label>
                      <input
                        id="adminEmail"
                        name="adminEmail"
                        type="email"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="admin@mystore.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTenantForm(false)}
                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
