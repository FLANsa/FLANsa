import React from 'react'
import { useParams } from 'react-router-dom'
import { Printer, ArrowLeft, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { generateZATCAQR, generateZATCAQRData, formatZATCATimestamp, generateUUID, generateUBLXML, generateDigitalSignature, generateCSID, generateXMLHash, generateXAdESSignature } from '../lib/zatca'
import { sendInvoiceToZATCA } from '../lib/zatcaProxy'
import { authService } from '../lib/authService'
import { settingsService } from '../lib/firebaseServices'
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
  
  // ZATCA status badge component
  const ZATCAStatusBadge = ({ zatcaResult, zatcaError }: { zatcaResult?: any, zatcaError?: string }) => {
    if (zatcaError) {
      return (
        <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg">
          <XCircle className="w-4 h-4" />
          <span className="text-sm font-medium">فشل ZATCA</span>
          <span className="text-xs">({zatcaError})</span>
        </div>
      )
    }
    
    if (zatcaResult?.reportingResult?.accepted) {
      return (
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">تم الإبلاغ ✓</span>
        </div>
      )
    }
    
    if (zatcaResult?.reportingResult?.accepted === false) {
      return (
        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">رفض الإبلاغ ✗</span>
          <span className="text-xs">({zatcaResult?.reportingResult?.body?.message || 'سبب غير معروف'})</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">لم يتم الإبلاغ</span>
      </div>
    )
  }
  
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

        // Generate ZATCA QR image
        const buildQR = async () => {
          try {
            // Check if ZATCA result is available
            if (parsed.zatcaResult?.qrBase64) {
              console.log('Using ZATCA-generated QR')
              
              // ZATCA QR is TLV Base64 - need to convert to image
              const QRCode = (await import('qrcode')).default
              const qrImageUrl = await QRCode.toDataURL(parsed.zatcaResult.qrBase64)
              setQrUrl(qrImageUrl)
              
              // Use ZATCA-generated XML
              if (parsed.zatcaResult.finalXml) {
                setUblXml(parsed.zatcaResult.finalXml)
              }
              
              console.log('ZATCA QR and XML loaded successfully')
              return
            }
            
            // Fallback: Generate QR manually (legacy behavior)
            console.log('Generating QR manually (ZATCA not available)')
            
            // Use restaurant settings if available, otherwise fallback to tenant data
            const sellerName = restaurantSettings?.restaurantName || tenant?.name || 'Qayd POS System'
            const vatNumber = restaurantSettings?.vatNumber || tenant?.vatNumber || '123456789012345'
            // Ensure a single UUID is used for both QR and XML
            const invoiceUuid = parsed.uuid || generateUUID()
            // Ensure timestamp formatted per ZATCA
            const timestampIso = parsed.timestamp ? new Date(parsed.timestamp).toISOString() : formatZATCATimestamp(new Date())
            
            const qrData = {
              sellerName: sellerName,
              vatNumber: vatNumber,
              timestamp: timestampIso,
              total: parsed.total || 0,
              vatTotal: parsed.vat || 0,
              uuid: invoiceUuid
            }
            
            // Generate QR image for display
            const qr = await generateZATCAQR(qrData)
            setQrUrl(qr)
            
            // Generate TLV Base64 for UBL XML
                  
            // Generate UBL XML first (without QR data)
            const ublData = {
              invoiceNumber: parsed.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
              uuid: invoiceUuid,
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
              qrData: undefined // Generate XML first without QR data
            }
            
            const xml = generateUBLXML(ublData)
            
            // Generate SHA256 hash of XML for Tag 6
            const xmlHash = await generateXMLHash(xml)
            
            // Update QR data with XML hash
            const enhancedQrData = {
              ...qrData,
              xmlHash: xmlHash
            }
            
            // Generate enhanced QR with XML hash
            const enhancedQrTlvData = generateZATCAQRData(enhancedQrData)
            
            // Generate final UBL XML with QR data
            const finalUblData = {
              ...ublData,
              qrData: enhancedQrTlvData
            }
            
            // Build final XML (with QR) before signing
            const finalXml = generateUBLXML(finalUblData)

            // Generate XAdES B-B digital signature
            const xadesSignature = await generateXAdESSignature(finalXml)
            
            // Generate final UBL XML with digital signature
            const finalUblDataWithSignature = {
              ...finalUblData,
              digitalSignature: xadesSignature
            }
            
            const finalXmlWithSignature = generateUBLXML(finalUblDataWithSignature)
            setUblXml(finalXmlWithSignature)
            
            // Regenerate QR image using enhanced data (includes xmlHash)
            const qrFinal = await generateZATCAQR(enhancedQrData)
            setQrUrl(qrFinal)
            
            // Generate legacy digital signature and CSID for display
            const signature = generateDigitalSignature(finalXmlWithSignature)
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

  const downloadXml = (xmlContent: string, filename: string) => {
    const blob = new Blob([xmlContent], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadUBLSimplified = async () => {
    let xmlToDownload = ublXml
    
    // If no XML exists, generate it
    if (!xmlToDownload && order) {
      try {
        const sellerName = restaurantSettings?.restaurantName || currentTenant?.name || 'Qayd POS System'
        const vatNumber = restaurantSettings?.vatNumber || currentTenant?.vatNumber || '123456789012345'
        const invoiceUuid = order.uuid || generateUUID()
        
        const ublData = {
          invoiceNumber: order.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          uuid: invoiceUuid,
          issueDate: new Date(order.timestamp).toISOString().split('T')[0],
          issueTime: new Date(order.timestamp).toISOString().split('T')[1].split('.')[0],
          sellerName: sellerName,
          sellerVatNumber: vatNumber,
          sellerCrNumber: restaurantSettings?.crNumber || currentTenant?.crNumber || '1010101010',
          sellerAddress: restaurantSettings?.address || currentTenant?.address || 'Riyadh, Saudi Arabia',
          sellerPhone: restaurantSettings?.phone || currentTenant?.phone || '+966 11 123 4567',
          items: order.items?.map((item: any) => ({
            nameAr: item.nameAr || item.name,
            nameEn: item.nameEn || item.name,
            quantity: item.quantity,
            price: item.price,
            vatRate: 15
          })) || [],
          subtotal: order.subtotal || 0,
          vatTotal: order.vat || 0,
          total: order.total || 0
        }
        
        xmlToDownload = generateUBLXML(ublData)
      } catch (error) {
        console.error('Error generating XML for download:', error)
        alert('خطأ في توليد XML للتحميل')
        return
      }
    }
    
    if (!xmlToDownload) {
      alert('لا يمكن تحميل XML - لا توجد بيانات فاتورة')
      return
    }
    
    // Force KSA-2 name to simplified pattern 0200000
    const modified = xmlToDownload.replace(/<cbc:InvoiceTypeCode(\s+[^>]*)?>\s*([^<]+)\s*<\/cbc:InvoiceTypeCode>/, (_, attrs) => {
      const attrPart = attrs ? attrs.replace(/name="[^"]*"/, 'name="0200000"') : ' name="0200000"'
      return `<cbc:InvoiceTypeCode${attrPart}>388<\/cbc:InvoiceTypeCode>`
    })
    downloadXml(modified, `invoice_simplified_${order?.invoiceNumber || 'unknown'}.xml`)
  }

  // Removed handleDownloadUBLStandard in simplified flow

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
              طباعة
            </button>
            <button
              onClick={handleDownloadUBLSimplified}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 arabic"
            >
              <Download className="h-4 w-4 inline mr-2" />
              تحميل XML
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
          
          {/* ZATCA Status Badge */}
          <div className="flex justify-center mt-4">
            <ZATCAStatusBadge 
              zatcaResult={order?.zatcaResult} 
              zatcaError={order?.zatcaError} 
            />
          </div>
        </div>
      </div>

      {/* Removed XML Upload Section */}

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