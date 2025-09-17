import { 
  collection, 
  doc, 
  addDoc, 
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
export interface User {
  id: string
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
  name: string
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
  updatedAt: any
}

// Collections
const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  ITEMS: 'items',
  ORDERS: 'orders',
  SETTINGS: 'settings'
}

// User Services
export const userService = {
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
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

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    const q = query(
      collection(db, COLLECTIONS.CUSTOMERS),
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

  async getActiveItems(): Promise<Item[]> {
    const q = query(
      collection(db, COLLECTIONS.ITEMS),
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

  async getOrdersByStatus(status: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
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

  async updateSettings(settingsData: Partial<Settings>) {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'main')
    await updateDoc(settingsRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    })
  },

  async createDefaultSettings() {
    const defaultSettings: Omit<Settings, 'id' | 'updatedAt'> = {
      restaurantName: 'Big Diet Restaurant',
      restaurantNameAr: 'مطعم Big Diet',
      vatNumber: '123456789012345',
      crNumber: '1010101010',
      phone: '+966 11 123 4567',
      address: 'Riyadh, Saudi Arabia',
      addressAr: 'الرياض، المملكة العربية السعودية',
      email: 'info@bigdiet.com',
      vatRate: 15,
      currency: 'SAR',
      language: 'ar'
    }

    await addDoc(collection(db, COLLECTIONS.SETTINGS), {
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

  subscribeToCustomers(callback: (customers: Customer[]) => void) {
    return onSnapshot(collection(db, COLLECTIONS.CUSTOMERS), (querySnapshot) => {
      const customers = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Customer))
      callback(customers)
    })
  }
}
