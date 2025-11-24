const admin = require('firebase-admin')
const readline = require('readline')

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

// Check if serviceAccountKey.json exists
const fs = require('fs')
const path = require('path')

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json')

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found!')
  console.error('Please download it from Firebase Console:')
  console.error('  1. Go to: https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/serviceaccounts/adminsdk')
  console.error('  2. Click "Generate new private key"')
  console.error('  3. Save it as serviceAccountKey.json in the project root')
  process.exit(1)
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
const auth = admin.auth()

async function createUser(email, password, displayName, customClaims = {}) {
  try {
    // Create user in Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    })

    // Set custom claims
    if (Object.keys(customClaims).length > 0) {
      await auth.setCustomUserClaims(userRecord.uid, customClaims)
    }

    console.log(`✓ Created user: ${email} (UID: ${userRecord.uid})`)
    return userRecord.uid
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  User ${email} already exists, updating...`)
      const user = await auth.getUserByEmail(email)
      
      // Update password if provided
      if (password) {
        await auth.updateUser(user.uid, { password: password })
      }
      
      // Update custom claims
      if (Object.keys(customClaims).length > 0) {
        await auth.setCustomUserClaims(user.uid, customClaims)
      }
      
      return user.uid
    }
    throw error
  }
}

async function createTenant(tenantData) {
  try {
    const tenantRef = db.collection('tenants').doc()
    const tenantId = tenantRef.id
    
    await tenantRef.set({
      ...tenantData,
      id: tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    console.log(`✓ Created tenant: ${tenantData.name} (ID: ${tenantId})`)
    return tenantId
  } catch (error) {
    console.error(`❌ Error creating tenant: ${error.message}`)
    throw error
  }
}

async function createUserDocument(uid, userData) {
  try {
    await db.collection('users').doc(uid).set({
      ...userData,
      id: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    console.log(`✓ Created user document for: ${userData.email}`)
  } catch (error) {
    console.error(`❌ Error creating user document: ${error.message}`)
    throw error
  }
}

async function createDefaultSettings(tenantId, tenantData) {
  try {
    await db.collection('settings').doc(tenantId).set({
      restaurantName: tenantData.name,
      restaurantNameAr: tenantData.nameAr,
      address: tenantData.address,
      addressAr: tenantData.addressAr,
      phone: tenantData.phone,
      email: tenantData.email,
      vatNumber: tenantData.vatNumber,
      crNumber: tenantData.crNumber,
      vatRate: 15,
      serviceChargeRate: 0,
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      language: 'both',
      receiptSettings: {
        headerText: `Welcome to ${tenantData.name}`,
        headerTextAr: `مرحباً بكم في ${tenantData.nameAr}`,
        footerText: 'Thank you for your visit',
        footerTextAr: 'شكراً لزيارتكم',
        showLogo: true,
        showQR: false,
        paperSize: '58mm'
      },
      zatca: {
        sellerName: tenantData.name,
        sellerNameAr: tenantData.nameAr,
        orgVatNumber: tenantData.vatNumber,
        orgCrNumber: tenantData.crNumber,
        address: tenantData.address,
        addressAr: tenantData.addressAr
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    console.log(`✓ Created default settings for tenant: ${tenantId}`)
  } catch (error) {
    console.error(`❌ Error creating settings: ${error.message}`)
    throw error
  }
}

async function setupInitialData() {
  try {
    console.log('\n🚀 Starting initial data setup...\n')

    // Create main tenant
    const mainTenant = {
      name: 'Big Diet Restaurant',
      nameAr: 'مطعم بيج دايت',
      email: 'info@bigdiet.com',
      phone: '+966 11 123 4567',
      address: 'Riyadh, Saudi Arabia',
      addressAr: 'الرياض، المملكة العربية السعودية',
      vatNumber: '123456789012345',
      crNumber: '1010101010',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    }

    const tenantId = await createTenant(mainTenant)
    await createDefaultSettings(tenantId, mainTenant)

    // Create admin user
    const adminEmail = 'admin@bigdiet.com'
    const adminPassword = 'admin123456'
    
    console.log('\n📧 Creating admin user...')
    const adminUid = await createUser(
      adminEmail,
      adminPassword,
      'مدير النظام',
      {
        role: 'owner',
        tenantId: tenantId
      }
    )

    await createUserDocument(adminUid, {
      tenantId: tenantId,
      email: adminEmail,
      name: 'مدير النظام',
      role: 'admin',
      isActive: true
    })

    // Create manager user
    const managerEmail = 'manager@bigdiet.com'
    const managerPassword = 'manager123456'
    
    console.log('\n📧 Creating manager user...')
    const managerUid = await createUser(
      managerEmail,
      managerPassword,
      'مدير المطعم',
      {
        role: 'manager',
        tenantId: tenantId
      }
    )

    await createUserDocument(managerUid, {
      tenantId: tenantId,
      email: managerEmail,
      name: 'مدير المطعم',
      role: 'manager',
      isActive: true
    })

    // Create cashier user
    const cashierEmail = 'cashier@bigdiet.com'
    const cashierPassword = 'cashier123456'
    
    console.log('\n📧 Creating cashier user...')
    const cashierUid = await createUser(
      cashierEmail,
      cashierPassword,
      'كاشير',
      {
        role: 'cashier',
        tenantId: tenantId
      }
    )

    await createUserDocument(cashierUid, {
      tenantId: tenantId,
      email: cashierEmail,
      name: 'كاشير',
      role: 'cashier',
      isActive: true
    })

    console.log('\n✅ Initial data setup completed!\n')
    console.log('📋 Login Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Admin:   ${adminEmail} / ${adminPassword}`)
    console.log(`Manager: ${managerEmail} / ${managerPassword}`)
    console.log(`Cashier: ${cashierEmail} / ${cashierPassword}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Error setting up initial data:', error)
    process.exit(1)
  }
}

// Run the setup
setupInitialData()
  .then(() => {
    rl.close()
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    rl.close()
    process.exit(1)
  })

