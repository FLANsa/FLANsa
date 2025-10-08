import { SimplifiedInvoice, Seller } from './models'
import { buildSimplifiedInvoiceXML, injectQrIntoSignedXml } from './ubl'
import { buildInvoiceQRBase64 } from './qr'
import { getNextICV, getPreviousInvoiceHash, setPreviousInvoiceHash } from './icvPih'
import { signXmlXadesB, sha256Base64 } from './signing'
import { validateSimplifiedInvoiceXml } from './validate'
import { reportSimplifiedInvoice } from './reporting'

const EGS_UNIT_ID = (typeof window === 'undefined') ? (process.env.EGS_UNIT_ID as string) : (import.meta.env.VITE_EGS_UNIT_ID as any)
const CSID_CERT_PFX_BASE64 = (typeof window === 'undefined') ? (process.env.CSID_CERT_PFX_BASE64 as string) : ''
const CSID_CERT_PASSWORD = (typeof window === 'undefined') ? (process.env.CSID_CERT_PASSWORD as string) : ''

export async function buildAndSendSimplifiedInvoice(ctx: { tenantId: string, invoice: SimplifiedInvoice, seller: Seller }) {
  // 1) ICV/PIH
  const icv = await getNextICV(ctx.tenantId, EGS_UNIT_ID)
  const pih = await getPreviousInvoiceHash(ctx.tenantId, EGS_UNIT_ID)

  // 2) draft XML (no QR)
  const xmlDraft = buildSimplifiedInvoiceXML({ ...ctx.invoice, icv, previousInvoiceHash: pih, qrBase64: '' }, ctx.seller, {})

  // 3) sign XML
  const { signedXml, dsigDigestBase64 } = await signXmlXadesB(xmlDraft, CSID_CERT_PFX_BASE64, CSID_CERT_PASSWORD)

  // 4) hash + QR
  const xmlHashBase64 = sha256Base64(signedXml)
  const qr = buildInvoiceQRBase64({
    sellerName: ctx.seller.nameAr || ctx.seller.nameEn,
    vat: ctx.seller.vatNumber,
    isoDateTime: ctx.invoice.issueDateTime,
    totalWithVat: ctx.invoice.summary.taxInclusiveAmount.toFixed(2),
    vatAmount: ctx.invoice.summary.taxAmount.toFixed(2),
    xmlHashBase64,
    signatureDataBase64: dsigDigestBase64
  })

  // 5) inject QR
  const finalXml = injectQrIntoSignedXml(signedXml, qr)

  // 6) validate
  validateSimplifiedInvoiceXml(finalXml)

  // 7) report
  const reportingResult = await reportSimplifiedInvoice(finalXml)
  if (reportingResult.accepted) {
    await setPreviousInvoiceHash(ctx.tenantId, EGS_UNIT_ID, xmlHashBase64)
  }

  return { finalXml, qrBase64: qr, reportingResult }
}


