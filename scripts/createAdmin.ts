import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore'
import { firebaseConfig } from '../src/lib/firebaseConfig'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...')
    
    // Get first tenant ID
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'))
    let tenantId = 'default-tenant'
    
    if (tenantsSnapshot.docs.length > 0) {
      tenantId = tenantsSnapshot.docs[0].id
      console.log('✅ Found tenant:', tenantId)
    } else {
      console.log('⚠️  No tenants found. Creating default tenant...')
      const tenantRef = doc(collection(db, 'tenants'))
      await setDoc(tenantRef, {
        name: 'Default Store',
        nameAr: 'المتجر الافتراضي',
        vatNumber: '300000000000003',
        crNumber: '1010101010',
        phone: '+966 11 123 4567',
        address: 'Riyadh, Saudi Arabia',
        addressAr: 'الرياض، المملكة العربية السعودية',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      tenantId = tenantRef.id
      console.log('✅ Created default tenant:', tenantId)
    }

    // Admin credentials
    const adminEmail = 'admin@qayd.com'
    const adminPassword = 'admin123456'

    // Create Firebase Auth user (idempotent-ish: will throw if exists)
    console.log('Creating Firebase Auth user...')
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
    const uid = userCredential.user.uid

    console.log('✅ Firebase Auth user created:', uid)

    // Set display name
    try { await updateProfile(userCredential.user, { displayName: 'مشرف النظام' }) } catch {}

    // Create Firestore user document
    console.log('Creating Firestore user document...')
    await setDoc(doc(db, 'users', uid), {
      email: adminEmail,
      name: 'مشرف النظام',
      role: 'owner',
      tenantId: tenantId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    })

    console.log('✅ Firestore user document created')

    console.log('\n' + '='.repeat(50))
    console.log('✅ Admin user created successfully!')
    console.log('='.repeat(50))
    console.log('\n📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('🏢 Tenant ID:', tenantId)
    console.log('👑 Role: owner (full admin)')
    console.log('\n🚀 You can now login at: http://localhost:3000/login')
    console.log('='.repeat(50) + '\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  }
}

createAdminUser()
