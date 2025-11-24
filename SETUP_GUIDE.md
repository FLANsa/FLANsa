# 🚀 دليل الإعداد السريع - Firebase

## الخطوات الأساسية

### 1️⃣ تثبيت Firebase CLI
```bash
npm install -g firebase-tools
```

### 2️⃣ تسجيل الدخول
```bash
firebase login
```

### 3️⃣ تحميل Service Account Key
1. افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/settings/serviceaccounts/adminsdk
2. اضغط على **"Generate new private key"**
3. احفظ الملف كـ `serviceAccountKey.json` في مجلد المشروع الرئيسي

### 4️⃣ تشغيل سكريبت الإعداد
```bash
npm run setup:firebase
```

هذا السكريبت سينشر:
- ✅ قواعد Firestore
- ✅ فهارس Firestore  
- ✅ قواعد Storage

### 5️⃣ تفعيل الخدمات في Firebase Console

#### تفعيل Authentication:
1. افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/authentication
2. اضغط **"Get started"**
3. فعّل **"Email/Password"** provider

#### تفعيل Firestore:
1. افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/firestore
2. اضغط **"Create database"**
3. اختر **"Start in production mode"**
4. اختر الموقع (يفضل: `us-central1` أو `asia-south1`)

#### تفعيل Storage (اختياري):
1. افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/storage
2. اضغط **"Get started"**
3. اختر نفس موقع Firestore

### 6️⃣ إنشاء المستخدمين والبيانات الأولية
```bash
npm run setup:users
```

## 📋 معلومات تسجيل الدخول الافتراضية

بعد تشغيل `setup:users`:

| الدور | البريد الإلكتروني | كلمة المرور |
|------|------------------|------------|
| **Admin** | admin@bigdiet.com | admin123456 |
| **Manager** | manager@bigdiet.com | manager123456 |
| **Cashier** | cashier@bigdiet.com | cashier123456 |

⚠️ **مهم:** غيّر كلمات المرور بعد أول تسجيل دخول!

## ✅ التحقق من الإعداد

### التحقق من قواعد Firestore:
```bash
firebase firestore:rules:get
```

### التحقق من المستخدمين:
افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/authentication/users

## 🔧 استكشاف الأخطاء

### خطأ: "Firebase CLI is not installed"
```bash
npm install -g firebase-tools
```

### خطأ: "You are not logged in"
```bash
firebase login
```

### خطأ: "serviceAccountKey.json not found"
- تأكد من تحميل الملف من Firebase Console
- تأكد من وجوده في مجلد المشروع الرئيسي
- تأكد من اسم الملف: `serviceAccountKey.json`

## 📚 المزيد من المعلومات

راجع ملف `FIREBASE_SETUP.md` للحصول على تفاصيل أكثر.

