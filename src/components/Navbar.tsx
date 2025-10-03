import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { authService } from '../lib/authService'

const Navbar = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const navigation = [
    { name: 'الرئيسية', href: '/dashboard', icon: Home },
    { name: 'نقطة البيع', href: '/pos', icon: ShoppingCart },
    { name: 'المنتجات', href: '/products', icon: Package },
    { name: 'التقارير', href: '/reports', icon: BarChart3 },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = async () => {
    try {
      await authService.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const currentUser = authService.getCurrentUser()
  const currentTenant = authService.getCurrentTenant()

  return (
    <nav className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-700 to-green-600 text-white shadow-lg mx-4 mt-4">
      <div aria-hidden className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_-10%,rgba(255,255,255,.25),transparent)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white arabic">قيد - نظام الكاشير</h1>
                <p className="text-xs text-white/80 arabic">{currentTenant?.name || 'المتجر'}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-white/20 text-white backdrop-blur-sm border border-white/30'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* User Info and Actions */}
          <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            {/* User Info */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="text-right rtl:text-right">
                <p className="text-sm font-medium text-white arabic">
                  {currentUser?.name || 'المستخدم'}
                </p>
                <p className="text-xs text-white/80 arabic">
                  {currentUser?.role === 'admin' ? 'مدير' : 
                   currentUser?.role === 'manager' ? 'مشرف' : 'كاشير'}
                </p>
              </div>
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <span className="text-white text-sm font-bold">
                  {(currentUser?.name || 'م').charAt(0)}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                         bg-red-500 text-white hover:bg-red-600 shadow-sm"
            >
              <LogOut className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
              <span className="arabic">تسجيل الخروج</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-white/20 text-white backdrop-blur-sm border border-white/30'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4 ml-3 rtl:ml-0 rtl:mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-2">
                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <span className="text-white text-sm font-bold">
                    {(currentUser?.name || 'م').charAt(0)}
                  </span>
                </div>
                <div className="text-right rtl:text-right">
                  <p className="text-sm font-medium text-white arabic">
                    {currentUser?.name || 'المستخدم'}
                  </p>
                  <p className="text-xs text-white/80 arabic">
                    {currentUser?.role === 'admin' ? 'مدير' : 
                     currentUser?.role === 'manager' ? 'مشرف' : 'كاشير'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200 
                           bg-red-500 text-white hover:bg-red-600 shadow-sm rounded-lg mt-2"
              >
                <LogOut className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
                <span className="arabic">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
