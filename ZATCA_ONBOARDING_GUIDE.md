# دليل ZATCA Onboarding وإصدار شهادة CSID

## 📋 نظرة عامة
هذا الدليل يوضح كيفية إنجاز Onboarding مع ZATCA والحصول على شهادة CSID للمشروع.

## 🚀 الخطوة 1: إنشاء EGS Unit

### 1.1 الدخول لبوابة فاتورة الساندبوكس
```
URL: https://sandbox.fatoora.sa/
```

### 1.2 إنشاء حساب جديد
1. اضغط على "إنشاء حساب جديد"
2. أدخل بيانات المنشأة:
   - اسم المنشأة: `مطعم قيد`
   - رقم السجل التجاري: `1010101010`
   - رقم الضريبة: `300000000000003`
   - العنوان: `الرياض، المملكة العربية السعودية`

### 1.3 إنشاء EGS Unit
1. بعد تسجيل الدخول، اذهب إلى "إدارة الوحدات"
2. اضغط "إضافة وحدة جديدة"
3. أدخل بيانات الوحدة:
   - اسم الوحدة: `POS-Unit-1`
   - نوع الوحدة: `نقطة البيع`
   - الموقع: `الفرع الرئيسي`
4. احفظ `EGS_UNIT_ID` المُولد

## 🔐 الخطوة 2: توليد CSR

### 2.1 إنشاء ملف CSR Configuration
```bash
# إنشاء ملف csr_config.txt
cat > csr_config.txt << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = Qayd POS System
O = مطعم قيد
C = SA
serialNumber = 300000000000003

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = qayd-pos.local
EOF
```

### 2.2 توليد CSR
```bash
# توليد المفتاح الخاص
openssl genrsa -out zatca_private_key.pem 2048

# توليد CSR
openssl req -new -key zatca_private_key.pem -out zatca.csr -config csr_config.txt

# تحويل CSR إلى Base64
openssl req -in zatca.csr -outform DER | base64 -w 0 > csr.b64
```

### 2.3 إرسال CSR عبر بوابة فاتورة
1. اذهب إلى "إدارة الشهادات" في بوابة فاتورة
2. اضغط "طلب شهادة جديدة"
3. الصق محتوى `csr.b64` في الحقل المطلوب
4. أرسل الطلب وانتظر الموافقة

## 📜 الخطوة 3: تحميل وتصدير الشهادة

### 3.1 تحميل سلسلة الشهادات
1. بعد الموافقة، حمّل:
   - شهادة الوحدة (Unit Certificate)
   - سلسلة الشهادات (Certificate Chain)
   - المفتاح الخاص (Private Key)

### 3.2 تصدير كـ PFX
```bash
# تحويل الشهادة والمفتاح إلى PFX
openssl pkcs12 -export -out zatca_cert.pfx \
  -inkey zatca_private_key.pem \
  -in unit_certificate.crt \
  -certfile certificate_chain.crt \
  -password pass:YourSecurePassword123!

# تحويل PFX إلى Base64
base64 -w 0 zatca_cert.pfx > zatca_cert_base64.txt
```

## 🔧 الخطوة 4: إعداد متغيرات البيئة

### 4.1 إنشاء ملف .env
```bash
# ZATCA Configuration
ZATCA_ENV=sandbox
ZATCA_REPORTING_URL=https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation
EGS_UNIT_ID=YOUR_EGS_UNIT_ID_HERE
CSID_CERT_PFX_BASE64=YOUR_BASE64_PFX_HERE
CSID_CERT_PASSWORD=YourSecurePassword123!

# Organization Details
ORG_VAT_NUMBER=300000000000003
ORG_NAME_AR=مطعم قيد
ORG_NAME_EN=Qayd Restaurant
ORG_COUNTRY=SA
ORG_CRN=1010101010
ORG_ADDRESS_AR=الرياض، المملكة العربية السعودية
```

### 4.2 إعداد Secrets في الإنتاج
```bash
# استخدام AWS Secrets Manager (مثال)
aws secretsmanager create-secret \
  --name "zatca/csid-cert" \
  --description "ZATCA CSID Certificate" \
  --secret-string '{"pfx_base64":"YOUR_BASE64_PFX","password":"YourSecurePassword123!"}'
```

## 🌐 الخطوة 5: نقاط النهاية والمفاتيح

### 5.1 Reporting API Endpoints
```javascript
// Sandbox
const ZATCA_SANDBOX_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation'

// Production (بعد الموافقة)
const ZATCA_PRODUCTION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/production'
```

### 5.2 Headers المطلوبة
```javascript
const headers = {
  'Content-Type': 'application/xml',
  'Accept': 'application/xml',
  'OTP': 'YOUR_OTP_HERE', // من بوابة فاتورة
  'Subscription-Key': 'YOUR_SUBSCRIPTION_KEY', // من بوابة فاتورة
  'User-Agent': 'Qayd-POS/1.0'
}
```

### 5.3 Device/OTP Management
```javascript
// إدارة OTP
const otpService = {
  generateOTP: () => {
    // توليد OTP من بوابة فاتورة
    return fetch('/api/zatca/generate-otp', { method: 'POST' })
  },
  
  validateOTP: (otp) => {
    // التحقق من صحة OTP
    return fetch('/api/zatca/validate-otp', {
      method: 'POST',
      body: JSON.stringify({ otp })
    })
  }
}
```

## 🧪 الخطوة 6: اختبار الإرسال

### 6.1 إنشاء فاتورة تجريبية
```javascript
// استخدام النظام المدمج
const testInvoice = {
  uuid: 'test-uuid-123',
  issueDateTime: '2024-01-15T10:30:00Z',
  invoiceNumber: 'INV-TEST-001',
  invoiceTypeCode: 388,
  currency: 'SAR',
  items: [{
    nameAr: 'برجر تجريبي',
    nameEn: 'Test Burger',
    quantity: 1,
    unitPrice: 25.00,
    lineTotal: 25.00,
    vatRate: 0.15,
    vatAmount: 3.75
  }],
  summary: {
    lineTotal: 25.00,
    taxAmount: 3.75,
    taxInclusiveAmount: 28.75
  }
}
```

### 6.2 إرسال للاختبار
```bash
# استخدام النظام المدمج
curl -X POST http://localhost:3000/api/zatca/reporting \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "test-uuid-123",
    "invoiceHash": "test-hash",
    "invoiceXMLBase64": "YOUR_XML_BASE64"
  }'
```

### 6.3 Response المتوقع
```json
{
  "ok": true,
  "status": 200,
  "data": {
    "status": "accepted",
    "uuid": "test-uuid-123",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔄 الخطوة 7: إدارة الشهادات

### 7.1 تدوير الشهادة
```javascript
// نظام تنبيهات قبل انتهاء الصلاحية
const certificateManager = {
  checkExpiry: async () => {
    const cert = await loadCertificate()
    const expiryDate = new Date(cert.notAfter)
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry <= 30) {
      await sendExpiryAlert(daysUntilExpiry)
    }
  },
  
  renewCertificate: async () => {
    // عملية تجديد الشهادة
    const newCSR = await generateCSR()
    const newCert = await requestNewCertificate(newCSR)
    await updateCertificate(newCert)
  }
}
```

### 7.2 أفضل ممارسات التخزين
```javascript
// تخزين آمن للشهادة
const secureStorage = {
  // استخدام AWS Secrets Manager
  storePFX: async (pfxBase64, password) => {
    return await secretsManager.createSecret({
      Name: 'zatca/csid-cert',
      SecretString: JSON.stringify({
        pfx_base64: pfxBase64,
        password: password,
        created_at: new Date().toISOString()
      })
    })
  },
  
  // استخدام Azure Key Vault
  storePFXAzure: async (pfxBase64, password) => {
    return await keyVault.setSecret('zatca-csid-cert', {
      pfx: pfxBase64,
      password: password
    })
  }
}
```

## 📊 الخطوة 8: مراقبة ومراجعة

### 8.1 مراقبة الإرسال
```javascript
// نظام مراقبة الإرسال
const monitoringService = {
  trackSubmission: async (invoiceId, result) => {
    await db.collection('zatca_reports').add({
      invoiceId,
      result,
      timestamp: new Date(),
      status: result.accepted ? 'success' : 'failed'
    })
  },
  
  generateReport: async () => {
    const reports = await db.collection('zatca_reports')
      .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .get()
    
    return {
      total: reports.size,
      success: reports.docs.filter(doc => doc.data().status === 'success').length,
      failed: reports.docs.filter(doc => doc.data().status === 'failed').length
    }
  }
}
```

## ⚠️ تنبيهات مهمة

### 🔒 الأمان
- **لا تخزن PFX في الكود أو Git**
- **استخدم Secrets Manager في الإنتاج**
- **فعل HTTPS فقط في الإنتاج**

### 🔄 ICV/PIH
- **لا تعيد ضبط ICV/PIH أبداً**
- **احتفظ بنسخة احتياطية من قاعدة البيانات**
- **راقب تسلسل ICV باستمرار**

### 🌐 البيئة
- **اختبر في Sandbox أولاً**
- **تأكد من صحة الشهادة قبل الإنتاج**
- **راقب انتهاء صلاحية الشهادة**

## 📞 الدعم
- بوابة فاتورة: https://fatoora.sa/
- دعم ZATCA: support@zatca.gov.sa
- وثائق API: https://zatca.gov.sa/ar/E-Invoicing/Pages/API-Documentation.aspx

---

**ملاحظة**: هذا الدليل قابل للتطبيق على النظام المدمج. تأكد من تحديث المتغيرات حسب بياناتك الفعلية.

