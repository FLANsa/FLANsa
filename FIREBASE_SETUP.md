# 🔥 إعداد Firebase - Big Diet POS

## 📋 المتطلبات

1. **حساب Google** مع إمكانية الوصول إلى Firebase
2. **Node.js** (الإصدار 16 أو أحدث)
3. **npm** أو **yarn**

## 🚀 خطوات الإعداد

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "إنشاء مشروع جديد" (Create a new project)
3. أدخل اسم المشروع: `big-diet-pos`
4. اختر "تمكين Google Analytics" (اختياري)
5. انقر "إنشاء المشروع"

### 2. إضافة تطبيق ويب

1. في لوحة تحكم المشروع، انقر على أيقونة الويب `</>`
2. أدخل اسم التطبيق: `Big Diet POS`
3. انقر "تسجيل التطبيق"
4. انسخ إعدادات Firebase (سيتم استخدامها لاحقاً)

### 3. تفعيل الخدمات المطلوبة

#### Authentication
1. في القائمة الجانبية، انقر "Authentication"
2. انقر "البدء" (Get started)
3. انتقل إلى تبويب "Sign-in method"
4. فعّل "البريد الإلكتروني/كلمة المرور" (Email/Password)

#### Firestore Database
1. في القائمة الجانبية، انقر "Firestore Database"
2. انقر "إنشاء قاعدة بيانات"
3. اختر "بدء في وضع الاختبار" (Start in test mode)
4. اختر موقع قاعدة البيانات (الأقرب لمنطقتك)

#### Storage (اختياري)
1. في القائمة الجانبية، انقر "Storage"
2. انقر "البدء"
3. اختر "بدء في وضع الاختبار"

### 4. إعداد متغيرات البيئة

1. انسخ ملف `.env.example` إلى `.env.local`:
```bash
cp env.example .env.local
```

2. افتح `.env.local` وأدخل إعدادات Firebase الخاصة بك:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Business Configuration
VITE_BUSINESS_NAME=Big Diet Restaurant
VITE_BUSINESS_NAME_AR=مطعم Big Diet
VITE_VAT_NUMBER=123456789012345
VITE_CR_NUMBER=1010101010
VITE_BUSINESS_ADDRESS=Riyadh, Saudi Arabia
VITE_BUSINESS_ADDRESS_AR=الرياض، المملكة العربية السعودية
VITE_BUSINESS_PHONE=+966 11 123 4567
VITE_BUSINESS_EMAIL=info@bigdiet.com

# ZATCA Configuration
VITE_ZATCA_SELLER_NAME=Big Diet Restaurant
VITE_ZATCA_SELLER_NAME_AR=مطعم Big Diet
VITE_ZATCA_VAT_NUMBER=123456789012345
VITE_ZATCA_CR_NUMBER=1010101010

# App Configuration
VITE_APP_NAME=Big Diet POS
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_CURRENCY=SAR
VITE_DEFAULT_LANGUAGE=ar
VITE_VAT_RATE=15
VITE_SERVICE_CHARGE_RATE=0
```

### 5. تشغيل النظام

```bash
# تثبيت التبعيات
npm install

# تشغيل النظام في وضع التطوير
npm run dev
```

## 👥 المستخدمين التجريبيين

سيتم إنشاء المستخدمين التاليين تلقائياً:

| البريد الإلكتروني | كلمة المرور | الدور |
|------------------|------------|-------|
| admin@bigdiet.com | password123 | مدير |
| manager@bigdiet.com | password123 | مدير فرع |
| cashier@bigdiet.com | password123 | كاشير |

## 📊 البيانات التجريبية

سيتم إنشاء البيانات التالية تلقائياً:

- **16 صنف** في قائمة الطعام
- **3 عملاء** تجريبيين
- **إعدادات المطعم** الافتراضية

## 🔧 إعدادات Firebase المتقدمة

### قواعد الأمان (Security Rules)

تم إعداد قواعد أمان متقدمة في الملفات:
- `firestore.rules` - قواعد Firestore
- `storage.rules` - قواعد Storage

### الفهرسة (Indexes)

تم إعداد الفهارس المطلوبة في `firestore.indexes.json`

## 🚀 النشر (Deployment)

### 1. تثبيت Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. تسجيل الدخول

```bash
firebase login
```

### 3. تهيئة المشروع

```bash
firebase init
```

اختر:
- ✅ Hosting
- ✅ Firestore
- ✅ Functions (اختياري)
- ✅ Storage (اختياري)

### 4. بناء المشروع

```bash
npm run build
```

### 5. النشر

```bash
firebase deploy
```

## 🔍 استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال بـ Firebase**
   - تأكد من صحة إعدادات `.env.local`
   - تحقق من اتصال الإنترنت

2. **خطأ في المصادقة**
   - تأكد من تفعيل Email/Password في Firebase Console
   - تحقق من صحة بيانات المستخدم

3. **خطأ في قاعدة البيانات**
   - تأكد من إنشاء Firestore Database
   - تحقق من قواعد الأمان

### سجلات التطوير:

افتح Developer Tools (F12) وانتقل إلى Console لرؤية السجلات

## 📞 الدعم

إذا واجهت أي مشاكل:

1. تحقق من [Firebase Documentation](https://firebase.google.com/docs)
2. راجع ملفات السجل في Console
3. تأكد من صحة جميع الإعدادات

## 🎉 تهانينا!

بعد إكمال هذه الخطوات، سيكون لديك نظام POS متكامل مع Firebase يعمل بشكل مثالي!

---

**ملاحظة**: تأكد من تحديث قواعد الأمان في الإنتاج لضمان أمان البيانات.
