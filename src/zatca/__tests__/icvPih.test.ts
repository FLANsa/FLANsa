import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getNextICV, getPreviousInvoiceHash, setPreviousInvoiceHash } from '../icvPih'

// Mock Firestore
const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn()
}

vi.mock('firebase/firestore', () => ({
  collection: mockFirestore.collection,
  doc: mockFirestore.doc,
  getDoc: mockFirestore.getDoc,
  setDoc: mockFirestore.setDoc,
  updateDoc: mockFirestore.updateDoc
}))

describe('ZATCA ICV/PIH Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getNextICV', () => {
    it('should return 1 for first invoice', async () => {
      const mockDoc = {
        exists: () => false
      }
      mockFirestore.getDoc.mockResolvedValue(mockDoc)
      mockFirestore.setDoc.mockResolvedValue(undefined)

      const result = await getNextICV('tenant1', 'egs1')

      expect(result).toBe(1)
      expect(mockFirestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { icv: 1, lastUpdated: expect.any(Date) }
      )
    })

    it('should increment ICV for existing counter', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ icv: 5 })
      }
      mockFirestore.getDoc.mockResolvedValue(mockDoc)
      mockFirestore.updateDoc.mockResolvedValue(undefined)

      const result = await getNextICV('tenant1', 'egs1')

      expect(result).toBe(6)
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { icv: 6, lastUpdated: expect.any(Date) }
      )
    })
  })

  describe('getPreviousInvoiceHash', () => {
    it('should return seed hash for first invoice', async () => {
      const mockDoc = {
        exists: () => false
      }
      mockFirestore.getDoc.mockResolvedValue(mockDoc)

      const result = await getPreviousInvoiceHash('tenant1', 'egs1')

      expect(result).toBe('ZATCA_SEED_HASH')
    })

    it('should return stored PIH for existing chain', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ pih: 'stored_hash_123' })
      }
      mockFirestore.getDoc.mockResolvedValue(mockDoc)

      const result = await getPreviousInvoiceHash('tenant1', 'egs1')

      expect(result).toBe('stored_hash_123')
    })
  })

  describe('setPreviousInvoiceHash', () => {
    it('should store PIH for next invoice', async () => {
      mockFirestore.setDoc.mockResolvedValue(undefined)

      await setPreviousInvoiceHash('tenant1', 'egs1', 'new_hash_456')

      expect(mockFirestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { pih: 'new_hash_456', lastUpdated: expect.any(Date) }
      )
    })
  })

  describe('ICV/PIH sequencing', () => {
    it('should maintain correct sequence across multiple invoices', async () => {
      // First invoice
      const mockDoc1 = { exists: () => false }
      mockFirestore.getDoc.mockResolvedValueOnce(mockDoc1)
      mockFirestore.setDoc.mockResolvedValue(undefined)

      const icv1 = await getNextICV('tenant1', 'egs1')
      expect(icv1).toBe(1)

      // Second invoice
      const mockDoc2 = { exists: () => true, data: () => ({ icv: 1 }) }
      mockFirestore.getDoc.mockResolvedValueOnce(mockDoc2)
      mockFirestore.updateDoc.mockResolvedValue(undefined)

      const icv2 = await getNextICV('tenant1', 'egs1')
      expect(icv2).toBe(2)

      // Third invoice
      const mockDoc3 = { exists: () => true, data: () => ({ icv: 2 }) }
      mockFirestore.getDoc.mockResolvedValueOnce(mockDoc3)
      mockFirestore.updateDoc.mockResolvedValue(undefined)

      const icv3 = await getNextICV('tenant1', 'egs1')
      expect(icv3).toBe(3)
    })
  })
})

