import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Package, BarChart3, Settings, Receipt, LogOut } from "lucide-react"
import { useAuth } from "../hooks/useFirebase"
import { useOrders } from "../hooks/useFirebase"
import { useItems } from "../hooks/useFirebase"

// Lightweight local formatter to keep Arabic look without bidi artifacts
function formatCurrencySAR(value: number) {
  const nf = new Intl.NumberFormat("ar-SA", {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  // strip bidi marks & NBSP if any
  return `${nf.format(value).replace(/[\u200e\u200f]/g, "").replace(/\u00a0/g, " ").trim()} ر.س`
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { orders } = useOrders()
  const { items } = useItems()

  const handleLogout = async () => {
    try { await signOut() } catch (e) { console.error("Logout error", e) }
  }

  const menuItems = [
    { name: "نقطة البيع", nameEn: "POS", icon: ShoppingCart, href: "/sell", color: "from-sky-500 to-cyan-500", desc: "إدارة المبيعات والطلبات" },
    { name: "المنتجات", nameEn: "Products", icon: Package, href: "/products", color: "from-violet-500 to-fuchsia-500", desc: "إدارة الأصناف والأسعار" },
    { name: "التقارير", nameEn: "Reports", icon: BarChart3, href: "/reports", color: "from-indigo-500 to-blue-600", desc: "تقارير المبيعات والتحليلات" },
    { name: "الإعدادات", nameEn: "Settings", icon: Settings, href: "/settings", color: "from-slate-600 to-gray-700", desc: "إعدادات النظام والمطعم" },
  ] as const

  const totalOrders = orders.length
  const totalSales = orders.reduce((sum: number, o: any) => sum + (o?.total || 0), 0)
  const totalItems = items.length

  // Try to pick a recent order summary if available
  const lastOrder = orders?.[0]
  const lastOrderTotal = lastOrder ? formatCurrencySAR(lastOrder.total || 0) : "—"

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-cyan-700 to-sky-700 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold arabic tracking-tight">مطعم Big Diet</h1>
                <p className="text-xs opacity-90 english">Big Diet Restaurant POS</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold arabic">{user?.name ?? "المستخدم"}</p>
                <p className="text-[11px] opacity-90">{user?.role ?? "—"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-3 py-2 rounded-lg text-sm backdrop-blur transition"
              >
                <LogOut className="h-4 w-4" />
                <span className="arabic">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 arabic mb-1">لوحة التحكم</h2>
          <p className="text-slate-600 arabic">مرحباً بك في نظام نقطة البيع لمطعم Big Diet</p>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-slate-100 hover:shadow-md transition">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-xl"><Receipt className="h-5 w-5 text-emerald-600" /></div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
                <p className="text-sm text-slate-500 arabic">إجمالي الطلبات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-slate-100 hover:shadow-md transition">
            <div className="flex items-center">
              <div className="p-2 bg-sky-100 rounded-xl"><ShoppingCart className="h-5 w-5 text-sky-600" /></div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-slate-900">{formatCurrencySAR(totalSales)}</p>
                <p className="text-sm text-slate-500 arabic">إجمالي المبيعات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-slate-100 hover:shadow-md transition">
            <div className="flex items-center">
              <div className="p-2 bg-violet-100 rounded-xl"><Package className="h-5 w-5 text-violet-600" /></div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
                <p className="text-sm text-slate-500 arabic">أصناف متاحة</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-10">
          <h3 className="text-base font-semibold text-slate-700 arabic mb-4">الوصول السريع</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((m, i) => {
              const Icon = m.icon
              return (
                <button
                  key={i}
                  onClick={() => navigate(m.href)}
                  className="group text-right w-full bg-white rounded-2xl border ring-1 ring-slate-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${m.color} text-white shadow-sm group-hover:scale-[1.03] transition`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mr-4">
                      <h4 className="text-lg font-semibold text-slate-900 arabic">{m.name}</h4>
                      <p className="text-xs text-slate-500 english">{m.nameEn}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 arabic">{m.desc}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border ring-1 ring-slate-100 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-base font-semibold text-slate-700 arabic mb-4">آخر طلب</h3>
            {lastOrder ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 arabic">
                  <p className="font-medium">رقم الطلب: <span className="font-semibold">{lastOrder?.orderNumber ?? "—"}</span></p>
                  <p className="mt-1">الإجمالي: <span className="font-semibold">{lastOrderTotal}</span></p>
                </div>
                <Link to={"/reports"} className="text-sm text-sky-700 hover:text-sky-900 underline underline-offset-4 arabic">عرض التقارير</Link>
              </div>
            ) : (
              <p className="text-sm text-slate-500 arabic">لا توجد طلبات حتى الآن.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border ring-1 ring-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-700 arabic mb-4">إجراءات سريعة</h3>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate("/sell")} className="w-full inline-flex items-center justify-between rounded-xl px-4 py-3 bg-sky-50 hover:bg-sky-100 text-sky-900 transition">
                <span className="arabic">فتح نقطة البيع</span>
                <ShoppingCart className="h-4 w-4" />
              </button>
              <button onClick={() => navigate("/products")} className="w-full inline-flex items-center justify-between rounded-xl px-4 py-3 bg-violet-50 hover:bg-violet-100 text-violet-900 transition">
                <span className="arabic">إدارة المنتجات</span>
                <Package className="h-4 w-4" />
              </button>
              <button onClick={() => navigate("/settings")} className="w-full inline-flex items-center justify-between rounded-xl px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 transition">
                <span className="arabic">الإعدادات</span>
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Package, BarChart3, Settings, Receipt, LogOut } from "lucide-react"
import { useAuth } from "../hooks/useFirebase"
import { useOrders } from "../hooks/useFirebase"
import { useItems } from "../hooks/useFirebase"

// Lightweight local formatter to keep Arabic look without bidi artifacts
function formatCurrencySAR(value: number) {
  const nf = new Intl.NumberFormat("ar-SA", {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  // strip bidi marks & NBSP if any
  return `${nf.format(value).replace(/[\u200e\u200f]/g, "").replace(/\u00a0/g, " ").trim()} ر.س`
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { orders } = useOrders()
  const { items } = useItems()

  const handleLogout = async () => {
    try { await signOut() } catch (e) { console.error("Logout error", e) }
  }

  const menuItems = [
    { name: "نقطة البيع", nameEn: "POS", icon: ShoppingCart, href: "/sell", color: "from-sky-500 to-cyan-500", desc: "إدارة المبيعات والطلبات" },
    { name: "المنتجات", nameEn: "Products", icon: Package, href: "/products", color: "from-violet-500 to-fuchsia-500", desc: "إدارة الأصناف والأسعار" },
    { name: "التقارير", nameEn: "Reports", icon: BarChart3, href: "/reports", color: "from-indigo-500 to-blue-600", desc: "تقارير المبيعات والتحليلات" },
    { name: "الإعدادات", nameEn: "Settings", icon: Settings, href: "/settings", color: "from-slate-600 to-gray-700", desc: "إعدادات النظام والمطعم" },
  ] as const

  const totalOrders = orders.length
  const totalSales = orders.reduce((sum: number, o: any) => sum + (o?.total || 0), 0)
  const totalItems = items.length

  // Try to pick a recent order summary if available
  const lastOrder = orders?.[0]
  const lastOrderTotal = lastOrder ? formatCurrencySAR(lastOrder.total || 0) : "—"

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-cyan-700 to-sky-700 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold arabic tracking-tight">مطعم Big Diet</h1>
                <p className="text-xs opacity-90 english">Big Diet Restaurant POS</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold arabic">{user?.name ?? "المستخدم"}</p>
                <p className="text-[11px] opacity-90">{user?.role ?? "—"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-3 py-2 rounded-lg text-sm backdrop-blur transition"
              >
                <LogOut className="h-4 w-4" />
                <span className="arabic">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 arabic mb-1">لوحة التحكم</h2>
          <p className="text-slate-600 arabic">مرحباً بك في نظام نقطة البيع لمطعم Big Diet</p>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-slate-100 hover:shadow-md transition">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-xl"><Receipt className="h-5 w-5 text-emerald-600" /></div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
                <p className="text-sm text-slate-500 arabic">إجمالي الطلبات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-slate-100 hover:shadow-md transition">
            <div className="flex items-center">
              <div className="p-2 bg-sky-100 rounded-xl"><ShoppingCart className="h-5 w-5 text-sky-600" /></div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-slate-900">{formatCurrencySAR(totalSales)}</p>
                <p className="text-sm text-slate-500 arabic">إجمالي المبيعات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6 ring-1 ring-slate-100 hover:shadow-md transition">
            <div className="flex items-center">
              <div className="p-2 bg-violet-100 rounded-xl"><Package className="h-5 w-5 text-violet-600" /></div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
                <p className="text-sm text-slate-500 arabic">أصناف متاحة</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-10">
          <h3 className="text-base font-semibold text-slate-700 arabic mb-4">الوصول السريع</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((m, i) => {
              const Icon = m.icon
              return (
                <button
                  key={i}
                  onClick={() => navigate(m.href)}
                  className="group text-right w-full bg-white rounded-2xl border ring-1 ring-slate-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${m.color} text-white shadow-sm group-hover:scale-[1.03] transition`}> 
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mr-4">
                      <h4 className="text-lg font-semibold text-slate-900 arabic">{m.name}</h4>
                      <p className="text-xs text-slate-500 english">{m.nameEn}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 arabic">{m.desc}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border ring-1 ring-slate-100 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-base font-semibold text-slate-700 arabic mb-4">آخر طلب</h3>
            {lastOrder ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 arabic">
                  <p className="font-medium">رقم الطلب: <span className="font-semibold">{lastOrder?.orderNumber ?? "—"}</span></p>
                  <p className="mt-1">الإجمالي: <span className="font-semibold">{lastOrderTotal}</span></p>
                </div>
                <Link to={"/reports"} className="text-sm text-sky-700 hover:text-sky-900 underline underline-offset-4 arabic">عرض التقارير</Link>
              </div>
            ) : (
              <p className="text-sm text-slate-500 arabic">لا توجد طلبات حتى الآن.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border ring-1 ring-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-700 arabic mb-4">إجراءات سريعة</h3>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate("/sell")} className="w-full inline-flex items-center justify-between rounded-xl px-4 py-3 bg-sky-50 hover:bg-sky-100 text-sky-900 transition">
                <span className="arabic">فتح نقطة البيع</span>
                <ShoppingCart className="h-4 w-4" />
              </button>
              <button onClick={() => navigate("/products")} className="w-full inline-flex items-center justify-between rounded-xl px-4 py-3 bg-violet-50 hover:bg-violet-100 text-violet-900 transition">
                <span className="arabic">إدارة المنتجات</span>
                <Package className="h-4 w-4" />
              </button>
              <button onClick={() => navigate("/settings")} className="w-full inline-flex items-center justify-between rounded-xl px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 transition">
                <span className="arabic">الإعدادات</span>
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
