const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to download service account key)
// const serviceAccount = require('./path-to-service-account-key.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// For now, let's use the emulator
admin.initializeApp({
  projectId: 'big-diet-restaurant-pos'
});

async function setUserRoles() {
  try {
    console.log('Setting user roles...');
    
    // Set admin role
    await admin.auth().setCustomUserClaims('JFxyG7C60ySFOnwDitlvmUNSyF', { role: 'admin' });
    console.log('✅ Admin role set for admin@bigdiet.com');
    
    // Set manager role
    await admin.auth().setCustomUserClaims('IzamcdZ0IHeGNHWIMxAFLTqsVMz2', { role: 'manager' });
    console.log('✅ Manager role set for manager@bigdiet.com');
    
    // Set cashier role
    await admin.auth().setCustomUserClaims('0mlMcyasVpbYayQRgCoRlfPUvxv1', { role: 'cashier' });
    console.log('✅ Cashier role set for cashier@bigdiet.com');
    
    console.log('🎉 All user roles set successfully!');
  } catch (error) {
    console.error('❌ Error setting user roles:', error);
  }
}

setUserRoles();
