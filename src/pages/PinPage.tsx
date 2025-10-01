 import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Terminal } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import { Monitor, Lock } from 'lucide-react'

export default function PinPage() {
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTerminals()
  }, [])

  const fetchTerminals = async () => {
    if (!profile?.branchId) return
    
    try {
      const terminalsRef = collection(db, 'terminals')
      const q = query(terminalsRef, where('branchId', '==', profile.branchId), where('isActive', '==', true))
      const querySnapshot = await getDocs(q)
      
      const terminalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Terminal[]
      
      setTerminals(terminalsData)
    } catch (error) {
      console.error('Error fetching terminals:', error)
      setError('خطأ في تحميل المحطات')
    } finally {
      setLoading(false)
    }
  }

  const handleTerminalSelect = (terminal: Terminal) => {
    setSelectedTerminal(terminal)
    setPin('')
    setError('')
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTerminal) {
      setError('يرجى اختيار محطة')
      return
    }
    
    if (pin !== selectedTerminal.pin) {
      setError('رمز PIN غير صحيح')
      return
    }
    
    // Update user profile with selected terminal
    // This would typically be done through a cloud function
    navigate('/sell')
  }

  const handlePinChange = (value: string) => {
    // Only allow numeric input and limit to 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setPin(value)
      setError('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Monitor className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 arabic">
            اختيار المحطة
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 arabic">
            اختر المحطة وأدخل رمز PIN
          </p>
        </div>

        <div className="space-y-6">
          {/* Terminal Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 arabic mb-3">
              المحطات المتاحة
            </label>
            <div className="grid grid-cols-1 gap-3">
              {terminals.map((terminal) => (
                <button
                  key={terminal.id}
                  onClick={() => handleTerminalSelect(terminal)}
                  className={`relative rounded-lg border p-4 text-right focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    selectedTerminal?.id === terminal.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Monitor className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 arabic">
                        {terminal.nameAr}
                      </p>
                      <p className="text-xs text-gray-500 english">
                        {terminal.name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PIN Input */}
          {selectedTerminal && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 arabic">
                  رمز PIN للمحطة: {selectedTerminal.nameAr}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    autoComplete="off"
                    required
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm text-center"
                    placeholder="أدخل رمز PIN"
                    maxLength={4}
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-danger-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-danger-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="mr-3">
                      <h3 className="text-sm font-medium text-danger-800 arabic">
                        خطأ
                      </h3>
                      <div className="mt-2 text-sm text-danger-700 arabic">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={pin.length !== 4}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="arabic">تأكيد</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 arabic">
            المستخدم: {profile?.name}
          </p>
          <p className="text-xs text-gray-400 english">
            User: {profile?.name}
          </p>
        </div>
      </div>
    </div>
  )
}
