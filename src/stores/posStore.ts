import { create } from 'zustand'
import { CartItem, Order, Payment, Customer } from '../types'

interface POSState {
  // Cart
  cart: CartItem[]
  selectedCustomer: Customer | null
  
  // Order modes
  orderMode: 'dine-in' | 'takeaway' | 'delivery'
  tableNumber: string
  
  // Discounts
  orderDiscount: number
  orderDiscountType: 'percentage' | 'fixed'
  serviceCharge: number
  
  // Actions
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  updateCartItemQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  
  setSelectedCustomer: (customer: Customer | null) => void
  setOrderMode: (mode: 'dine-in' | 'takeaway' | 'delivery') => void
  setTableNumber: (tableNumber: string) => void
  setOrderDiscount: (discount: number, type: 'percentage' | 'fixed') => void
  setServiceCharge: (charge: number) => void
  
  // Calculations
  getCartSubtotal: () => number
  getCartVAT: () => number
  getCartTotal: () => number
  getCartItemCount: () => number
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  orderMode: 'dine-in',
  tableNumber: '',
  orderDiscount: 0,
  orderDiscountType: 'percentage',
  serviceCharge: 0,
  
  addToCart: (item) => {
    const { cart } = get()
    const existingItem = cart.find(cartItem => 
      cartItem.id === item.id && 
      JSON.stringify(cartItem.modifiers) === JSON.stringify(item.modifiers)
    )
    
    if (existingItem) {
      set({
        cart: cart.map(cartItem =>
          cartItem.id === item.id && 
          JSON.stringify(cartItem.modifiers) === JSON.stringify(item.modifiers)
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        )
      })
    } else {
      set({ cart: [...cart, item] })
    }
  },
  
  removeFromCart: (itemId) => {
    const { cart } = get()
    set({ cart: cart.filter(item => item.id !== itemId) })
  },
  
  updateCartItemQuantity: (itemId, quantity) => {
    const { cart } = get()
    if (quantity <= 0) {
      set({ cart: cart.filter(item => item.id !== itemId) })
    } else {
      set({
        cart: cart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      })
    }
  },
  
  clearCart: () => {
    set({ 
      cart: [], 
      selectedCustomer: null, 
      orderDiscount: 0, 
      serviceCharge: 0,
      tableNumber: ''
    })
  },
  
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  setOrderMode: (mode) => set({ orderMode: mode }),
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setOrderDiscount: (discount, type) => set({ orderDiscount: discount, orderDiscountType: type }),
  setServiceCharge: (charge) => set({ serviceCharge: charge }),
  
  getCartSubtotal: () => {
    const { cart } = get()
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity
      const modifiersTotal = item.modifiers.reduce((modTotal, modifier) => 
        modTotal + (modifier.price * item.quantity), 0
      )
      return total + itemTotal + modifiersTotal
    }, 0)
  },
  
  getCartVAT: () => {
    const { getCartSubtotal, orderDiscount, orderDiscountType, serviceCharge } = get()
    const subtotal = getCartSubtotal()
    const discountAmount = orderDiscountType === 'percentage' 
      ? (subtotal * orderDiscount) / 100 
      : orderDiscount
    const taxableAmount = subtotal - discountAmount + serviceCharge
    return Math.round(taxableAmount * 0.15 * 100) / 100 // 15% VAT
  },
  
  getCartTotal: () => {
    const { getCartSubtotal, getCartVAT, orderDiscount, orderDiscountType, serviceCharge } = get()
    const subtotal = getCartSubtotal()
    const discountAmount = orderDiscountType === 'percentage' 
      ? (subtotal * orderDiscount) / 100 
      : orderDiscount
    const vat = getCartVAT()
    return subtotal - discountAmount + serviceCharge + vat
  },
  
  getCartItemCount: () => {
    const { cart } = get()
    return cart.reduce((total, item) => total + item.quantity, 0)
  },
}))
