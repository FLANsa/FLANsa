import { settingsService } from '../lib/firebaseServices'

export interface ZatcaConfig {
  environment: 'sandbox' | 'production'
  reportingUrl: string
  egsUnitId: string
  org: {
    vat: string
    nameAr?: string
    nameEn?: string
    country: 'SA'
    crn?: string
    addressAr?: string
  }
  signing: {
    pfxBase64?: string
    password?: string
  }
}

export async function getZatcaConfig(tenantId?: string): Promise<ZatcaConfig> {
  // Fallbacks from env
  const env = (typeof window === 'undefined') ? process.env : (import.meta as any).env
  const environment = (env.ZATCA_ENV || env.VITE_ZATCA_ENV || 'sandbox') as 'sandbox' | 'production'
  const reportingUrl = (env.ZATCA_REPORTING_URL || env.VITE_ZATCA_REPORTING_URL || '') as string
  const egsUnitId = (env.EGS_UNIT_ID || env.VITE_EGS_UNIT_ID || '') as string

  let orgVat = (env.ORG_VAT_NUMBER || env.VITE_ZATCA_VAT_NUMBER || '') as string
  let orgNameAr = (env.ORG_NAME_AR || env.VITE_ZATCA_SELLER_NAME_AR || '') as string
  let orgNameEn = (env.ORG_NAME_EN || env.VITE_ZATCA_SELLER_NAME || '') as string
  let orgCountry = ((env.ORG_COUNTRY || 'SA') as 'SA')
  let orgCrn = (env.ORG_CRN || env.VITE_ZATCA_CR_NUMBER || '') as string
  let orgAddressAr = (env.ORG_ADDRESS_AR || env.VITE_BUSINESS_ADDRESS_AR || '') as string

  // Tenant settings fallback (multi‑tenant)
  if (tenantId) {
    try {
      const settings = await settingsService.getSettingsByTenant(tenantId)
      if (settings) {
        orgVat = settings.vatNumber || orgVat
        orgNameAr = settings.restaurantNameAr || orgNameAr
        orgNameEn = settings.restaurantName || orgNameEn
        orgCrn = settings.crNumber || orgCrn
        orgAddressAr = settings.addressAr || orgAddressAr
      }
    } catch {
      // ignore
    }
  }

  return {
    environment,
    reportingUrl,
    egsUnitId,
    org: {
      vat: orgVat,
      nameAr: orgNameAr,
      nameEn: orgNameEn,
      country: orgCountry,
      crn: orgCrn,
      addressAr: orgAddressAr
    },
    signing: {
      pfxBase64: (env.CSID_CERT_PFX_BASE64 as string | undefined),
      password: (env.CSID_CERT_PASSWORD as string | undefined)
    }
  }
}


