/**
 * ZATCA Proxy Client - Secure Server Communication
 * Handles UTF-8 encoding and secure server communication
 */

import { toBase64Utf8 } from '../utils/base64'

export interface ZATCAInvoiceSubmission {
  invoiceXML: string
  uuid: string
  invoiceHash: string
  previousHash?: string
  counterValue?: number
}

export interface ZATCAResponse {
  success: boolean
  invoiceHash: string
  qrCode: string
  uuid: string
  timestamp: string
  metadata?: any
  errors?: string[]
}

/**
 * Send invoice to ZATCA via secure server proxy
 * Handles UTF-8 encoding and Arabic text properly
 */
export async function sendInvoiceToZATCA(params: ZATCAInvoiceSubmission): Promise<ZATCAResponse> {
  try {
    console.log('🌐 Sending invoice to ZATCA via secure proxy...')

    // Properly encode XML with UTF-8 support
    const invoiceXMLBase64 = toBase64Utf8(params.invoiceXML)

    // Determine endpoint based on document type (B2B vs B2C)
    const endpoint = '/api/zatca/clearance' // Default to clearance for B2B
    
    console.log('📡 Submitting to:', endpoint)
    console.log('📋 Invoice details:', {
      uuid: params.uuid,
      hashLength: params.invoiceHash.length,
      xmlSize: params.invoiceXML.length,
      xmlBase64Size: invoiceXMLBase64.length
    })

    // Send to our Express server
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uuid: params.uuid,
        invoiceHash: params.invoiceHash,
        invoiceXMLBase64,
        previousHash: params.previousHash,
        counterValue: params.counterValue
      })
    })

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Server response error:', response.status, errorText)
      throw new Error(`خطأ في الخادم: ${response.status} - ${errorText}`)
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text()
    if (!responseText || responseText.trim() === '') {
      console.error('❌ Empty response from server')
      throw new Error('استجابة فارغة من الخادم - تأكد من تشغيل خادم زاتكا')
    }

    let serverResponse
    try {
      serverResponse = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Failed to parse server response:', responseText)
      throw new Error('خطأ في تحليل استجابة الخادم - تأكد من تشغيل خادم زاتكا')
    }

    // Check for server/success errors
    if (!response.ok || !serverResponse.ok) {
      console.error('❌ Server error response:', serverResponse)
      throw new Error(serverResponse.message || `Server error: ${response.status}`)
    }

    // Map server response to our expected format
    const result: ZATCAResponse = {
      success: true,
      invoiceHash: serverResponse.data?.invoiceHash || params.invoiceHash,
      qrCode: serverResponse.data?.qrCode || '',
      uuid: serverResponse.data?.uuid || params.uuid,
      timestamp: serverResponse.timestamp || new Date().toISOString(),
      metadata: serverResponse.data || {},
      errors: serverResponse.data?.errors
    }

    console.log('✅ Invoice submitted to ZATCA successfully')
    console.log('📊 Response:', {
      success: result.success,
      hasQR: !!result.qrCode,
      hasMetadata: !!result.metadata,
      timestamp: result.timestamp
    })

    return result

  } catch (error: any) {
    console.error('❌ Error in sendInvoiceToZATCA:', error)
    
    // Provide more detailed error information
    let errorMessage = 'فشل في إرسال الفاتورة لزاتكا'
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    throw new Error(errorMessage)
  }
}

/**
 * Check ZATCA proxy service status
 */
export async function checkZATCAStatus(): Promise<{ ok: boolean; message: string; details?: any }> {
  try {
    const response = await fetch('/api/zatca/status')
    const data = await response.json()
    
    return {
      ok: data.ok,
      message: data.ok ? 'خدمة زاتكا متوفرة' : 'خدمة زاتكا غير متوفرة',
      details: data
    }
  } catch (error: any) {
    return {
      ok: false,
      message: 'خطأ في الاتصال بخدمة زاتكا',
      details: error.message
    }
  }
}
