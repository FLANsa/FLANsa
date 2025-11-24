# دليل إعداد Firebase

هذا الدليل يوضح كيفية إعداد Firebase للمشروع باستخدام Firebase CLI.

## المتطلبات الأساسية

1. **تثبيت Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **تسجيل الدخول إلى Firebase:**
   ```bash
   firebase login
   ```

3. **تحميل Service Account Key:**
   - افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/settings/serviceaccounts/adminsdk
   - اضغط على "Generate new private key"
   - احفظ الملف كـ `serviceAccountKey.json` في مجلد المشروع الرئيسي

## خطوات الإعداد

### الخطوة 1: إعداد Firebase (نشر القواعد والفهارس)

قم بتشغيل السكريبت التالي:

```bash
npm run setup:firebase
```

أو يدوياً:

```bash
bash scripts/setup-firebase.sh
```

هذا السكريبت سيقوم بـ:
- ✅ التحقق من تثبيت Firebase CLI
- ✅ التحقق من تسجيل الدخول
- ✅ نشر قواعد Firestore
- ✅ نشر فهارس Firestore
- ✅ نشر قواعد Storage

### الخطوة 2: تفعيل الخدمات في Firebase Console

بعد تشغيل السكريبت، يجب تفعيل الخدمات التالية يدوياً:

1. **تفعيل Authentication:**
   - افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/authentication
   - اضغط على "Get started"
   - فعّل "Email/Password" provider

2. **تفعيل Firestore Database:**
   - افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/firestore
   - اضغط على "Create database"
   - اختر "Start in production mode" (القواعد ستُطبق تلقائياً)
   - اختر موقع قاعدة البيانات (يفضل: `us-central1` أو `asia-south1`)

3. **تفعيل Storage (اختياري):**
   - افتح: https://console.firebase.google.com/project/big-diet-restaurant-pos/storage
   - اضغط على "Get started"
   - اختر نفس موقع Firestore

### الخطوة 3: إنشاء المستخدمين والبيانات الأولية

بعد تفعيل الخدمات، قم بإنشاء المستخدمين والبيانات الأولية:

```bash
npm run setup:users
```

هذا السكريبت سيقوم بـ:
- ✅ إنشاء tenant رئيسي (Big Diet Restaurant)
- ✅ إنشاء مستخدم admin
- ✅ إنشاء مستخدم manager
- ✅ إنشاء مستخدم cashier
- ✅ إنشاء الإعدادات الافتراضية

**معلومات تسجيل الدخول الافتراضية:**
- **Admin:** `admin@bigdiet.com` / `admin123456`
- **Manager:** `manager@bigdiet.com` / `manager123456`
- **Cashier:** `cashier@bigdiet.com` / `cashier123456`

⚠️ **مهم:** غيّر كلمات المرور بعد أول تسجيل دخول!

## التحقق من الإعداد

### 1. التحقق من قواعد Firestore

```bash
firebase firestore:rules:get
```

### 2. التحقق من الفهارس

```bash
firebase firestore:indexes
```

### 3. التحقق من المستخدمين

افتح Firebase Console:
https://console.firebase.google.com/project/big-diet-restaurant-pos/authentication/users

## استكشاف الأخطاء

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
- تأكد من اسم الملف: `serviceAccountKey.json` (حساس لحالة الأحرف)

### خطأ: "Permission denied"
- تأكد من أن Service Account Key صحيح
- تأكد من تفعيل Authentication و Firestore في Firebase Console

## الأوامر المفيدة

```bash
# عرض معلومات المشروع
firebase projects:list

# نشر جميع القواعد والفهارس
firebase deploy

# نشر قواعد Firestore فقط
firebase deploy --only firestore:rules

# نشر فهارس Firestore فقط
firebase deploy --only firestore:indexes

# نشر قواعد Storage فقط
firebase deploy --only storage

# تشغيل Emulators محلياً
npm run emulators
```

## البنية المقترحة للمشروع

```
big-diet-pos-system/
├── firebase.json          # إعدادات Firebase
├── .firebaserc          # معرف المشروع
├── firestore.rules        # قواعد Firestore
├── firestore.indexes.json # فهارس Firestore
├── storage.rules          # قواعد Storage
├── serviceAccountKey.json # Service Account Key (لا ترفعه إلى Git!)
└── scripts/
    ├── setup-firebase.sh  # سكريبت إعداد Firebase
    └── setup-users.js     # سكريبت إنشاء المستخدمين
```

## ملاحظات أمنية

⚠️ **مهم جداً:**
- لا ترفع `serviceAccountKey.json` إلى Git
- أضفه إلى `.gitignore`
- استخدم متغيرات البيئة للإنتاج
- غيّر كلمات المرور الافتراضية فوراً

## الدعم

إذا واجهت أي مشاكل، راجع:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

