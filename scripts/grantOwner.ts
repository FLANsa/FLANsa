import admin from 'firebase-admin'

admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

async function main() {
  const email = process.argv[2] || 'admin@qayd.com'
  const tenantId = process.argv[3] || 'default-tenant'

  if (!email) {
    console.error('Usage: tsx scripts/grantOwner.ts <email> <tenantId?>')
    process.exit(1)
  }

  const auth = admin.auth()
  const db = admin.firestore()

  // Find user by email in Firebase Auth
  let user = await auth.getUserByEmail(email).catch(() => null)
  if (!user) {
    console.log('User not found. Creating user in Firebase Authentication...')
    const created = await auth.createUser({ email, password: '123456', emailVerified: false, disabled: false })
    user = await auth.getUser(created.uid)
    console.log('✅ Auth user created:', user.uid)
  }

  const uid = user!.uid

  // Upsert Firestore user document with owner role
  await db.doc(`users/${uid}`).set({
    email,
    name: 'مشرف النظام',
    role: 'owner',
    tenantId,
    isActive: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true })

  // Ensure default tenant exists
  await db.doc(`tenants/${tenantId}`).set({
    name: 'Default Store',
    nameAr: 'المتجر الافتراضي',
    isActive: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true })

  console.log('✅ Granted owner role and ensured tenant:', { email, uid, tenantId })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


