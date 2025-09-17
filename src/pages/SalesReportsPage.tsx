import { useMemo, useState } from 'react'
import { useOrders } from '../hooks/useFirebase'

type DateRange = 'today' | '7d' | '30d' | 'all'

export default function SalesReportsPage() {
  const { orders, loading } = useOrders()
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [status, setStatus] = useState<'all' | 'completed' | 'pending' | 'preparing' | 'cancelled'>('all')
  const [payment, setPayment] = useState<'all' | 'cash' | 'card' | 'other'>('all')
  const [search, setSearch] = useState('')

  const { filtered, totals } = useMemo(() => {
    const now = new Date()
    let start: Date | null = null
    if (dateRange === 'today') {
      start = new Date()
      start.setHours(0, 0, 0, 0)
    } else if (dateRange === '7d') {
      start = new Date(now)
      start.setDate(start.getDate() - 7)
    } else if (dateRange === '30d') {
      start = new Date(now)
      start.setDate(start.getDate() - 30)
    }

    const filteredOrders = orders.filter((o) => {
      const created = (o as any).createdAt?.toDate ? (o as any).createdAt.toDate() : new Date((o as any).createdAt || 0)
      if (start && created < start) return false
      if (status !== 'all' && o.status !== status) return false
      if (payment !== 'all' && (o.paymentMethod || 'other') !== payment) return false
      if (search) {
        const hay = `${o.invoiceNumber} ${o.customerName || ''} ${(o as any).customerPhone || ''}`.toLowerCase()
        if (!hay.includes(search.toLowerCase())) return false
      }
      return true
    })

    const totals = filteredOrders.reduce(
      (acc, o) => {
        acc.count += 1
        acc.subtotal += o.subtotal || 0
        acc.vat += o.vat || 0
        acc.discount += o.discount || 0
        acc.total += o.total || 0
        return acc
      },
      { count: 0, subtotal: 0, vat: 0, discount: 0, total: 0 }
    )

    return { filtered: filteredOrders, totals }
  }, [orders, dateRange, status, payment])

  const getStatusClass = (s?: string) => {
    switch (s) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentClass = (p?: string) => {
    switch (p) {
      case 'cash':
        return 'bg-gray-100 text-gray-800'
      case 'card':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-purple-100 text-purple-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-2xl font-extrabold arabic">تقارير المبيعات</h1>
              <p className="text-sm/6 opacity-90 english">Sales Reports</p>
            </div>
            <div>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="px-3 py-2 text-sm rounded-md bg-white/10 hover:bg-white/20 backdrop-blur text-white arabic transition"
              >
                الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border p-4 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500 arabic">إجمالي المبيعات</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{totals.total.toFixed(2)}<span className="text-sm font-normal text-gray-400 ml-1">SAR</span></div>
        </div>
          <div className="bg-white rounded-2xl border p-4 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500 arabic">عدد الفواتير</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{totals.count}</div>
        </div>
          <div className="bg-white rounded-2xl border p-4 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500 arabic">إجمالي الخصومات</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{totals.discount.toFixed(2)}</div>
        </div>
          <div className="bg-white rounded-2xl border p-4 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500 arabic">ضريبة القيمة المضافة</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{totals.vat.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-4 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} className="border rounded-md px-3 py-2 text-sm">
            <option value="today">اليوم</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="all">الكل</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="border rounded-md px-3 py-2 text-sm">
            <option value="all">كل الحالات</option>
            <option value="completed">مكتمل</option>
            <option value="pending">معلق</option>
            <option value="preparing">جارٍ التحضير</option>
            <option value="cancelled">ملغي</option>
          </select>
          <select value={payment} onChange={(e) => setPayment(e.target.value as any)} className="border rounded-md px-3 py-2 text-sm">
            <option value="all">كل طرق الدفع</option>
            <option value="cash">نقدي</option>
            <option value="card">شبكة/بطاقة</option>
            <option value="other">أخرى</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm flex-1 min-w-[220px]"
            placeholder="بحث برقم الفاتورة"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">طريقة الدفع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && filtered.map((o) => {
                const created = (o as any).createdAt?.toDate ? (o as any).createdAt.toDate() : new Date((o as any).createdAt || 0)
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{o.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{created.toLocaleString('ar-SA')}</td>
                    
                    <td className="px-4 py-3 text-xs">
                      <span className={`inline-flex px-2 py-1 rounded-full ${getStatusClass(o.status)}`}>{o.status || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`inline-flex px-2 py-1 rounded-full ${getPaymentClass(o.paymentMethod)}`}>{o.paymentMethod || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{o.total.toFixed(2)} <span className="text-gray-400">SAR</span></td>
                  </tr>
                )
              })}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">جارٍ التحميل...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">📄</div>
                      <p className="text-sm text-gray-600 arabic mb-2">لا توجد فواتير مطابقة للبحث/المرشحات</p>
                      <p className="text-xs text-gray-500 arabic">جرّب تغيير التاريخ أو معايير البحث</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


