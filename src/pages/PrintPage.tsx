import React from 'react'
import { useParams } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import { generateZATCAQR, formatZATCATimestamp, generateUUID, generateUBLXML, generateDigitalSignature, generateCSID } from '../lib/zatca'
import { authService } from '../lib/authService'
import { settingsService } from '../lib/firebaseServices'

const PrintPage: React.FC = () => {
  const { orderId } = useParams()
  const [order, setOrder] = React.useState(null)
  const [restaurantSettings, setRestaurantSettings] = React.useState(null)
  const [digitalSignature, setDigitalSignature] = React.useState<string>('')
  const [csid, setCSID] = React.useState<string>('')
  const [ublXml, setUblXml] = React.useState<string>('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>('')
  const [currentTenant, setCurrentTenant] = React.useState<any>(null)

  const [qrUrl, setQrUrl] = React.useState<string>('')

  React.useEffect(() => {
    console.log('PrintPage useEffect started')
    
    const initializePrintPage = async () => {
      try {
        // Get order from localStorage
        const orderData = localStorage.getItem('lastOrder')
        console.log('Order data from localStorage:', orderData)
        
        if (!orderData) {
          console.log('No order data found')
          setError('لا يوجد طلب للطباعة')
          setLoading(false)
          return
        }

        const parsed = JSON.parse(orderData)
        setOrder(parsed)
        console.log('Order loaded successfully:', parsed)

        // Load restaurant settings from Firebase
        try {
          const tenantId = authService.getCurrentTenantId()
          if (tenantId) {
            const settings = await settingsService.getSettingsByTenant(tenantId)
            if (settings) {
              setRestaurantSettings(settings)
              console.log('Restaurant settings loaded:', settings)
            }
          }
        } catch (error) {
          console.error('Error loading restaurant settings:', error)
        }

        // Get current tenant directly to avoid re-renders
        const tenant = authService.getCurrentTenant()
        setCurrentTenant(tenant)

        // Generate ZATCA QR image
        const buildQR = async () => {
          try {
            // Use restaurant settings if available, otherwise fallback to tenant data
            const sellerName = restaurantSettings?.restaurantName || tenant?.name || 'Qayd POS System'
            const vatNumber = restaurantSettings?.vatNumber || tenant?.vatNumber || '123456789012345'
            
            const qr = await generateZATCAQR({
              sellerName: sellerName,
              vatNumber: vatNumber,
              timestamp: parsed.timestamp || formatZATCATimestamp(new Date()),
              total: parsed.total || 0,
              vatTotal: parsed.vat || 0,
              uuid: generateUUID()
            })
            setQrUrl(qr)
            
            // Generate UBL XML
            const ublData = {
              invoiceNumber: parsed.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
              uuid: parsed.uuid || generateUUID(),
              issueDate: new Date(parsed.timestamp).toISOString().split('T')[0],
              issueTime: new Date(parsed.timestamp).toISOString().split('T')[1].split('.')[0],
              sellerName: sellerName,
              sellerVatNumber: vatNumber,
              sellerCrNumber: restaurantSettings?.crNumber || tenant?.crNumber || '1010101010',
              sellerAddress: restaurantSettings?.address || tenant?.address || 'Riyadh, Saudi Arabia',
              sellerPhone: restaurantSettings?.phone || tenant?.phone || '+966 11 123 4567',
              items: parsed.items?.map((item: any) => ({
                nameAr: item.nameAr || item.name,
                nameEn: item.nameEn || item.name,
                quantity: item.quantity,
                price: item.price,
                vatRate: 15
              })) || [],
              subtotal: parsed.subtotal || 0,
              vatTotal: parsed.vat || 0,
              total: parsed.total || 0,
              qrData: qr // Add QR data to UBL XML
            }
            
            const xml = generateUBLXML(ublData)
            setUblXml(xml)
            
            // Generate digital signature and CSID
            const signature = generateDigitalSignature(xml)
            const csidValue = generateCSID()
            
            setDigitalSignature(signature)
            setCSID(csidValue)
            
            console.log('ZATCA compliance data generated:', {
              qrGenerated: !!qr,
              ublXmlGenerated: !!xml,
              digitalSignature: signature,
              csid: csidValue
            })
            
          } catch (e) {
            console.error('ZATCA data generation failed', e)
          }
        }
        
        await buildQR()
        setLoading(false)
        
      } catch (error) {
        console.error('Error loading print page:', error)
        setError('حدث خطأ في تحميل صفحة الطباعة')
        setLoading(false)
      }
    }
    
    initializePrintPage()
  }, [restaurantSettings])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadUBL = () => {
    if (!ublXml) return
    
    const blob = new Blob([ublXml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice_${order?.invoiceNumber || 'unknown'}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBack = () => {
    window.history.back()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" dir="rtl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 arabic">جاري تحميل الفاتورة...</h2>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" dir="rtl">
          <h2 className="text-xl font-semibold text-red-600 arabic">{error}</h2>
          <div className="mt-4 flex gap-3 justify-center">
            <button onClick={() => window.history.back()} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic">العودة</button>
            <button onClick={() => window.location.href = '/pos'} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic">نقطة البيع</button>
          </div>
        </div>
      </div>
    )
  }

  // No order state
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" dir="rtl">
          <h2 className="text-xl font-semibold text-gray-900 arabic">لا يوجد طلب للطباعة</h2>
          <div className="mt-4 flex gap-3 justify-center">
            <button onClick={() => window.history.back()} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 arabic">العودة</button>
            <button onClick={() => window.location.href = '/pos'} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic">نقطة البيع</button>
          </div>
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
            {ublXml && (
              <button
                onClick={handleDownloadUBL}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 arabic"
              >
                📄 تحميل UBL XML
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-md mx-auto p-4">
        <div className="receipt receipt-58mm bg-white p-4 shadow-lg">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold arabic">{restaurantSettings?.restaurantNameAr || currentTenant?.nameAr || 'قيد - نظام الكاشير'}</h1>
            <p className="text-sm english">{restaurantSettings?.restaurantName || currentTenant?.name || 'Qayd POS System'}</p>
            <p className="text-xs arabic">{restaurantSettings?.addressAr || currentTenant?.addressAr || 'الرياض، المملكة العربية السعودية'}</p>
            <p className="text-xs english">{restaurantSettings?.address || currentTenant?.address || 'Riyadh, Saudi Arabia'}</p>
            <p className="text-xs">{restaurantSettings?.phone || currentTenant?.phone || '+966 11 123 4567'}</p>
            <p className="text-xs arabic">السجل التجاري: {restaurantSettings?.crNumber || currentTenant?.crNumber || '1010101010'}</p>
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
            <div className="flex justify-between text-sm">
              <span className="arabic">نوع الفاتورة:</span>
              <span className="arabic">فاتورة مبسطة</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="arabic">معرف الفاتورة:</span>
              <span className="text-xs">{order.uuid || 'N/A'}</span>
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
            
            {/* Discount Section */}
            {order.orderDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="arabic">
                  خصم ({order.orderDiscountType === 'percentage' ? `${order.orderDiscount}%` : 'مبلغ ثابت'}):
                </span>
                <span>-{order.orderDiscount.toFixed(2)} SAR</span>
              </div>
            )}
            
            {/* Service Charge */}
            {order.serviceCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="arabic">رسوم الخدمة:</span>
                <span>{order.serviceCharge.toFixed(2)} SAR</span>
              </div>
            )}
            
            {/* VAT Details */}
            <div className="flex justify-between text-sm">
              <span className="arabic">ضريبة القيمة المضافة (15%):</span>
              <span>{order.vat.toFixed(2)} SAR</span>
            </div>
            
            {/* Tax Breakdown */}
            <div className="text-xs text-gray-600 mt-1">
              <div className="flex justify-between">
                <span className="arabic">المبلغ الخاضع للضريبة:</span>
                <span>{((order.subtotal || 0) - (order.orderDiscount || 0) + (order.serviceCharge || 0)).toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between">
                <span className="arabic">نسبة الضريبة:</span>
                <span>15%</span>
              </div>
            </div>
            
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

          {/* Footer Information */}
          <div className="text-center mt-4 pt-2 border-t border-gray-300">
            <p className="text-xs text-gray-600 arabic">شكراً لزيارتكم</p>
            <p className="text-xs text-gray-500 english">Thank you for your visit</p>
            <p className="text-xs text-gray-500 mt-1">
              الرقم الضريبي: {restaurantSettings?.vatNumber || currentTenant?.vatNumber || '123456789012345'}
            </p>
            <p className="text-xs text-gray-500">
              CR: {restaurantSettings?.crNumber || currentTenant?.crNumber || '1010101010'}
            </p>
            
            {/* ZATCA Digital Signature Info */}
            {digitalSignature && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 arabic">التوقيع الرقمي:</p>
                <p className="text-xs text-gray-400 font-mono">{digitalSignature}</p>
                <p className="text-xs text-gray-500 arabic mt-1">CSID:</p>
                <p className="text-xs text-gray-400 font-mono">{csid}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default PrintPage