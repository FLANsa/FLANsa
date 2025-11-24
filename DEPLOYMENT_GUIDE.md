# 🚀 دليل النشر على Firebase Hosting

هذا الدليل يوضح كيفية نشر مشروع Big Diet Restaurant POS على Firebase Hosting مع إمكانية إدارة المستخدمين عبر الويب.

## المتطلبات الأساسية

1. **تثبيت Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **تسجيل الدخول:**
   ```bash
   firebase login
   ```

3. **إعداد المشروع:**
   - تأكد من وجود ملف `.firebaserc` مع معرف المشروع الصحيح
   - تأكد من تفعيل Authentication و Firestore في Firebase Console

## خطوات النشر

### الطريقة السريعة (سكريبت تلقائي)

```bash
npm run deploy:all
```

أو يدوياً:

```bash
bash scripts/deploy.sh
```

### الطريقة اليدوية (خطوة بخطوة)

#### 1. بناء المشروع
```bash
npm run build
```

#### 2. بناء Firebase Functions
```bash
cd functions
npm install
npm run build
cd ..
```

#### 3. نشر Firestore Rules و Indexes
```bash
firebase deploy --only firestore
```

#### 4. نشر Storage Rules
```bash
firebase deploy --only storage
```

#### 5. نشر Firebase Functions
```bash
firebase deploy --only functions
```

#### 6. نشر Hosting
```bash
firebase deploy --only hosting
```

#### 7. نشر كل شيء مرة واحدة
```bash
firebase deploy
```

## إدارة المستخدمين عبر الويب

بعد النشر، يمكنك إدارة المستخدمين عبر لوحة التحكم:

### الوصول إلى لوحة التحكم

1. افتح: `https://YOUR_PROJECT_ID.web.app/admin`
2. سجّل الدخول بحساب admin (role: owner)

### إضافة مستخدم جديد

1. في لوحة التحكم، اختر تبويب **"المستخدمون"**
2. اختر المتجر (Tenant)
3. أدخل:
   - البريد الإلكتروني
   - الاسم
   - الدور (owner, admin, manager, cashier)
4. اضغط **"إضافة مستخدم"**

### إدارة المتاجر (Tenants)

1. اختر تبويب **"المتاجر"**
2. أدخل بيانات المتجر:
   - الاسم (عربي وإنجليزي)
   - البريد الإلكتروني
   - رقم الهاتف
   - العنوان
   - الرقم الضريبي
   - رقم السجل التجاري
3. اضغط **"إضافة المتجر"**

## معلومات تسجيل الدخول الافتراضية

بعد تشغيل `npm run setup:users`:

| الدور | البريد الإلكتروني | كلمة المرور |
|------|------------------|------------|
| **Owner/Admin** | admin@bigdiet.com | admin123456 |
| **Manager** | manager@bigdiet.com | manager123456 |
| **Cashier** | cashier@bigdiet.com | cashier123456 |

⚠️ **مهم:** غيّر كلمات المرور بعد أول تسجيل دخول!

## الروابط المهمة

بعد النشر:

- **التطبيق الرئيسي:** `https://YOUR_PROJECT_ID.web.app`
- **لوحة التحكم:** `https://YOUR_PROJECT_ID.web.app/admin`
- **نقطة البيع:** `https://YOUR_PROJECT_ID.web.app/pos`
- **Firebase Console:** `https://console.firebase.google.com/project/YOUR_PROJECT_ID`

## استكشاف الأخطاء

### خطأ: "Build failed"
```bash
# تأكد من تثبيت جميع الحزم
npm install

# حاول البناء مرة أخرى
npm run build
```

### خطأ: "Functions deployment failed"
```bash
# تأكد من بناء Functions
cd functions
npm install
npm run build
cd ..

# حاول النشر مرة أخرى
firebase deploy --only functions
```

### خطأ: "Permission denied"
- تأكد من تسجيل الدخول: `firebase login`
- تأكد من الصلاحيات في Firebase Console

### خطأ: "Hosting deployment failed"
- تأكد من وجود مجلد `dist`
- تأكد من بناء المشروع: `npm run build`

## الأوامر المفيدة

```bash
# عرض معلومات المشروع
firebase projects:list

# عرض معلومات النشر
firebase hosting:channel:list

# عرض سجل النشر
firebase hosting:clone

# حذف النشر
firebase hosting:channel:delete CHANNEL_ID

# نشر على قناة معينة (للاختبار)
firebase hosting:channel:deploy preview
```

## البنية بعد النشر

```
Firebase Hosting (dist/)
├── index.html
├── assets/
│   ├── *.js
│   └── *.css
└── ...

Firebase Functions
└── adminApi (API endpoint)

Firestore Database
├── users/
├── tenants/
├── items/
├── orders/
└── settings/
```

## ملاحظات مهمة

1. **البيئة:** بعد النشر، التطبيق يستخدم قاعدة البيانات الحقيقية (Production)
2. **الأمان:** تأكد من نشر قواعد Firestore و Storage
3. **الأداء:** Firebase Hosting يوفر CDN تلقائياً
4. **التحديثات:** بعد أي تغيير، قم بالبناء والنشر مرة أخرى

## الدعم

إذا واجهت أي مشاكل:
- راجع [Firebase Documentation](https://firebase.google.com/docs/hosting)
- راجع [Firebase Functions Documentation](https://firebase.google.com/docs/functions)

