import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'

// Types
export interface Tenant {
  id: string
  name: string
  nameAr: string
  email: string
  phone: string
  address: string
  addressAr: string
  vatNumber: string
  crNumber: string
  subscriptionPlan: 'basic' | 'premium' | 'enterprise'
  subscriptionStatus: 'active' | 'suspended' | 'cancelled'
  subscriptionExpiry: any
  isActive: boolean
  createdAt: any
  updatedAt: any
}

export interface User {
  id: string
  tenantId: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'cashier'
  branchId?: string
  terminalId?: string
  isActive: boolean
  createdAt: any
  updatedAt: any
}

export interface Customer {
  id: string
  tenantId: string
  name: string
  phone: string
  email?: string
  address?: string
  totalOrders: number
  totalSpent: number
  createdAt: any
  updatedAt: any
}

export interface Item {
  id: string
  tenantId: string
  name: string
  nameAr: string
  nameEn: string
  price: number
  category: string
  stock: number
  minStock: number
  unit: string
  isActive: boolean
  createdAt: any
  updatedAt: any
}

export interface Order {
  id: string
  tenantId: string
  customerId?: string
  customerName: string
  customerPhone?: string
  items: Array<{
    id: string
    name: string
    nameEn: string
    price: number
    quantity: number
  }>
  subtotal: number
  vat: number
  discount: number
  total: number
  mode: 'dine-in' | 'takeaway' | 'delivery'
  status: 'pending' | 'preparing' | 'completed' | 'cancelled'
  paymentMethod?: string
  invoiceNumber: string
  branchId: string
  terminalId: string
  cashierId: string
  createdAt: any
  updatedAt: any
}

export interface Settings {
  id: string
  tenantId: string
  restaurantName: string
  restaurantNameAr: string
  vatNumber: string
  crNumber: string
  phone: string
  address: string
  addressAr: string
  email: string
  vatRate: number
  currency: string
  language: string
  logoUrl?: string
  printerIP?: string
  printProxyServerIP?: string
  updatedAt: any
  zatca?: {
    env?: 'sandbox' | 'production'
    egsUnitId?: string
    csidCertPfxBase64?: string
    csidCertPassword?: string
    otp?: string
    subscriptionKey?: string
    orgVatNumber?: string
    orgNameAr?: string
    orgNameEn?: string
    orgCrn?: string
    orgAddressAr?: string
    orgAddressEn?: string
    orgCity?: string
    orgPostalCode?: string
    orgPhone?: string
    orgEmail?: string
    connectionStatus?: 'disconnected' | 'connected' | 'error'
    lastSync?: string
  }
}

// Collections
const COLLECTIONS = {
  TENANTS: 'tenants',
  USERS: 'users',
  CUSTOMERS: 'customers',
  ITEMS: 'items',
  ORDERS: 'orders',
  SETTINGS: 'settings'
}

// Tenant Services
export const tenantService = {
  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, COLLECTIONS.TENANTS), {
      ...tenantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  async updateTenant(tenantId: string, tenantData: Partial<Tenant>) {
    const tenantRef = doc(db, COLLECTIONS.TENANTS, tenantId)
    await updateDoc(tenantRef, {
      ...tenantData,
      updatedAt: serverTimestamp()
    })
  },

  async getTenant(tenantId: string): Promise<Tenant | null> {
    const tenantDoc = await getDoc(doc(db, COLLECTIONS.TENANTS, tenantId))
    if (tenantDoc.exists()) {
      return { id: tenantDoc.id, ...tenantDoc.data() } as Tenant
    }
    return null
  },

  async getTenants(): Promise<Tenant[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TENANTS))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant))
  },

  async getActiveTenants(): Promise<Tenant[]> {
    const q = query(
      collection(db, COLLECTIONS.TENANTS),
      where('isActive', '==', true),
      where('subscriptionStatus', '==', 'active')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant))
  }
}

// User Services
export const userService = {
  async createUser(userData: User) {
    // Use the user's Firebase Auth UID as the document ID
    const userDocRef = doc(db, COLLECTIONS.USERS, userData.id)
    await setDoc(userDocRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return userData.id
  },

  async updateUser(userId: string, userData: Partial<User>) {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    })
  },

  async getUser(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User
    }
    return null
  },

  async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))
  },

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('tenantId', '==', tenantId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))
  }
}

// Customer Services
export const customerService = {
  async createCustomer(customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), {
      ...customerData,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  async updateCustomer(customerId: string, customerData: Partial<Customer>) {
    const customerRef = doc(db, COLLECTIONS.CUSTOMERS, customerId)
    await updateDoc(customerRef, {
      ...customerData,
      updatedAt: serverTimestamp()
    })
  },

  async getCustomer(customerId: string): Promise<Customer | null> {
    const customerDoc = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId))
    if (customerDoc.exists()) {
      return { id: customerDoc.id, ...customerDoc.data() } as Customer
    }
    return null
  },

  async getCustomers(): Promise<Customer[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer))
  },

  async getCustomersByTenant(tenantId: string): Promise<Customer[]> {
    const q = query(
      collection(db, COLLECTIONS.CUSTOMERS),
      where('tenantId', '==', tenantId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer))
  },

  async searchCustomers(searchTerm: string, tenantId: string): Promise<Customer[]> {
    const q = query(
      collection(db, COLLECTIONS.CUSTOMERS),
      where('tenantId', '==', tenantId),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer))
  }
}

// Item Services
export const itemService = {
  async createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, COLLECTIONS.ITEMS), {
      ...itemData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  async updateItem(itemId: string, itemData: Partial<Item>) {
    const itemRef = doc(db, COLLECTIONS.ITEMS, itemId)
    await updateDoc(itemRef, {
      ...itemData,
      updatedAt: serverTimestamp()
    })
  },

  async deleteItem(itemId: string) {
    await deleteDoc(doc(db, COLLECTIONS.ITEMS, itemId))
  },

  async getItem(itemId: string): Promise<Item | null> {
    const itemDoc = await getDoc(doc(db, COLLECTIONS.ITEMS, itemId))
    if (itemDoc.exists()) {
      return { id: itemDoc.id, ...itemDoc.data() } as Item
    }
    return null
  },

  async getItems(): Promise<Item[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ITEMS))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item))
  },

  async getItemsByTenant(tenantId: string): Promise<Item[]> {
    const q = query(
      collection(db, COLLECTIONS.ITEMS),
      where('tenantId', '==', tenantId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item))
  },

  async getActiveItems(): Promise<Item[]> {
    const q = query(
      collection(db, COLLECTIONS.ITEMS),
      where('isActive', '==', true)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item))
  },

  async getActiveItemsByTenant(tenantId: string): Promise<Item[]> {
    const q = query(
      collection(db, COLLECTIONS.ITEMS),
      where('tenantId', '==', tenantId),
      where('isActive', '==', true)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item))
  },

  async updateStock(itemId: string, newStock: number) {
    const itemRef = doc(db, COLLECTIONS.ITEMS, itemId)
    await updateDoc(itemRef, {
      stock: newStock,
      updatedAt: serverTimestamp()
    })
  }
}

// Order Services
export const orderService = {
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  async updateOrder(orderId: string, orderData: Partial<Order>) {
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId)
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp()
    })
  },

  async getOrder(orderId: string): Promise<Order | null> {
    const orderDoc = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId))
    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() } as Order
    }
    return null
  },

  async getOrders(): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
  },

  async getOrdersByTenant(tenantId: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
  },

  async getOrdersByStatus(status: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
  },

  async getOrdersByStatusAndTenant(status: string, tenantId: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('tenantId', '==', tenantId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
  },

  async getTodayOrders(): Promise<Order[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
  },

  async getTodayOrdersByTenant(tenantId: string): Promise<Order[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('tenantId', '==', tenantId),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
  }
}

// Settings Services
export const settingsService = {
  async getSettings(): Promise<Settings | null> {
    const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'main'))
    if (settingsDoc.exists()) {
      return { id: settingsDoc.id, ...settingsDoc.data() } as Settings
    }
    return null
  },

  async getSettingsByTenant(tenantId: string): Promise<Settings | null> {
    const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, tenantId))
    if (settingsDoc.exists()) {
      return { id: settingsDoc.id, ...settingsDoc.data() } as Settings
    }
    return null
  },

  async updateSettings(settingsData: Partial<Settings>) {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'main')
    await updateDoc(settingsRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    })
  },

  async updateSettingsByTenant(tenantId: string, settingsData: Partial<Settings>) {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, tenantId)
    // Use setDoc with merge to create if doesn't exist, or update if exists
    await setDoc(settingsRef, {
      tenantId,
      ...settingsData,
      updatedAt: serverTimestamp()
    }, { merge: true })
  },

  async createDefaultSettings(tenantId: string = 'main') {
    const defaultSettings: Omit<Settings, 'id' | 'updatedAt'> = {
      tenantId: tenantId,
      restaurantName: 'Qayd POS System',
      restaurantNameAr: 'قيد - نظام نقاط البيع',
      vatNumber: '123456789012345',
      crNumber: '1010101010',
      phone: '+966 11 123 4567',
      address: 'Riyadh, Saudi Arabia',
      addressAr: 'الرياض، المملكة العربية السعودية',
      email: 'info@qayd.com',
      vatRate: 15,
      currency: 'SAR',
      language: 'ar'
    }

    await addDoc(collection(db, COLLECTIONS.SETTINGS), {
      ...defaultSettings,
      updatedAt: serverTimestamp()
    })
  },

  async createDefaultSettingsForTenant(tenantId: string, tenantData: Partial<Tenant>) {
    const defaultSettings: Omit<Settings, 'id' | 'updatedAt'> = {
      tenantId,
      restaurantName: tenantData.name || 'Qayd POS System',
      restaurantNameAr: tenantData.nameAr || 'قيد - نظام نقاط البيع',
      vatNumber: tenantData.vatNumber || '123456789012345',
      crNumber: tenantData.crNumber || '1010101010',
      phone: tenantData.phone || '+966 11 123 4567',
      address: tenantData.address || 'Riyadh, Saudi Arabia',
      addressAr: tenantData.addressAr || 'الرياض، المملكة العربية السعودية',
      email: tenantData.email || 'info@qayd.com',
      vatRate: 15,
      currency: 'SAR',
      language: 'ar',
      logoUrl: '',
      printProxyServerIP: ''
    }

    // Use setDoc with tenantId as document ID to ensure consistency
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, tenantId)
    await setDoc(settingsRef, {
      ...defaultSettings,
      updatedAt: serverTimestamp()
    })
  }
}

// Real-time listeners
export const realtimeService = {
  subscribeToOrders(callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Order))
      callback(orders)
    })
  },

  subscribeToOrdersByTenant(tenantId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Order))
      callback(orders)
    })
  },

  subscribeToItems(callback: (items: Item[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.ITEMS),
      where('isActive', '==', true)
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Item))
      callback(items)
    })
  },

  subscribeToItemsByTenant(tenantId: string, callback: (items: Item[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.ITEMS),
      where('tenantId', '==', tenantId),
      where('isActive', '==', true)
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Item))
      callback(items)
    })
  },

  subscribeToCustomers(callback: (customers: Customer[]) => void) {
    return onSnapshot(collection(db, COLLECTIONS.CUSTOMERS), (querySnapshot) => {
      const customers = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Customer))
      callback(customers)
    })
  },

  subscribeToCustomersByTenant(tenantId: string, callback: (customers: Customer[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.CUSTOMERS),
      where('tenantId', '==', tenantId)
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const customers = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Customer))
      callback(customers)
    })
  }
}
