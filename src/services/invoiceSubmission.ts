/**
 * Invoice Submission Service for ZATCA Integration
 * Handles the complete flow from invoice creation to ZATCA submission
 */

import { zatcaAPI } from '../lib/zatcaAPI'
import { generateUBLXML, generateZATCAQRData, formatZATCATimestamp } from '../lib/zatca'
import { authService } from '../lib/authService'
import { settingsService } from '../lib/firebaseServices'

export interface InvoiceSubmissionData {
  order: any
  restaurantSettings?: any
  tenant?: any
}

export interface ZATCAInvoiceResult {
  success: boolean
  zatcaResponse?: any
  signedInvoice?: string
  signedQR?: string
  submissionId?: string
  errors?: string[]
}

class InvoiceSubmissionService {
  
  /**
   * Submit invoice to ZATCA with full validation and signing
   */
  async submitInvoiceToZATCA(data: InvoiceSubmissionData): Promise<ZATCAInvoiceResult> {
    try {
      console.log('🚀 Starting ZATCA invoice submission process...')

      // Step 1: Validate business registration
      const isValidBusiness = await this.validateBusiness(data)
      if (!isValidBusiness) {
        return {
          success: false,
          errors: ['Business registration validation failed']
        }
      }

      // Step 2: Generate complete invoice data
      const invoiceData = await this.generateInvoiceData(data)
      
      // Step 3: Generate UBL XML
      const ublXML = this.generateUBLForSubmission(invoiceData)
      
      // Step 4: Generate QR data
      const qrData = generateZATCAQRData(invoiceData.qrData)
      
      // Step 5: Prepare submission data
      const submissionData = {
        invoiceXML: ublXML,
        uuid: invoiceData.uuid,
        invoiceHash: this.generateInvoiceHash(ublXML),
        previousHash: await this.getPreviousInvoiceHash(),
        counterValue: await zatcaAPI.getNextInvoiceCounter()
      }

      // Step 6: Submit to ZATCA
      const zatcaResponse = await zatcaAPI.submitInvoice(submissionData)

      if (zatcaResponse.success) {
        // Step 7: Store signed results
        const result = await this.storeSignedResults(data.order, zatcaResponse)
        
        console.log('✅ Invoice successfully submitted and signed by ZATCA')
        return {
          success: true,
          zatcaResponse,
          submissionId: result.submissionId,
          signedInvoice: zatcaResponse.qrCode,
          signedQR: zatcaResponse.qrCode
        }
      } else {
        console.error('❌ ZATCA rejected the invoice')
        return {
          success: false,
          zatcaResponse,
          errors: zatcaResponse.errors || ['ZATCA submission failed']
        }
      }

    } catch (error) {
      console.error('❌ Error in invoice submission process:', error)
      return {
        success: false,
        errors: [`Submission error: ${error}`]
      }
    }
  }

  /**
   * Validate business registration and settings
   */
  private async validateBusiness(data: InvoiceSubmissionData): Promise<boolean> {
    try {
      const currentTenant = authService.getCurrentTenant()
      const vatNumber = data.restaurantSettings?.vatNumber || currentTenant?.vatNumber
      
      if (!vatNumber) {
        console.error('❌ VAT number not found')
        return false
      }

      // Validate with ZATCA
      const isValid = await zatcaAPI.validateBusinessRegistration(vatNumber)
      
      if (!isValid) {
        console.error('❌ Business registration validation failed')
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Business validation error:', error)
      return false
    }
  }

  /**
   * Generate complete invoice data
   */
  private async generateInvoiceData(data: InvoiceSubmissionData): Promise<any> {
    const { order, restaurantSettings, tenant } = data
    
    return {
      invoiceNumber: order.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      uuid: order.uuid || this.generateUUID(),
      issueDate: new Date(order.timestamp).toISOString().split('T')[0],
      issueTime: new Date(order.timestamp).toISOString().split('T')[1].split('.')[0],
      sellerName: restaurantSettings?.restaurantName || tenant?.name || 'Qayd POS System',
      sellerVatNumber: restaurantSettings?.vatNumber || tenant?.vatNumber || '123456789012345',
      sellerCrNumber: restaurantSettings?.crNumber || tenant?.crNumber || '1010101010',
      sellerAddress: restaurantSettings?.address || tenant?.address || 'Riyadh, Saudi Arabia',
      sellerPhone: restaurantSettings?.phone || tenant?.phone || '+966 11 123 4567',
      items: order.items?.map((item: any) => ({
        nameAr: item.nameAr || item.name,
        nameEn: item.nameEn || item.name,
        quantity: item.quantity,
        price: item.price,
        vatRate: 15
      })) || [],
      subtotal: order.subtotal || 0,
      vatTotal: order.vat || 0,
      total: order.total || 0,
      qrData: {
        sellerName: restaurantSettings?.restaurantName || tenant?.name || 'Qayd POS System',
        vatNumber: restaurantSettings?.vatNumber || tenant?.vatNumber || '123456789012345',
        timestamp: order.timestamp || formatZATCATimestamp(new Date()),
        total: order.total || 0,
        vatTotal: order.vat || 0,
        uuid: order.uuid || this.generateUUID()
      }
    }
  }

  /**
   * Generate UBL XML for ZATCA submission
   */
  private generateUBLForSubmission(invoiceData: any): string {
    const qrData = generateZATCAQRData(invoiceData.qrData)
    
    return generateUBLXML({
      ...invoiceData,
      qrData
    })
  }

  /**
   * Generate invoice hash
   */
  private generateInvoiceHash(xmlContent: string): string {
    // TODO: Implement ZATCA-compliant hash algorithm
    return btoa(xmlContent).substring(0, 32)
  }

  /**
   * Get previous invoice hash (PIH)
   */
  private async getPreviousInvoiceHash(): Promise<string | undefined> {
    try {
      // TODO: Retrieve last invoice hash from database
      // This should get the previous invoice hash for chain validation
      return undefined
    } catch (error) {
      console.error('Error getting previous invoice hash:', error)
      return undefined
    }
  }

  /**
   * Store signed results
   */
  private async storeSignedResults(order: any, zatcaResponse: any): Promise<any> {
    try {
      // TODO: Store signed invoice data in database
      const submissionId = `SUB_${Date.now()}`
      
      console.log('💾 Storing signed invoice results...')
      
      return { submissionId }
    } catch (error) {
      console.error('Error storing signed results:', error)
      throw error
    }
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Check ZATCA service status
   */
  async checkZATCAStatus(): Promise<boolean> {
    try {
      const status = await zatcaAPI.getSystemStatus()
      return status.status === 'OPERATIONAL' && !status.maintenanceMode
    } catch (error) {
      console.error('Error checking ZATCA status:', error)
      return false
    }
  }
}

// Export singleton instance
export const invoiceSubmissionService = new InvoiceSubmissionService()
