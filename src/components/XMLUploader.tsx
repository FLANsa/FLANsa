import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'

interface XMLUploaderProps {
  onXMLLoaded: (xmlContent: string, isValid: boolean) => void
  className?: string
}

interface XMLValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  extractedData?: {
    invoiceNumber?: string
    uuid?: string
    sellerName?: string
    total?: string
    issueDate?: string
  }
}

const XMLUploader: React.FC<XMLUploaderProps> = ({ onXMLLoaded, className = '' }) => {
  const [dragActive, setDragActive] = useState(false)
  const [validationResult, setValidationResult] = useState<XMLValidationResult | null>(null)
  const [xmlContent, setXmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * تحقق من صحة XML وفقاً لمتطلبات الهيئة
   */
  const validateZATCAXML = (xmlContent: string): XMLValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []
    const extractedData: any = {}

    try {
      // تحليل XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')
      
      // التحقق من وجود أخطاء في التحليل
      const parseErrors = xmlDoc.getElementsByTagName('parsererror')
      if (parseErrors.length > 0) {
        errors.push('XML غير صالح - خطأ في التحليل')
        return { isValid: false, errors, warnings }
      }

      // التحقق من العناصر المطلوبة للهيئة
      const requiredElements = [
        'cbc:CustomizationID',
        'cbc:ProfileID', 
        'cbc:ID',
        'cbc:UUID',
        'cbc:IssueDate',
        'cbc:IssueTime',
        'cbc:InvoiceTypeCode',
        'cbc:DocumentCurrencyCode',
        'cac:AccountingSupplierParty',
        'cac:LegalMonetaryTotal'
      ]

      requiredElements.forEach(element => {
        const found = xmlDoc.getElementsByTagName(element)
        if (found.length === 0) {
          errors.push(`العنصر المطلوب مفقود: ${element}`)
        }
      })

      // التحقق من CustomizationID للهيئة
      const customizationId = xmlDoc.getElementsByTagName('cbc:CustomizationID')[0]?.textContent
      if (customizationId && !customizationId.includes('urn:sa:qayd-pos:invoice')) {
        warnings.push('CustomizationID قد لا يكون متوافقاً مع الهيئة')
      }

      // التحقق من ProfileID
      const profileId = xmlDoc.getElementsByTagName('cbc:ProfileID')[0]?.textContent
      if (profileId && profileId !== 'reporting:1.0') {
        warnings.push('ProfileID يجب أن يكون reporting:1.0 للهيئة')
      }

      // التحقق من العملة
      const currency = xmlDoc.getElementsByTagName('cbc:DocumentCurrencyCode')[0]?.textContent
      if (currency && currency !== 'SAR') {
        errors.push('العملة يجب أن تكون SAR')
      }

      // استخراج البيانات الأساسية
      extractedData.invoiceNumber = xmlDoc.getElementsByTagName('cbc:ID')[0]?.textContent || ''
      extractedData.uuid = xmlDoc.getElementsByTagName('cbc:UUID')[0]?.textContent || ''
      extractedData.issueDate = xmlDoc.getElementsByTagName('cbc:IssueDate')[0]?.textContent || ''
      
      const sellerName = xmlDoc.getElementsByTagName('cbc:Name')[0]?.textContent
      if (sellerName) extractedData.sellerName = sellerName

      const payableAmount = xmlDoc.getElementsByTagName('cbc:PayableAmount')[0]?.textContent
      if (payableAmount) extractedData.total = payableAmount

      // التحقق من وجود QR Code
      const qrRefs = xmlDoc.getElementsByTagName('cac:AdditionalDocumentReference')
      let hasQR = false
      for (let i = 0; i < qrRefs.length; i++) {
        const id = qrRefs[i].getElementsByTagName('cbc:ID')[0]?.textContent
        if (id === 'QR') {
          hasQR = true
          break
        }
      }
      if (!hasQR) {
        warnings.push('QR Code غير موجود - قد يكون مطلوباً للهيئة')
      }

      // التحقق من التوقيع الرقمي
      const signatures = xmlDoc.getElementsByTagName('cac:Signature')
      if (signatures.length === 0) {
        warnings.push('التوقيع الرقمي غير موجود - قد يكون مطلوباً للهيئة')
      }

    } catch (error) {
      errors.push(`خطأ في التحقق من XML: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      extractedData: Object.keys(extractedData).length > 0 ? extractedData : undefined
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      alert('يرجى اختيار ملف XML فقط')
      return
    }

    setIsLoading(true)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      setXmlContent(content)
      
      // التحقق من صحة XML
      const validation = validateZATCAXML(content)
      setValidationResult(validation)
      
      // إرسال النتيجة للوالد
      onXMLLoaded(content, validation.isValid)
      setIsLoading(false)
    }
    
    reader.onerror = () => {
      alert('خطأ في قراءة الملف')
      setIsLoading(false)
    }
    
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const downloadSampleXML = () => {
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:sa:qayd-pos:invoice:1.0</cbc:CustomizationID>
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>INV-001</cbc:ID>
  <cbc:UUID>12345678-1234-1234-1234-123456789012</cbc:UUID>
  <cbc:IssueDate>2024-01-15</cbc:IssueDate>
  <cbc:IssueTime>10:30:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">1234567890</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>اسم الشركة</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>العنوان</cbc:StreetName>
        <cbc:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cbc:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:Telephone>0501234567</cbc:Telephone>
      </cac:Contact>
      <cac:PartyTaxScheme>
        <cbc:CompanyID schemeID="VAT">300000000000003</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">100.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">100.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">115.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">115.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`

    const blob = new Blob([sampleXML], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_zatca_invoice.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* منطقة السحب والإفلات */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="text-lg font-medium text-gray-900 mb-2">
          اسحب ملف XML هنا أو اضغط للاختيار
        </div>
        <div className="text-sm text-gray-500 mb-4">
          يجب أن يكون الملف متوافقاً مع متطلبات الهيئة العامة للزكاة والضريبة
        </div>
        
        <input
          type="file"
          accept=".xml"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
          id="xml-upload"
        />
        <label
          htmlFor="xml-upload"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          اختر ملف XML
        </label>
        
        <button
          onClick={downloadSampleXML}
          className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" />
          تحميل نموذج XML
        </button>
      </div>

      {/* حالة التحميل */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">جاري التحقق من الملف...</span>
        </div>
      )}

      {/* نتائج التحقق */}
      {validationResult && !isLoading && (
        <div className="space-y-4">
          {/* حالة الصحة العامة */}
          <div className={`flex items-center p-4 rounded-lg ${
            validationResult.isValid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {validationResult.isValid ? (
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            )}
            <div>
              <div className={`font-medium ${
                validationResult.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.isValid ? 'XML صالح ومتوافق مع الهيئة' : 'XML يحتوي على أخطاء'}
              </div>
              <div className={`text-sm ${
                validationResult.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {validationResult.errors.length} خطأ، {validationResult.warnings.length} تحذير
              </div>
            </div>
          </div>

          {/* الأخطاء */}
          {validationResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">الأخطاء:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* التحذيرات */}
          {validationResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">التحذيرات:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* البيانات المستخرجة */}
          {validationResult.extractedData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">البيانات المستخرجة:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                {validationResult.extractedData.invoiceNumber && (
                  <div>رقم الفاتورة: {validationResult.extractedData.invoiceNumber}</div>
                )}
                {validationResult.extractedData.uuid && (
                  <div>UUID: {validationResult.extractedData.uuid}</div>
                )}
                {validationResult.extractedData.sellerName && (
                  <div>اسم البائع: {validationResult.extractedData.sellerName}</div>
                )}
                {validationResult.extractedData.total && (
                  <div>المجموع: {validationResult.extractedData.total} ريال</div>
                )}
                {validationResult.extractedData.issueDate && (
                  <div>تاريخ الإصدار: {validationResult.extractedData.issueDate}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default XMLUploader
