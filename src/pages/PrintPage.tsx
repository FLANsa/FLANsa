import React from 'react'
import { useParams } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import { generateZATCAQR, formatZATCATimestamp, generateUUID } from '../lib/zatca'
import { authService } from '../lib/authService'

const PrintPage: React.FC = () => {
  const { orderId } = useParams()
  const [order, setOrder] = React.useState(null)

  const [qrUrl, setQrUrl] = React.useState<string>('')

  React.useEffect(() => {
    // Get order from localStorage
    const orderData = localStorage.getItem('lastOrder')
    if (!orderData) return

    const parsed = JSON.parse(orderData)
    setOrder(parsed)

    // Get current tenant directly to avoid re-renders
    const currentTenant = authService.getCurrentTenant()

    // Generate ZATCA QR image
    const buildQR = async () => {
      try {
        const qr = await generateZATCAQR({
          sellerName: currentTenant?.name || 'Qayd POS System',
          vatNumber: currentTenant?.vatNumber || '123456789012345',
          timestamp: parsed.timestamp || formatZATCATimestamp(new Date()),
          total: parsed.total || 0,
          vatTotal: parsed.vat || 0,
          uuid: generateUUID()
        })
        setQrUrl(qr)
      } catch (e) {
        console.error('QR generation failed', e)
      }
    }
    buildQR()
    // لاحظ: بدون وضع tenant في dependencies
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    window.history.back()
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 arabic">جاري تحميل الفاتورة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Controls */}
      <div className="bg-white shadow-sm border-b p-4 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 arabic">طباعة الفاتورة</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic"
            >
              <ArrowLeft className="h-4 w-4 inline mr-2" />
              العودة
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic"
            >
              <Printer className="h-4 w-4 inline mr-2" />
              طباعة
            </button>
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-md mx-auto p-4">
        <div className="receipt receipt-58mm bg-white p-4 shadow-lg">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold arabic">قيد - نظام الكاشير</h1>
            <p className="text-sm english">Qayd POS System</p>
            <p className="text-xs arabic">الرياض، المملكة العربية السعودية</p>
            <p className="text-xs english">Riyadh, Saudi Arabia</p>
            <p className="text-xs">+966 11 123 4567</p>
          </div>

          <div className="border-t border-b border-gray-300 py-2 my-2">
            <div className="flex justify-between text-sm">
              <span className="arabic">رقم الفاتورة:</span>
              <span>{order.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="arabic">التاريخ:</span>
              <span>{new Date(order.timestamp).toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="arabic">الوقت:</span>
              <span>{new Date(order.timestamp).toLocaleTimeString('ar-SA')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="arabic">النوع:</span>
              <span className="arabic">
                {order.mode === 'dine-in' ? 'تناول في المطعم' : 
                 order.mode === 'takeaway' ? 'طلب خارجي' : 'توصيل'}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <div className="flex justify-between text-sm font-semibold border-b border-gray-300 pb-1 mb-2">
              <span className="arabic">الصنف</span>
              <span className="arabic">الكمية</span>
              <span className="arabic">السعر</span>
            </div>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm mb-1">
                <div className="flex-1">
                  <div className="arabic">{item.nameAr || item.name}</div>
                  <div className="english text-xs text-gray-600">{item.nameEn || item.name}</div>
                </div>
                <div className="text-center w-12">{item.quantity}</div>
                <div className="text-left w-16">{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-300 pt-2">
            <div className="flex justify-between text-sm">
              <span className="arabic">المجموع الفرعي:</span>
              <span>{order.subtotal.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="arabic">ضريبة القيمة المضافة (15%):</span>
              <span>{order.vat.toFixed(2)} SAR</span>
            </div>
            {/* removed discount row */}
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
              <span className="arabic">المجموع الكلي:</span>
              <span>{order.total.toFixed(2)} SAR</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center mt-4">
            {qrUrl ? (
              <img src={qrUrl} alt="ZATCA QR" className="inline-block w-28 h-28" />
            ) : (
              <div className="inline-block p-2 border border-gray-300">
                <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600">QR</span>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2 arabic">رمز ZATCA</p>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 text-xs text-gray-600">
            <p className="arabic">شكراً لزيارتكم</p>
            <p className="english">Thank you for your visit</p>
            <p className="arabic">نتمنى لكم وجبة شهية</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintPage