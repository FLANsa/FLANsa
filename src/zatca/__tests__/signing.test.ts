import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signXmlXadesB, sha256Base64 } from '../signing'

// Mock fetch for server-side signing
global.fetch = vi.fn()

describe('ZATCA Signing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sha256Base64', () => {
    it('should hash string input correctly', () => {
      const input = 'test string'
      const result = sha256Base64(input)
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should hash Uint8Array input correctly', () => {
      const input = new TextEncoder().encode('test data')
      const result = sha256Base64(input)
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should produce consistent hashes for same input', () => {
      const input = 'consistent test'
      const hash1 = sha256Base64(input)
      const hash2 = sha256Base64(input)
      
      expect(hash1).toBe(hash2)
    })
  })

  describe('signXmlXadesB', () => {
    it('should call server signing endpoint', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          ok: true,
          signedXml: '<Invoice><ds:Signature>...</ds:Signature></Invoice>',
          dsigDigestBase64: 'abc123'
        })
      }
      
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const xml = '<Invoice>test</Invoice>'
      const pfxBase64 = 'dGVzdA==' // base64 for 'test'
      const password = 'testpass'

      const result = await signXmlXadesB(xml, pfxBase64, password)

      expect(global.fetch).toHaveBeenCalledWith('/api/zatca/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml, pfxBase64, password })
      })

      expect(result).toEqual({
        signedXml: '<Invoice><ds:Signature>...</ds:Signature></Invoice>',
        dsigDigestBase64: 'abc123'
      })
    })

    it('should handle server errors', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          ok: false,
          message: 'Signing failed'
        })
      }
      
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const xml = '<Invoice>test</Invoice>'
      const pfxBase64 = 'dGVzdA=='
      const password = 'testpass'

      await expect(signXmlXadesB(xml, pfxBase64, password))
        .rejects.toThrow('Signing failed')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const xml = '<Invoice>test</Invoice>'
      const pfxBase64 = 'dGVzdA=='
      const password = 'testpass'

      await expect(signXmlXadesB(xml, pfxBase64, password))
        .rejects.toThrow('Signing failed: Network error')
    })
  })
})

