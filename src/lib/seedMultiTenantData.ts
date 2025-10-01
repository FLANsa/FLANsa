import { tenantService, userService, itemService, settingsService } from './firebaseServices'
import { Tenant, User, Item } from './firebaseServices'

export const createDemoMultiTenantData = async () => {
  try {
    console.log('Creating demo multi-tenant data...')

    // Create demo tenants
    const tenants = [
      {
        name: 'Al-Rashid Restaurant',
        nameAr: 'مطعم الرشيد',
        email: 'info@alrashid.com',
        phone: '+966 11 123 4567',
        address: 'King Fahd Road, Riyadh',
        addressAr: 'طريق الملك فهد، الرياض',
        vatNumber: '123456789012345',
        crNumber: '1010101010',
        subscriptionPlan: 'premium' as const,
        subscriptionStatus: 'active' as const,
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        name: 'Cafe Delight',
        nameAr: 'مقهى ديلايت',
        email: 'info@cafedelight.com',
        phone: '+966 11 234 5678',
        address: 'Tahlia Street, Riyadh',
        addressAr: 'شارع التحلية، الرياض',
        vatNumber: '234567890123456',
        crNumber: '2020202020',
        subscriptionPlan: 'basic' as const,
        subscriptionStatus: 'active' as const,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        name: 'Quick Mart',
        nameAr: 'سوق سريع',
        email: 'info@quickmart.com',
        phone: '+966 11 345 6789',
        address: 'Olaya District, Riyadh',
        addressAr: 'حي العليا، الرياض',
        vatNumber: '345678901234567',
        crNumber: '3030303030',
        subscriptionPlan: 'enterprise' as const,
        subscriptionStatus: 'active' as const,
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    ]

    const createdTenants = []
    for (const tenantData of tenants) {
      const tenantId = await tenantService.createTenant(tenantData)
      createdTenants.push({ id: tenantId, ...tenantData })
    }

    // Create users for each tenant
    const users = [
      // Al-Rashid Restaurant users
      {
        tenantId: createdTenants[0].id,
        name: 'أحمد الرشيد',
        email: 'admin@alrashid.com',
        role: 'admin' as const,
        isActive: true
      },
      {
        tenantId: createdTenants[0].id,
        name: 'فاطمة أحمد',
        email: 'manager@alrashid.com',
        role: 'manager' as const,
        isActive: true
      },
      {
        tenantId: createdTenants[0].id,
        name: 'محمد علي',
        email: 'cashier@alrashid.com',
        role: 'cashier' as const,
        isActive: true
      },
      // Cafe Delight users
      {
        tenantId: createdTenants[1].id,
        name: 'سارة محمد',
        email: 'admin@cafedelight.com',
        role: 'admin' as const,
        isActive: true
      },
      {
        tenantId: createdTenants[1].id,
        name: 'خالد عبدالله',
        email: 'cashier@cafedelight.com',
        role: 'cashier' as const,
        isActive: true
      },
      // Quick Mart users
      {
        tenantId: createdTenants[2].id,
        name: 'عبدالرحمن السعد',
        email: 'admin@quickmart.com',
        role: 'admin' as const,
        isActive: true
      },
      {
        tenantId: createdTenants[2].id,
        name: 'نورا القحطاني',
        email: 'manager@quickmart.com',
        role: 'manager' as const,
        isActive: true
      },
      {
        tenantId: createdTenants[2].id,
        name: 'عبدالله المطيري',
        email: 'cashier@quickmart.com',
        role: 'cashier' as const,
        isActive: true
      }
    ]

    for (const userData of users) {
      await userService.createUser(userData)
    }

    // Create sample items for each tenant
    const restaurantItems = [
      {
        tenantId: createdTenants[0].id,
        name: 'Grilled Chicken',
        nameAr: 'دجاج مشوي',
        price: 45,
        category: 'Main Dishes',
        stock: 50,
        minStock: 10,
        unit: 'piece',
        isActive: true
      },
      {
        tenantId: createdTenants[0].id,
        name: 'Lamb Kabsa',
        nameAr: 'كبسة لحم',
        price: 65,
        category: 'Main Dishes',
        stock: 30,
        minStock: 5,
        unit: 'plate',
        isActive: true
      },
      {
        tenantId: createdTenants[0].id,
        name: 'Fresh Juice',
        nameAr: 'عصير طازج',
        price: 15,
        category: 'Beverages',
        stock: 100,
        minStock: 20,
        unit: 'cup',
        isActive: true
      }
    ]

    const cafeItems = [
      {
        tenantId: createdTenants[1].id,
        name: 'Cappuccino',
        nameAr: 'كابتشينو',
        price: 18,
        category: 'Coffee',
        stock: 200,
        minStock: 50,
        unit: 'cup',
        isActive: true
      },
      {
        tenantId: createdTenants[1].id,
        name: 'Croissant',
        nameAr: 'كرواسون',
        price: 12,
        category: 'Pastries',
        stock: 80,
        minStock: 20,
        unit: 'piece',
        isActive: true
      },
      {
        tenantId: createdTenants[1].id,
        name: 'Green Tea',
        nameAr: 'شاي أخضر',
        price: 8,
        category: 'Tea',
        stock: 150,
        minStock: 30,
        unit: 'cup',
        isActive: true
      }
    ]

    const martItems = [
      {
        tenantId: createdTenants[2].id,
        name: 'Bread',
        nameAr: 'خبز',
        price: 3,
        category: 'Bakery',
        stock: 500,
        minStock: 100,
        unit: 'loaf',
        isActive: true
      },
      {
        tenantId: createdTenants[2].id,
        name: 'Milk',
        nameAr: 'حليب',
        price: 8,
        category: 'Dairy',
        stock: 200,
        minStock: 50,
        unit: 'liter',
        isActive: true
      },
      {
        tenantId: createdTenants[2].id,
        name: 'Rice',
        nameAr: 'أرز',
        price: 25,
        category: 'Grains',
        stock: 100,
        minStock: 20,
        unit: 'kg',
        isActive: true
      }
    ]

    const allItems = [...restaurantItems, ...cafeItems, ...martItems]
    for (const itemData of allItems) {
      await itemService.createItem(itemData)
    }

    // Create settings for each tenant
    for (const tenant of createdTenants) {
      await settingsService.createDefaultSettingsForTenant(tenant.id, tenant)
    }

    console.log('Demo multi-tenant data created successfully!')
    console.log('Created tenants:', createdTenants.length)
    console.log('Created users:', users.length)
    console.log('Created items:', allItems.length)

    return {
      tenants: createdTenants,
      users,
      items: allItems
    }

  } catch (error) {
    console.error('Error creating demo multi-tenant data:', error)
    throw error
  }
}

// Demo login credentials
export const DEMO_CREDENTIALS = {
  'alrashid': {
    admin: { email: 'admin@alrashid.com', password: '123456' },
    manager: { email: 'manager@alrashid.com', password: '123456' },
    cashier: { email: 'cashier@alrashid.com', password: '123456' }
  },
  'cafedelight': {
    admin: { email: 'admin@cafedelight.com', password: '123456' },
    cashier: { email: 'cashier@cafedelight.com', password: '123456' }
  },
  'quickmart': {
    admin: { email: 'admin@quickmart.com', password: '123456' },
    manager: { email: 'manager@quickmart.com', password: '123456' },
    cashier: { email: 'cashier@quickmart.com', password: '123456' }
  }
}
