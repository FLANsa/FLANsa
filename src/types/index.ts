export interface User {
  uid: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'cashier'
  branchId: string
  terminalId?: string
  pin?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Branch {
  id: string
  name: string
  nameAr: string
  address: string
  addressAr: string
  phone: string
  email: string
  vatNumber: string
  crNumber: string
  logo?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Terminal {
  id: string
  branchId: string
  name: string
  nameAr: string
  pin: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  nameAr: string
  description?: string
  descriptionAr?: string
  image?: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Modifier {
  id: string
  name: string
  nameAr: string
  price: number
  isRequired: boolean
  maxSelections: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ModifierGroup {
  id: string
  name: string
  nameAr: string
  modifiers: Modifier[]
  isRequired: boolean
  maxSelections: number
}

export interface Item {
  id: string
  categoryId: string
  name: string
  nameAr: string
  description?: string
  descriptionAr?: string
  price: number
  image?: string
  barcode?: string
  sku: string
  stockQuantity: number
  lowStockThreshold: number
  modifierGroups: ModifierGroup[]
  isActive: boolean
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  id: string
  itemId: string
  name: string
  nameAr: string
  price: number
  quantity: number
  modifiers: SelectedModifier[]
  notes?: string
}

export interface SelectedModifier {
  id: string
  name: string
  nameAr: string
  price: number
  groupId: string
  groupName: string
  groupNameAr: string
}

export interface Customer {
  id: string
  name: string
  nameAr: string
  phone: string
  email?: string
  address?: string
  addressAr?: string
  dateOfBirth?: Date
  loyaltyPoints: number
  totalSpent: number
  lastVisit?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  orderNumber: string
  branchId: string
  terminalId: string
  cashierId: string
  customerId?: string
  mode: 'dine-in' | 'takeaway' | 'delivery'
  tableNumber?: string
  items: CartItem[]
  subtotal: number
  orderDiscount: number
  orderDiscountType: 'percentage' | 'fixed'
  serviceCharge: number
  vat: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_refunded'
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface Payment {
  id: string
  orderId: string
  type: 'cash' | 'card' | 'mada' | 'apple_pay' | 'google_pay' | 'bank_transfer'
  amount: number
  reference?: string
  notes?: string
  processedAt: Date
  processedBy: string
}

export interface Invoice {
  id: string
  orderId: string
  invoiceNumber: string
  uuid: string
  zatcaQrBase64: string
  hash: string
  createdAt: Date
}

export interface StockMove {
  id: string
  itemId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  reference?: string
  performedBy: string
  createdAt: Date
}

export interface PrintJob {
  id: string
  orderId: string
  type: 'receipt' | 'kot' | 'test'
  status: 'pending' | 'printing' | 'completed' | 'failed'
  printerId?: string
  content: string
  createdAt: Date
  completedAt?: Date
}


export interface Settings {
  id: string
  branchId: string
  businessName: string
  businessNameAr: string
  vatRate: number
  serviceChargeRate: number
  currency: string
  timezone: string
  language: 'ar' | 'en' | 'both'
  receiptSettings: {
    headerText: string
    headerTextAr: string
    footerText: string
    footerTextAr: string
    showLogo: boolean
    showQR: boolean
    paperSize: '58mm' | '80mm'
  }
  printerSettings: {
    defaultPrinter?: string
    autoPrint: boolean
    printKOT: boolean
  }
  zatcaSettings: {
    sellerName: string
    sellerNameAr: string
    vatNumber: string
    crNumber: string
    address: string
    addressAr: string
  }
  updatedAt: Date
}

export interface ZATCAQRData {
  sellerName: string
  vatNumber: string
  timestamp: string
  total: number
  vatTotal: number
  uuid: string
}

export interface ReceiptData {
  order: Order
  invoice?: Invoice
  payments: Payment[]
  customer?: Customer
  business: {
    name: string
    nameAr: string
    vatNumber: string
    crNumber: string
    address: string
    addressAr: string
    phone: string
  }
  terminal: {
    name: string
    nameAr: string
  }
  cashier: {
    name: string
  }
}
