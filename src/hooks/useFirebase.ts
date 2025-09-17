import { useState, useEffect } from 'react'
import { authService, AuthUser } from '../lib/authService'
import { 
  userService, 
  customerService, 
  itemService, 
  orderService, 
  settingsService,
  realtimeService,
  User,
  Customer,
  Item,
  Order,
  Settings
} from '../lib/firebaseServices'

// Auth Hook
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const user = await authService.signIn(email, password)
      return user
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    isManager: authService.isManager(),
    isCashier: authService.isCashier()
  }
}

// Items Hook
export const useItems = () => {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToItems((items) => {
      setItems(items)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const addItem = async (itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await itemService.createItem(itemData)
  }

  const updateItem = async (itemId: string, itemData: Partial<Item>) => {
    return await itemService.updateItem(itemId, itemData)
  }

  const deleteItem = async (itemId: string) => {
    return await itemService.deleteItem(itemId)
  }

  const updateStock = async (itemId: string, newStock: number) => {
    return await itemService.updateStock(itemId, newStock)
  }

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    updateStock
  }
}

// Customers Hook
export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToCustomers((customers) => {
      setCustomers(customers)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt' | 'updatedAt'>) => {
    return await customerService.createCustomer(customerData)
  }

  const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
    return await customerService.updateCustomer(customerId, customerData)
  }

  const searchCustomers = async (searchTerm: string) => {
    return await customerService.searchCustomers(searchTerm)
  }

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    searchCustomers
  }
}

// Orders Hook
export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToOrders((orders) => {
      setOrders(orders)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await orderService.createOrder(orderData)
  }

  const updateOrder = async (orderId: string, orderData: Partial<Order>) => {
    return await orderService.updateOrder(orderId, orderData)
  }

  const getOrdersByStatus = async (status: string) => {
    return await orderService.getOrdersByStatus(status)
  }

  const getTodayOrders = async () => {
    return await orderService.getTodayOrders()
  }

  return {
    orders,
    loading,
    addOrder,
    updateOrder,
    getOrdersByStatus,
    getTodayOrders
  }
}

// Settings Hook
export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await settingsService.getSettings()
        setSettings(settingsData)
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateSettings = async (settingsData: Partial<Settings>) => {
    try {
      await settingsService.updateSettings(settingsData)
      // Reload settings
      const updatedSettings = await settingsService.getSettings()
      setSettings(updatedSettings)
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  return {
    settings,
    loading,
    updateSettings
  }
}

// Users Hook
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await userService.getUsers()
        setUsers(usersData)
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await userService.createUser(userData)
  }

  const updateUser = async (userId: string, userData: Partial<User>) => {
    return await userService.updateUser(userId, userData)
  }

  return {
    users,
    loading,
    addUser,
    updateUser
  }
}
