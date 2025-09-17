import { 
  userService, 
  customerService, 
  itemService, 
  settingsService,
  User,
  Customer,
  Item,
  Settings
} from './firebaseServices'

export const seedData = async () => {
  try {
    console.log('Starting data seeding...')

    // Create default settings
    await settingsService.createDefaultSettings()
    console.log('✅ Default settings created')

    // Create demo users
    const demoUsers: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'أحمد محمد',
        email: 'admin@bigdiet.com',
        role: 'admin',
        isActive: true
      },
      {
        name: 'فاطمة أحمد',
        email: 'manager@bigdiet.com',
        role: 'manager',
        isActive: true
      },
      {
        name: 'محمد علي',
        email: 'cashier@bigdiet.com',
        role: 'cashier',
        isActive: true
      }
    ]

    for (const user of demoUsers) {
      await userService.createUser(user)
    }
    console.log('✅ Demo users created')

    // Create demo customers
    const demoCustomers: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'أحمد السعد',
        phone: '0501234567',
        email: 'ahmed@example.com',
        address: 'الرياض، حي النرجس'
      },
      {
        name: 'فاطمة العتيبي',
        phone: '0507654321',
        email: 'fatima@example.com',
        address: 'الرياض، حي الملز'
      },
      {
        name: 'محمد القحطاني',
        phone: '0509876543',
        email: 'mohammed@example.com',
        address: 'الرياض، حي العليا'
      }
    ]

    for (const customer of demoCustomers) {
      await customerService.createCustomer(customer)
    }
    console.log('✅ Demo customers created')

    // Create demo items
    const demoItems: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // Main dishes
      {
        name: 'شاورما دجاج كبير',
        nameEn: 'Large Chicken Shawarma',
        price: 22.00,
        category: 'main',
        stock: 15,
        minStock: 5,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'شاورما لحم كبير',
        nameEn: 'Large Beef Shawarma',
        price: 25.00,
        category: 'main',
        stock: 8,
        minStock: 3,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'برجر دجاج',
        nameEn: 'Chicken Burger',
        price: 18.00,
        category: 'main',
        stock: 12,
        minStock: 5,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'برجر لحم',
        nameEn: 'Beef Burger',
        price: 20.00,
        category: 'main',
        stock: 3,
        minStock: 5,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'كباب مشوي',
        nameEn: 'Grilled Kebab',
        price: 28.00,
        category: 'main',
        stock: 6,
        minStock: 3,
        unit: 'قطعة',
        isActive: true
      },
      
      // Drinks
      {
        name: '7UP (330ml)',
        nameEn: '7UP (330ml)',
        price: 5.00,
        category: 'drinks',
        stock: 25,
        minStock: 10,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'بيبسي (330ml)',
        nameEn: 'Pepsi (330ml)',
        price: 5.00,
        category: 'drinks',
        stock: 0,
        minStock: 10,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'ماء (500ml)',
        nameEn: 'Water (500ml)',
        price: 2.00,
        category: 'drinks',
        stock: 50,
        minStock: 20,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'عصير برتقال',
        nameEn: 'Orange Juice',
        price: 8.00,
        category: 'drinks',
        stock: 15,
        minStock: 5,
        unit: 'كوب',
        isActive: true
      },
      
      // Sides
      {
        name: 'بطاطس مقلية',
        nameEn: 'French Fries',
        price: 8.00,
        category: 'sides',
        stock: 6,
        minStock: 5,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'سلطة خضراء',
        nameEn: 'Green Salad',
        price: 6.00,
        category: 'sides',
        stock: 2,
        minStock: 5,
        unit: 'طبق',
        isActive: true
      },
      {
        name: 'حمص',
        nameEn: 'Hummus',
        price: 7.00,
        category: 'sides',
        stock: 8,
        minStock: 3,
        unit: 'طبق',
        isActive: true
      },
      
      // Bread
      {
        name: 'خبز عربي',
        nameEn: 'Arabic Bread',
        price: 1.00,
        category: 'bread',
        stock: 100,
        minStock: 20,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'خبز توست',
        nameEn: 'Toast Bread',
        price: 2.00,
        category: 'bread',
        stock: 30,
        minStock: 10,
        unit: 'قطعة',
        isActive: true
      },
      
      // Desserts
      {
        name: 'كنافة',
        nameEn: 'Kunafa',
        price: 12.00,
        category: 'desserts',
        stock: 5,
        minStock: 3,
        unit: 'قطعة',
        isActive: true
      },
      {
        name: 'بسبوسة',
        nameEn: 'Basbousa',
        price: 8.00,
        category: 'desserts',
        stock: 10,
        minStock: 5,
        unit: 'قطعة',
        isActive: true
      }
    ]

    for (const item of demoItems) {
      await itemService.createItem(item)
    }
    console.log('✅ Demo items created')

    console.log('🎉 Data seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}

// Function to check if data already exists
export const checkDataExists = async (): Promise<boolean> => {
  try {
    const users = await userService.getUsers()
    const customers = await customerService.getCustomers()
    const items = await itemService.getItems()
    const settings = await settingsService.getSettings()
    
    return users.length > 0 || customers.length > 0 || items.length > 0 || settings !== null
  } catch (error) {
    console.error('Error checking data existence:', error)
    return false
  }
}
