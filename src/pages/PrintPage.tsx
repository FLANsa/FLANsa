import React from 'react'
import { useParams } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import { generateZATCAQR, generateZATCAQRData, formatZATCATimestamp, generateUUID, generateUBLXML, generateDigitalSignature, generateCSID, generateXMLHash, generateXAdESSignature } from '../lib/zatca'
import { sendInvoiceToZATCA } from '../lib/zatcaProxy'
import { authService } from '../lib/authService'
import { settingsService } from '../lib/firebaseServices'
import { convertReceiptToESCPOS, sendDirectToPrinter } from '../lib/thermalPrinter'
// Removed XML upload/viewer in favor of direct XML generation and download

const PrintPage: React.FC = () => {
  const { orderId: _orderId } = useParams()
  const [order, setOrder] = React.useState<any>(null)
  const [restaurantSettings, setRestaurantSettings] = React.useState<any>(null)
  const [digitalSignature, setDigitalSignature] = React.useState<string>('')
  const [csid, setCSID] = React.useState<string>('')
  const [ublXml, setUblXml] = React.useState<string>('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>('')
  const [currentTenant, setCurrentTenant] = React.useState<any>(null)
  const [qrUrl, setQrUrl] = React.useState<string>('')
  const [printerIP, setPrinterIP] = React.useState<string>('')
  const [printerPort, setPrinterPort] = React.useState<number>(9100)
  const [proxyServerIP, setProxyServerIP] = React.useState<string>('')
  const [printing, setPrinting] = React.useState(false)
  const [savingIP, setSavingIP] = React.useState(false)
  
  // Direct XML download (no upload UI)

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

        // Load printer IP from settings or localStorage
        if (restaurantSettings?.printerIP) {
          setPrinterIP(restaurantSettings.printerIP)
        } else {
          const savedIP = localStorage.getItem('printerIP')
          if (savedIP) {
            setPrinterIP(savedIP)
          }
        }

        // Load Print Proxy Server IP from Firebase Settings first, then localStorage
        if (restaurantSettings?.printProxyServerIP) {
          setProxyServerIP(restaurantSettings.printProxyServerIP)
          localStorage.setItem('proxyServerIP', restaurantSettings.printProxyServerIP)
        } else {
          const savedProxyIP = localStorage.getItem('proxyServerIP')
          if (savedProxyIP) {
            setProxyServerIP(savedProxyIP)
          } else {
            // Default to common local IP
            setProxyServerIP('192.168.8.5')
          }
        }

        // QR Code generation disabled - not displaying QR in invoices
        // const buildQR = async () => { ... }
        // await buildQR()
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

  const handleThermalPrint = async () => {
    if (!order) {
      alert('لا يوجد طلب للطباعة')
      return
    }

    if (!printerIP || printerIP.trim() === '') {
      alert('يرجى إدخال IP address الطابعة')
      return
    }

    setPrinting(true)
    try {
      // Prepare receipt data for ESC/POS conversion
      const receiptData = {
        logoUrl: restaurantSettings?.logoUrl || currentTenant?.logoUrl,
        restaurantNameAr: restaurantSettings?.restaurantNameAr || currentTenant?.nameAr || 'قيد - نظام الكاشير',
        restaurantName: restaurantSettings?.restaurantName || currentTenant?.name || 'Qayd POS System',
        addressAr: restaurantSettings?.addressAr || currentTenant?.addressAr || 'الرياض، المملكة العربية السعودية',
        address: restaurantSettings?.address || currentTenant?.address || 'Riyadh, Saudi Arabia',
        phone: restaurantSettings?.phone || currentTenant?.phone || '+966 11 123 4567',
        crNumber: restaurantSettings?.crNumber || currentTenant?.crNumber || '1010101010',
          invoiceNumber: order.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        date: new Date(order.timestamp).toLocaleDateString('ar-SA'),
        time: new Date(order.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        mode: order.mode === 'dine-in' ? 'تناول في المطعم' : 
              order.mode === 'takeaway' ? 'طلب خارجي' : 'توصيل',
        uuid: order.uuid || generateUUID(),
          items: order.items?.map((item: any) => ({
            nameAr: item.nameAr || item.name,
            nameEn: item.nameEn || item.name,
            quantity: item.quantity,
          price: item.price
          })) || [],
          subtotal: order.subtotal || 0,
        discount: order.orderDiscount || 0,
        discountType: order.orderDiscountType || 'percentage',
        serviceCharge: order.serviceCharge || 0,
        vat: order.vat || 0,
          total: order.total || 0
        }

      // Convert to ESC/POS commands
      const escposData = convertReceiptToESCPOS(receiptData)
      
      console.log('📄 Receipt data prepared:', receiptData)
      console.log('🖨️ ESC/POS data length:', escposData.length, 'characters')
      console.log('📡 Sending to printer:', printerIP, ':', printerPort)

      // Send to thermal printer
      // Priority: 1) proxyServerIP from input, 2) restaurantSettings.printProxyServerIP, 3) undefined (auto-detect)
      const finalProxyIP = proxyServerIP || restaurantSettings?.printProxyServerIP || undefined
      console.log(`📡 [PrintPage] Using Print Proxy Server IP: ${finalProxyIP || 'auto-detect'}`)
      console.log(`📡 [PrintPage] Printer IP: ${printerIP}:${printerPort}`)
      console.log(`📡 [PrintPage] Restaurant Settings printProxyServerIP: ${restaurantSettings?.printProxyServerIP || 'not set'}`)
      
      const result = await sendDirectToPrinter(escposData, printerIP, printerPort, finalProxyIP)
      
      console.log('📤 [PrintPage] Print result:', result)

      if (result.success) {
        alert('✅ تم إرسال أمر الطباعة إلى الطابعة بنجاح')
      } else {
        console.error('❌ [PrintPage] Print error:', result.error)
        console.error('❌ [PrintPage] Full error details:', {
          printerIP,
          printerPort,
          proxyServerIP: finalProxyIP,
          restaurantSettingsProxyIP: restaurantSettings?.printProxyServerIP,
          localStorageProxyIP: localStorage.getItem('proxyServerIP')
        })
        
        // Show detailed error message
        alert('❌ فشل في إرسال أمر الطباعة:\n\n' + (result.error || 'خطأ غير معروف'))
        
        // Fallback: Try browser print dialog as backup
        const useBrowserPrint = confirm('فشل الاتصال بالطابعة الحرارية. هل تريد استخدام نافذة الطباعة العادية؟')
        if (useBrowserPrint) {
          window.print()
        }
      }
    } catch (error: any) {
      console.error('Error in handleThermalPrint:', error)
      alert('❌ حدث خطأ أثناء الطباعة:\n\n' + (error.message || 'خطأ غير معروف'))
      
      // Fallback: Try browser print dialog
      const useBrowserPrint = confirm('حدث خطأ. هل تريد استخدام نافذة الطباعة العادية؟')
      if (useBrowserPrint) {
        window.print()
      }
    } finally {
      setPrinting(false)
    }
  }

  const [submittingZATCA, setSubmittingZATCA] = React.useState(false)

  const handleSubmitToZATCA = async () => {
    if (!order || !ublXml) return
    
    try {
      setSubmittingZATCA(true)
      console.log('🚀 Submitting invoice to ZATCA via secure proxy...')
      
      // Prepare invoice data
      const invoiceData = {
        invoiceXML: ublXml,
        uuid: order.uuid || generateUUID(),
        invoiceHash: digitalSignature || `HASH_${Date.now()}`,
        previousHash: undefined, // TODO: Add PIH tracking
        counterValue: undefined  // TODO: Add ICV counter
      }

      console.log('📋 Invoice data:', {
        uuid: invoiceData.uuid,
        hasXML: !!invoiceData.invoiceXML,
        xmlLength: invoiceData.invoiceXML?.length,
        hashLength: invoiceData.invoiceHash?.length
      })

      // Submit via secure proxy
      const result = await sendInvoiceToZATCA(invoiceData)
      
      if (result.success) {
        alert('✅ تم إرسال الفاتورة إلى زاتكا بنجاح!\n\nاستجابة زاتكا: ' + JSON.stringify(result.metadata, null, 2))
        console.log('ZATCA submission successful:', result)
      } else {
        alert('❌ فشل في إرسال الفاتورة إلى زاتكا: ' + (result.errors?.join(', ') || 'خطأ غير معروف'))
        console.error('ZATCA submission failed:', result.errors)
      }
    } catch (error: any) {
      console.error('Error submitting to ZATCA:', error)
      
      // Provide more specific error messages
      let errorMessage = 'خطأ غير معروف في إرسال الفاتورة إلى زاتكا'
      
      if (error.message) {
        if (error.message.includes('fetch')) {
          errorMessage = 'خطأ في الاتصال بخادم زاتكا - تأكد من تشغيل الخادم المحلي'
        } else if (error.message.includes('JSON')) {
          errorMessage = 'خطأ في تحليل استجابة زاتكا - تأكد من تشغيل الخادم المحلي'
        } else if (error.message.includes('Empty response')) {
          errorMessage = 'استجابة فارغة من خادم زاتكا - تأكد من تشغيل الخادم المحلي'
        } else {
          errorMessage = error.message
        }
      }
      
      alert('❌ خطأ في إرسال الفاتورة إلى زاتكا:\n\n' + errorMessage + '\n\n💡 تأكد من تشغيل الخادم المحلي باستخدام: npm run dev:server')
    } finally {
      setSubmittingZATCA(false)
    }
  }

  const handleBack = () => {
    window.history.back()
  }

  const handleSavePrinterIP = async () => {
    if (!printerIP || printerIP.trim() === '') {
      alert('يرجى إدخال IP address الطابعة أولاً')
      return
    }

    setSavingIP(true)
    try {
      // Save to localStorage
      localStorage.setItem('printerIP', printerIP)
      
      // Also save to Firebase Settings if available
      const tenantId = authService.getCurrentTenantId()
      if (tenantId) {
        await settingsService.updateSettingsByTenant(tenantId, {
          printerIP: printerIP
        })
        console.log('✅ Printer IP saved to Firebase Settings')
        alert('✅ تم حفظ IP address الطابعة بنجاح')
      } else {
        alert('✅ تم حفظ IP address في الجهاز الحالي')
      }
    } catch (error: any) {
      console.error('Error saving printer IP:', error)
      alert('❌ فشل في حفظ IP address: ' + (error.message || 'خطأ غير معروف'))
    } finally {
      setSavingIP(false)
    }
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
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
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
              طباعة عادية
            </button>
            <button
              onClick={handleThermalPrint}
              disabled={printing}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 arabic disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {printing ? (
                <>
                  <span className="animate-spin inline-block mr-2">⏳</span>
                  جاري الطباعة...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 inline mr-2" />
                  طباعة حرارية
                </>
              )}
            </button>
            {ublXml && (
              <button
                onClick={handleSubmitToZATCA}
                disabled={submittingZATCA}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 arabic disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submittingZATCA ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    جاري الإرسال...
                  </>
                ) : (
                  '🚀 إرسال لزاتكا'
                )}
              </button>
            )}
            </div>
          </div>
          
          {/* Printer IP Input */}
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-1">
                IP address الطابعة:
              </label>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={printerIP}
                      onChange={(e) => setPrinterIP(e.target.value)}
                      placeholder="192.168.8.190"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      dir="ltr"
                    />
                    <input
                      type="number"
                      value={printerPort}
                      onChange={(e) => setPrinterPort(parseInt(e.target.value) || 9100)}
                      placeholder="9100"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 arabic">
                    أدخل IP address الطابعة الحرارية (مثال: 192.168.8.190) و Port (افتراضي: 9100)
                  </p>
                </div>
                <button
                  onClick={handleSavePrinterIP}
                  disabled={savingIP || !printerIP || printerIP.trim() === ''}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 arabic disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {savingIP ? (
                    <>
                      <span className="animate-spin inline-block mr-2">⏳</span>
                      جاري الحفظ...
                    </>
                  ) : (
                    '💾 حفظ IP'
                  )}
                </button>
              </div>
            </div>
            
            {/* Proxy Server IP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 arabic mb-1">
                IP address Print Proxy Server (اختياري):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={proxyServerIP}
                  onChange={(e) => {
                    setProxyServerIP(e.target.value)
                    localStorage.setItem('proxyServerIP', e.target.value)
                  }}
                  placeholder={restaurantSettings?.printProxyServerIP || "192.168.8.5"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 arabic">
                {restaurantSettings?.printProxyServerIP ? (
                  <>IP address المركزي من الإعدادات: <strong className="text-blue-600">{restaurantSettings.printProxyServerIP}</strong>. يمكنك تغييره هنا للاستخدام المحلي فقط.</>
                ) : (
                  <>أدخل IP address الكمبيوتر الذي يشغل Print Proxy Server (مثال: 192.168.8.5). اتركه فارغاً للاكتشاف التلقائي. أو احفظه في الإعدادات (Settings) لاستخدامه من جميع الأجهزة.</>
                )}
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Removed XML Upload Section */}

      {/* Receipt */}
      <div className="max-w-md mx-auto p-4">
        <div className="receipt receipt-58mm bg-white p-4 shadow-lg">
          {/* Header */}
          <div className="text-center mb-4">
            {/* Logo */}
            {(restaurantSettings?.logoUrl || currentTenant?.logoUrl) && (
              <div className="mb-3 flex justify-center">
                <img 
                  src={restaurantSettings?.logoUrl || currentTenant?.logoUrl} 
                  alt="Logo" 
                  className="max-w-[120px] max-h-[60px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
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
            {order.items.map((item: any, index: number) => (
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
            
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
              <span className="arabic">المجموع الكلي:</span>
              <span>{order.total.toFixed(2)} SAR</span>
            </div>
          </div>

          {/* Footer Information */}
          <div className="text-center mt-4 pt-2 border-t border-gray-300">
            <p className="text-xs text-gray-600 arabic">شكراً لزيارتكم</p>
            <p className="text-xs text-gray-500 english">Thank you for your visit</p>
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