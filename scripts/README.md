# سكريبتات إعداد Firebase

## الإعداد السريع

### 1. تثبيت Firebase CLI (إذا لم يكن مثبتاً)
```bash
npm install -g firebase-tools
```

### 2. تسجيل الدخول
```bash
firebase login
```

### 3. تحميل Service Account Key
- افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/settings/serviceaccounts/adminsdk
- اضغط "Generate new private key"
- احفظ الملف كـ `serviceAccountKey.json` في مجلد المشروع

### 4. تشغيل سكريبت الإعداد
```bash
npm run setup:firebase
```

### 5. تفعيل الخدمات في Firebase Console
- Authentication: https://console.firebase.google.com/project/big-diet-restaurant-pos/authentication
- Firestore: https://console.firebase.google.com/project/big-diet-restaurant-pos/firestore
- Storage: https://console.firebase.google.com/project/big-diet-restaurant-pos/storage

### 6. إنشاء المستخدمين
```bash
npm run setup:users
```

## الملفات

- `setup-firebase.sh`: ينشر قواعد Firestore و Storage والفهارس
- `setup-users.js`: ينشئ المستخدمين والبيانات الأولية

## معلومات تسجيل الدخول الافتراضية

بعد تشغيل `setup-users.js`:
- **Admin:** admin@bigdiet.com / admin123456
- **Manager:** manager@bigdiet.com / manager123456
- **Cashier:** cashier@bigdiet.com / cashier123456

⚠️ **غيّر كلمات المرور فوراً!**

