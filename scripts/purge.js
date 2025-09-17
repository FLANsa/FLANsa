/*
  Firestore purge script: deletes app data collections safely.
  Requirements:
  - Place serviceAccountKey.json at project root (DO NOT COMMIT IT)
  - npm i firebase-admin (if not installed)
  Usage:
  - npm run purge
*/

/* eslint-disable no-console */
const admin = require('firebase-admin')

try {
  const serviceAccount = require('../serviceAccountKey.json')
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
} catch (err) {
  console.error('Missing or invalid serviceAccountKey.json at project root.')
  console.error('Place your Firebase service account JSON as serviceAccountKey.json and rerun.')
  process.exit(1)
}

const db = admin.firestore()

const COLLECTIONS = [
  // core config
  'settings',
  'branches',
  'terminals',
  'users',
  // data
  'categories',
  'items',
  'orders',
  'receipts',
]

async function deleteCollection(collectionName, batchSize = 250) {
  const collectionRef = db.collection(collectionName)
  let deletedTotal = 0

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get()
    if (snapshot.empty) break

    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    deletedTotal += snapshot.size
    console.log(`Deleted ${snapshot.size} from ${collectionName} (total: ${deletedTotal})`)
    // Allow event loop to breathe
    await new Promise((r) => setTimeout(r, 50))
  }

  console.log(`✓ Finished deleting ${collectionName}. Total deleted: ${deletedTotal}`)
}

async function purge() {
  console.log('Starting Firestore purge...')
  for (const col of COLLECTIONS) {
    try {
      await deleteCollection(col)
    } catch (e) {
      console.error(`Error deleting collection ${col}:`, e.message)
    }
  }
  console.log('Firestore purge completed.')
}

purge().then(() => process.exit(0)).catch((e) => {
  console.error('Purge failed:', e)
  process.exit(1)
})


