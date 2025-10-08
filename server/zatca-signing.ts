import * as forge from 'node-forge'
import * as xmldom from 'xmldom'
import { SignedXml } from 'xml-crypto'

export function sha256Base64(input: string | Uint8Array): string {
  const crypto = require('crypto')
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(input)
  return crypto.createHash('sha256').update(buf).digest('base64')
}

export async function signXmlXadesB(xml: string, pfxBase64: string, password: string): Promise<{ signedXml: string, dsigDigestBase64: string }> {
  try {
    // Decode PFX from Base64
    const pfxDer = Buffer.from(pfxBase64, 'base64')
    const pfxAsn1 = forge.asn1.fromDer(pfxDer.toString('binary'))
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, password)
    
    // Extract private key and certificate
    const bags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    const keyBags = bags[forge.pki.oids.pkcs8ShroudedKeyBag]
    if (!keyBags || keyBags.length === 0) {
      throw new Error('No private key found in PFX')
    }
    
    const privateKey = keyBags[0].key as forge.pki.PrivateKey
    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag })
    const certBag = certBags[forge.pki.oids.certBag]
    if (!certBag || certBag.length === 0) {
      throw new Error('No certificate found in PFX')
    }
    
    const certificate = certBag[0].cert as forge.pki.Certificate
    
    // Convert to PEM format
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey)
    const certificatePem = forge.pki.certificateToPem(certificate)
    
    // Parse XML
    const DOMParser = xmldom.DOMParser
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    
    // Create XAdES B-B signature
    const signedXml = new SignedXml()
    
    // Configure signature
    signedXml.addReference("//*[local-name()='Invoice']", [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
    ])
    
    signedXml.signingKey = privateKeyPem
    signedXml.keyInfoProvider = {
      getKeyInfo: () => {
        return `<X509Data><X509Certificate>${certificatePem.replace(/-----BEGIN CERTIFICATE-----\n/, '').replace(/\n-----END CERTIFICATE-----/, '').replace(/\n/g, '')}</X509Certificate></X509Data>`
      }
    }
    
    // Sign the XML
    signedXml.computeSignature(xml)
    
    // Get signed XML
    const signedXmlString = signedXml.getSignedXml()
    
    // Calculate digest for TLV
    const digest = sha256Base64(signedXmlString)
    
    return {
      signedXml: signedXmlString,
      dsigDigestBase64: digest
    }
    
  } catch (error) {
    console.error('XAdES B-B signing error:', error)
    throw new Error(`Signing failed: ${error}`)
  }
}
