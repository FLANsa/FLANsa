import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../lib/authService'
 

export default function LoginPageMultiTenant() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  
  const navigate = useNavigate()

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (user) {
        console.log('User already authenticated, navigating to dashboard')
        // Check if user is admin@qayd.com and redirect to admin dashboard
        if (user.email?.toLowerCase() === 'admin@qayd.com') {
          console.log('Admin user detected, redirecting to admin dashboard...')
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      }
    })
    
    return unsubscribe
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login button clicked!')
    setLoading(true)
    setError('')

    try {
      console.log('Starting login process...')
      console.log('Email:', email)
      console.log('Password length:', password.length)
      
      const result = await authService.signIn(email, password)
      console.log('Login successful:', result)
      
      // Check if user is authenticated
      const isAuth = authService.isAuthenticated()
      console.log('Is authenticated after login:', isAuth)
      
      if (isAuth) {
        console.log('Navigating to dashboard...')
        // Check if user is admin@qayd.com and redirect to admin dashboard
        if (email.toLowerCase() === 'admin@qayd.com') {
          console.log('Admin user detected, redirecting to admin dashboard...')
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        console.log('Authentication failed, staying on login page')
        setError('فشل في تسجيل الدخول - يرجى المحاولة مرة أخرى')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        setError('المستخدم غير موجود. تأكد من صحة البريد الإلكتروني')
      } else if (error.code === 'auth/wrong-password') {
        setError('كلمة المرور غير صحيحة')
      } else if (error.code === 'auth/network-request-failed') {
        setError('خطأ في الاتصال. تأكد من اتصال الإنترنت')
      } else if (error.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صحيح')
      } else {
        setError(error.message || 'خطأ في تسجيل الدخول')
      }
    } finally {
      setLoading(false)
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
                    autoComplete="email"
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
                    autoComplete="current-password"
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
        
        
      </div>
    </div>
  )
}
