# 🏪 Qayd POS - نظام الكاشير المتكامل مع ZATCA

## 📋 نظرة عامة
نظام نقطة البيع (POS) متكامل مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) للمرحلة الثانية من الفواتير المبسطة (B2C).

## ✨ المميزات الرئيسية

### 🛒 نظام نقطة البيع
- واجهة مستخدم عربية/إنجليزية
- إدارة المنتجات والمخزون
- دعم أنواع الطلبات (محلي، سفري، توصيل)
- حساب الضريبة المضافة (15%)
- دعم طرق الدفع المتعددة

### 📄 تكامل ZATCA Phase-2
- توليد فواتير UBL 2.1 متوافقة
- توقيع XAdES B-B رقمي
- رموز QR متوافقة مع ZATCA
- إدارة ICV/PIH المتسلسلة
- إرسال تلقائي لبوابة الإبلاغ

### 🔐 الأمان والحماية
- توقيع الخادم فقط (Server-side signing)
- تخزين آمن للشهادات
- تشفير البيانات الحساسة
- دعم متعدد المستأجرين

## 🚀 البدء السريع

### 1. متطلبات النظام
```bash
Node.js >= 18.0.0
npm >= 8.0.0
Firebase CLI
OpenSSL (لتوليد الشهادات)
```

### 2. التثبيت
```bash
# استنساخ المشروع
git clone https://github.com/your-repo/qayd-pos.git
cd qayd-pos

# تثبيت التبعيات
npm install

# تثبيت تبعيات الخادم
cd server
npm install
cd ..

# تثبيت Firebase CLI
npm install -g firebase-tools
```

### 3. إعداد البيئة
```bash
# نسخ ملف البيئة
cp env.zatca.example .env

# تحديث القيم في .env
# - EGS_UNIT_ID
# - CSID_CERT_PFX_BASE64
# - CSID_CERT_PASSWORD
# - بيانات المنشأة
```

### 4. إعداد Firebase
```bash
# تسجيل الدخول لـ Firebase
firebase login

# تهيئة المشروع
firebase init

# نشر قواعد Firestore
firebase deploy --only firestore:rules
```

### 5. تشغيل المشروع
```bash
# تشغيل الخادم
npm run dev:server

# تشغيل الواجهة الأمامية
npm run dev

# أو تشغيل كلاهما
npm run dev:all
```

## 📚 دليل ZATCA

### Onboarding
1. **إنشاء EGS Unit**: اتبع [دليل Onboarding](ZATCA_ONBOARDING_GUIDE.md)
2. **توليد CSR**: استخدم `./generate_csr.sh`
3. **طلب الشهادة**: من بوابة فاتورة الساندبوكس
4. **تحويل PFX**: استخدم `./create_pfx.sh`

### الاختبار
```bash
# اختبار التكامل
./test_zatca.sh

# اختبار الوحدات
npm test

# اختبار E2E
npm run test:e2e
```

## 🏗️ هيكل المشروع

```
qayd-pos/
├── src/
│   ├── zatca/                 # وحدات ZATCA
│   │   ├── models.ts          # نماذج البيانات
│   │   ├── ubl.ts             # توليد UBL XML
│   │   ├── qr.ts              # توليد QR codes
│   │   ├── signing.ts         # التوقيع الرقمي
│   │   ├── reporting.ts       # إرسال التقارير
│   │   ├── icvPih.ts          # إدارة ICV/PIH
│   │   ├── config.ts          # إعدادات ZATCA
│   │   └── __tests__/         # اختبارات الوحدات
│   ├── pages/
│   │   ├── POSEnhanced.tsx    # نقطة البيع
│   │   ├── PrintPage.tsx      # صفحة الطباعة
│   │   └── ...
│   └── components/
├── server/
│   ├── zatca-signing.ts       # توقيع الخادم
│   ├── zatca.routes.ts        # مسارات ZATCA
│   └── index.ts               # خادم Express
├── docs/                      # الوثائق
├── tests/                     # اختبارات E2E
└── scripts/                   # سكريبتات مساعدة
```

## 🔧 التكوين

### متغيرات البيئة الأساسية
```env
# ZATCA
ZATCA_ENV=sandbox
EGS_UNIT_ID=your_egs_unit_id
CSID_CERT_PFX_BASE64=your_base64_pfx
CSID_CERT_PASSWORD=your_password

# المنشأة
ORG_VAT_NUMBER=300000000000003
ORG_NAME_AR=مطعم قيد
ORG_NAME_EN=Qayd Restaurant
```

### إعدادات Firebase
```javascript
// firebase.json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

## 🧪 الاختبارات

### اختبارات الوحدات
```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات ZATCA فقط
npm test src/zatca

# اختبارات مع التغطية
npm run test:coverage
```

### اختبارات التكامل
```bash
# اختبار ZATCA
./test_zatca.sh

# اختبار E2E
npm run test:e2e
```

### اختبارات الأداء
```bash
# اختبار الحمل
npm run test:load

# اختبار الذاكرة
npm run test:memory
```

## 📊 المراقبة والتحليل

### سجلات النظام
```bash
# عرض السجلات
npm run logs

# مراقبة ZATCA
npm run logs:zatca

# مراقبة الأخطاء
npm run logs:errors
```

### مقاييس الأداء
- وقت استجابة API
- معدل نجاح الإرسال
- استخدام الذاكرة
- استهلاك CPU

## 🔒 الأمان

### أفضل الممارسات
1. **تخزين الشهادات**: استخدم AWS Secrets Manager أو Azure Key Vault
2. **تشفير البيانات**: جميع البيانات الحساسة مشفرة
3. **مراقبة الوصول**: سجل جميع العمليات الحساسة
4. **تحديثات الأمان**: حافظ على تحديث التبعيات

### تدقيق الأمان
```bash
# فحص التبعيات
npm audit

# فحص الأمان المتقدم
npm run security:scan

# تحديث التبعيات
npm run security:update
```

## 🚀 النشر

### البيئة التطويرية
```bash
# نشر Firebase
firebase deploy

# نشر الخادم
npm run deploy:dev
```

### البيئة الإنتاجية
```bash
# بناء الإنتاج
npm run build:prod

# نشر الإنتاج
npm run deploy:prod

# مراقبة الإنتاج
npm run monitor:prod
```

## 📈 الصيانة

### النسخ الاحتياطية
```bash
# نسخ احتياطي يومي
npm run backup:daily

# نسخ احتياطي أسبوعي
npm run backup:weekly

# استعادة النسخة الاحتياطية
npm run restore:backup
```

### تحديثات النظام
```bash
# تحديث التبعيات
npm update

# تحديث ZATCA
npm run update:zatca

# تحديث النظام
npm run update:system
```

## 🆘 استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في الشهادة**: تحقق من صحة PFX وكلمة المرور
2. **فشل الإرسال**: تحقق من OTP وSubscription Key
3. **خطأ في ICV**: لا تعيد ضبط ICV أبداً
4. **مشاكل الشبكة**: تحقق من الاتصال بـ ZATCA

### سجلات الأخطاء
```bash
# عرض أخطاء ZATCA
tail -f logs/zatca-errors.log

# عرض أخطاء النظام
tail -f logs/system-errors.log

# عرض أخطاء قاعدة البيانات
tail -f logs/database-errors.log
```

## 📞 الدعم

### الوثائق
- [دليل ZATCA](ZATCA_ONBOARDING_GUIDE.md)
- [دليل API](docs/API.md)
- [دليل النشر](docs/DEPLOYMENT.md)

### التواصل
- البريد الإلكتروني: support@qayd-pos.com
- GitHub Issues: [إنشاء مشكلة](https://github.com/your-repo/qayd-pos/issues)
- الدردشة: [Discord](https://discord.gg/qayd-pos)

### المجتمع
- [منتدى المطورين](https://forum.qayd-pos.com)
- [قناة YouTube](https://youtube.com/qayd-pos)
- [تويتر](https://twitter.com/qayd_pos)

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🤝 المساهمة

نرحب بمساهماتكم! راجع [دليل المساهمة](CONTRIBUTING.md) للبدء.

### كيفية المساهمة
1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push للفرع
5. إنشاء Pull Request

## 📊 الإحصائيات

- **النجوم**: ⭐ 150+
- **المشاكل**: 🐛 12 مفتوحة
- **المساهمات**: 👥 25+ مطور
- **الإصدار**: 📦 v1.0.0

## 🎯 الطريق المستقبلي

### الميزات القادمة
- [ ] دعم الفواتير المعقدة (B2B)
- [ ] تكامل مع أنظمة المحاسبة
- [ ] تطبيق جوال
- [ ] تحليلات متقدمة
- [ ] دعم العملات المتعددة

### التحسينات المخططة
- [ ] تحسين الأداء
- [ ] واجهة مستخدم محسنة
- [ ] دعم اللغات الإضافية
- [ ] تكامل مع أنظمة الدفع

---

**تم تطويره بـ ❤️ في المملكة العربية السعودية**

