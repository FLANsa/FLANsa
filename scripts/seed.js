const admin = require('firebase-admin')

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

// Seed data
const seedData = {
  // Business settings
  settings: {
    id: 'main',
    branchId: 'main-branch',
    businessName: 'Qayd POS System',
    businessNameAr: 'قيد - نظام الكاشير',
    vatRate: 15,
    serviceChargeRate: 0,
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    language: 'both',
    receiptSettings: {
      headerText: 'Welcome to Qayd POS System',
      headerTextAr: 'مرحباً بكم في قيد - نظام الكاشير',
      footerText: 'Thank you for your visit',
      footerTextAr: 'شكراً لزيارتكم',
      showLogo: true,
      showQR: true,
      paperSize: '58mm'
    },
    printerSettings: {
      defaultPrinter: 'thermal-58',
      autoPrint: false,
      printKOT: true
    },
    zatcaSettings: {
      sellerName: 'Qayd POS System',
      sellerNameAr: 'قيد - نظام الكاشير',
      vatNumber: '123456789012345',
      crNumber: '1010101010',
      address: 'Riyadh, Saudi Arabia',
      addressAr: 'الرياض، المملكة العربية السعودية'
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },

  // Main branch
  branch: {
    id: 'main-branch',
    name: 'Main Branch',
    nameAr: 'الفرع الرئيسي',
    address: 'Riyadh, Saudi Arabia',
    addressAr: 'الرياض، المملكة العربية السعودية',
    phone: '+966 11 123 4567',
    email: 'info@bigdiet.com',
    vatNumber: '123456789012345',
    crNumber: '1010101010',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },

  // Terminal
  terminal: {
    id: 'terminal-01',
    branchId: 'main-branch',
    name: 'Terminal 01',
    nameAr: 'المحطة 01',
    pin: '1234',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },

  // Admin user
  adminUser: {
    uid: 'admin-user-id',
    email: 'admin@bigdiet.com',
    name: 'مدير النظام',
    role: 'admin',
    branchId: 'main-branch',
    terminalId: 'terminal-01',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },

  // Categories
  categories: [
    {
      id: 'cat-1',
      name: 'Main Dishes',
      nameAr: 'الأطباق الرئيسية',
      description: 'Main course dishes',
      descriptionAr: 'الأطباق الرئيسية',
      sortOrder: 1,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'cat-2',
      name: 'Beverages',
      nameAr: 'المشروبات',
      description: 'Drinks and beverages',
      descriptionAr: 'المشروبات والعصائر',
      sortOrder: 2,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'cat-3',
      name: 'Desserts',
      nameAr: 'الحلويات',
      description: 'Sweet treats',
      descriptionAr: 'الحلويات والتحليات',
      sortOrder: 3,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ],

  // Items
  items: [
    {
      id: 'item-1',
      categoryId: 'cat-1',
      name: 'Chicken Shawarma',
      nameAr: 'شاورما دجاج',
      description: 'Tender chicken with fresh vegetables',
      descriptionAr: 'دجاج طري مع الخضار الطازجة',
      price: 22.00,
      sku: 'SHW-CHK-001',
      stockQuantity: 100,
      lowStockThreshold: 10,
      modifierGroups: [],
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'item-2',
      categoryId: 'cat-1',
      name: 'Beef Shawarma',
      nameAr: 'شاورما لحم',
      description: 'Tender beef with fresh vegetables',
      descriptionAr: 'لحم طري مع الخضار الطازجة',
      price: 25.00,
      sku: 'SHW-BEEF-001',
      stockQuantity: 80,
      lowStockThreshold: 10,
      modifierGroups: [],
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'item-3',
      categoryId: 'cat-1',
      name: 'Mixed Grill',
      nameAr: 'مشاوي مشكلة',
      description: 'Mixed grilled meats',
      descriptionAr: 'مشاوي مختلطة من اللحوم',
      price: 35.00,
      sku: 'GRILL-MIX-001',
      stockQuantity: 50,
      lowStockThreshold: 5,
      modifierGroups: [],
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'item-4',
      categoryId: 'cat-2',
      name: 'Fresh Orange Juice',
      nameAr: 'عصير برتقال طازج',
      description: 'Freshly squeezed orange juice',
      descriptionAr: 'عصير برتقال طازج معصور',
      price: 8.00,
      sku: 'JUICE-ORG-001',
      stockQuantity: 200,
      lowStockThreshold: 20,
      modifierGroups: [],
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'item-5',
      categoryId: 'cat-2',
      name: 'Arabic Coffee',
      nameAr: 'قهوة عربية',
      description: 'Traditional Arabic coffee',
      descriptionAr: 'قهوة عربية تقليدية',
      price: 5.00,
      sku: 'COFFEE-AR-001',
      stockQuantity: 150,
      lowStockThreshold: 15,
      modifierGroups: [],
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'item-6',
      categoryId: 'cat-2',
      name: '7UP',
      nameAr: 'سفن أب',
      description: 'Refreshing lemon-lime soda',
      descriptionAr: 'مشروب غازي منعش',
      price: 5.00,
      sku: 'SODA-7UP-001',
      stockQuantity: 300,
      lowStockThreshold: 30,
      modifierGroups: [],
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'item-7',
      categoryId: 'cat-3',
      name: 'Baklava',
      nameAr: 'بقلاوة',
      description: 'Traditional Middle Eastern pastry',
      descriptionAr: 'حلويات شرقية تقليدية',
      price: 12.00,
      sku: 'DESS-BAK-001',
      stockQuantity: 60,
      lowStockThreshold: 10,
      modifierGroups: [],
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'item-8',
      categoryId: 'cat-3',
      name: 'Kunafa',
      nameAr: 'كنافة',
      description: 'Sweet cheese pastry',
      descriptionAr: 'حلويات بالجبن',
      price: 15.00,
      sku: 'DESS-KUN-001',
      stockQuantity: 40,
      lowStockThreshold: 5,
      modifierGroups: [],
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ]
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...')

    // Seed settings
    await db.collection('settings').doc('main').set(seedData.settings)
    console.log('✓ Settings seeded')

    // Seed branch
    await db.collection('branches').doc('main-branch').set(seedData.branch)
    console.log('✓ Branch seeded')

    // Seed terminal
    await db.collection('terminals').doc('terminal-01').set(seedData.terminal)
    console.log('✓ Terminal seeded')

    // Seed admin user
    await db.collection('users').doc('admin-user-id').set(seedData.adminUser)
    console.log('✓ Admin user seeded')

    // Seed categories
    for (const category of seedData.categories) {
      await db.collection('categories').doc(category.id).set(category)
    }
    console.log('✓ Categories seeded')

    // Seed items
    for (const item of seedData.items) {
      await db.collection('items').doc(item.id).set(item)
    }
    console.log('✓ Items seeded')

    console.log('Database seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}

// Run the seeding
seedDatabase()
