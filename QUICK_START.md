# 🚀 دليل البدء السريع - Big Diet Restaurant POS

## الخطوات الأساسية

### 1️⃣ إعداد Firebase

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# إعداد Firebase (نشر القواعد والفهارس)
npm run setup:firebase
```

**ثم فعّل في Firebase Console:**
- Authentication: https://console.firebase.google.com/project/big-diet-restaurant-pos/authentication
- Firestore: https://console.firebase.google.com/project/big-diet-restaurant-pos/firestore

### 2️⃣ إنشاء المستخدمين الأوليين

```bash
# تحميل Service Account Key من Firebase Console أولاً
# ثم:
npm run setup:users
```

### 3️⃣ النشر على Firebase Hosting

```bash
# نشر كل شيء (القواعد، Functions، Hosting)
npm run deploy:all
```

أو خطوة بخطوة:

```bash
# بناء المشروع
npm run build

# نشر Functions
npm run deploy:functions

# نشر Hosting
npm run deploy:hosting
```

## 📋 بعد النشر

### الوصول إلى التطبيق:
- **التطبيق:** https://big-diet-restaurant-pos.web.app
- **لوحة التحكم:** https://big-diet-restaurant-pos.web.app/admin

### إضافة مستخدمين عبر الويب:
1. سجّل الدخول بحساب admin في `/admin`
2. اختر تبويب "المستخدمون"
3. أضف المستخدمين الجدد

## 🔑 معلومات تسجيل الدخول

| الدور | البريد | كلمة المرور |
|------|--------|------------|
| Admin | admin@bigdiet.com | admin123456 |
| Manager | manager@bigdiet.com | manager123456 |
| Cashier | cashier@bigdiet.com | cashier123456 |

⚠️ **غيّر كلمات المرور فوراً!**

## 📚 المزيد من المعلومات

- **إعداد Firebase:** راجع `FIREBASE_SETUP.md`
- **النشر:** راجع `DEPLOYMENT_GUIDE.md`

