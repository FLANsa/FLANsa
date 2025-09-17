import React from 'react'
import { ShoppingCart, Package, BarChart3, Settings, Receipt } from 'lucide-react'
import { useAuth } from '../hooks/useFirebase'
import { useOrders } from '../hooks/useFirebase'
import { useItems } from '../hooks/useFirebase'
import { useCustomers } from '../hooks/useFirebase'

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const { orders } = useOrders()
  const { items } = useItems()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    { name: 'نقطة البيع', nameEn: 'POS', icon: ShoppingCart, href: '/sell', color: 'bg-blue-500' },
    { name: 'المنتجات', nameEn: 'Products', icon: Package, href: '/products', color: 'bg-purple-500' },
    { name: 'التقارير', nameEn: 'Reports', icon: BarChart3, href: '/reports', color: 'bg-indigo-500' },
    { name: 'الإعدادات', nameEn: 'Settings', icon: Settings, href: '/settings', color: 'bg-gray-500' },
  ]

  // Calculate stats
  const totalOrders = orders.length
  const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalItems = items.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div>
              <h1 className="text-2xl font-extrabold arabic">مطعم Big Diet</h1>
              <p className="text-sm/6 opacity-90 english">Big Diet Restaurant POS</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium arabic">{user?.name}</p>
                <p className="text-xs/5 opacity-90">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md text-sm backdrop-blur arabic transition"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 arabic mb-2">
            لوحة التحكم
          </h2>
          <p className="text-gray-600 arabic">
            مرحباً بك في نظام نقطة البيع لمطعم Big Diet
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer ring-1 ring-gray-100"
                onClick={() => {
                  window.location.href = item.href
                }}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl ${item.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-lg font-semibold text-gray-900 arabic">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 english">
                      {item.nameEn}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 arabic">
                  {item.name === 'نقطة البيع' && 'إدارة المبيعات والطلبات'}
                  {item.name === 'المنتجات' && 'المنتجات'}
                  {item.name === 'التقارير' && 'تقارير المبيعات والتحليلات'}
                  {item.name === 'الإعدادات' && 'إعدادات النظام والمطعم'}
                </p>
              </div>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                <p className="text-sm text-gray-500 arabic">إجمالي الطلبات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{totalSales.toFixed(0)}</p>
                <p className="text-sm text-gray-500 arabic">ريال سعودي</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                <p className="text-sm text-gray-500 arabic">أصناف متاحة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
