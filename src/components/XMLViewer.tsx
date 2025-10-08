import React, { useState } from 'react'
import { Eye, EyeOff, Copy, Download, Printer } from 'lucide-react'

interface XMLViewerProps {
  xmlContent: string
  fileName?: string
  className?: string
}

const XMLViewer: React.FC<XMLViewerProps> = ({ xmlContent, fileName = 'invoice.xml', className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const formatXML = (xml: string): string => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xml, 'text/xml')
      
      // التحقق من وجود أخطاء في التحليل
      const parseErrors = xmlDoc.getElementsByTagName('parsererror')
      if (parseErrors.length > 0) {
        return xml // إرجاع XML الأصلي إذا كان هناك خطأ
      }

      // تنسيق XML بشكل جميل
      const serializer = new XMLSerializer()
      const formatted = serializer.serializeToString(xmlDoc)
      
      // إضافة مسافات بسيطة للتنسيق
      return formatted
        .replace(/></g, '>\n<')
        .split('\n')
        .map((line, index) => {
          const depth = (line.match(/</g) || []).length - (line.match(/\//g) || []).length
          return '  '.repeat(Math.max(0, depth)) + line.trim()
        })
        .join('\n')
    } catch (error) {
      return xml // إرجاع XML الأصلي في حالة الخطأ
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('خطأ في النسخ:', error)
    }
  }

  const downloadXML = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const printXML = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>طباعة XML الفاتورة</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <h2>XML الفاتورة</h2>
            <pre>${formatXML(xmlContent)}</pre>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getFileSize = (content: string): string => {
    const bytes = new Blob([content]).size
    if (bytes < 1024) return `${bytes} بايت`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`
  }

  const getLineCount = (content: string): number => {
    return content.split('\n').length
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">XML محمل بنجاح</span>
          </div>
          <div className="text-xs text-gray-500">
            {getFileSize(xmlContent)} • {getLineCount(xmlContent)} سطر
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            <Copy className="w-4 h-4 mr-1" />
            {copied ? 'تم النسخ!' : 'نسخ'}
          </button>
          
          <button
            onClick={downloadXML}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            <Download className="w-4 h-4 mr-1" />
            تحميل
          </button>
          
          <button
            onClick={printXML}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            <Printer className="w-4 h-4 mr-1" />
            طباعة
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {isExpanded ? 'إخفاء' : 'معاينة'}
          </button>
        </div>
      </div>

      {/* XML Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
              {formatXML(xmlContent)}
            </pre>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">اسم الملف:</span>
            <span className="ml-2 font-medium">{fileName}</span>
          </div>
          <div>
            <span className="text-gray-600">الحجم:</span>
            <span className="ml-2 font-medium">{getFileSize(xmlContent)}</span>
          </div>
          <div>
            <span className="text-gray-600">عدد الأسطر:</span>
            <span className="ml-2 font-medium">{getLineCount(xmlContent)}</span>
          </div>
          <div>
            <span className="text-gray-600">التشفير:</span>
            <span className="ml-2 font-medium">UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default XMLViewer
