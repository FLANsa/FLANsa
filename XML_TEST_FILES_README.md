# ملفات XML للاختبار - متطلبات الهيئة العامة للزكاة والضريبة

## الملفات المتوفرة

### 1. `test_invoice_zatca_compliant.xml` ✅
**فاتورة متوافقة بالكامل مع متطلبات الهيئة**
- ✅ CustomizationID صحيح: `urn:sa:qayd-pos:invoice:1.0`
- ✅ ProfileID صحيح: `reporting:1.0`
- ✅ العملة: SAR
- ✅ معلومات البائع كاملة
- ✅ QR Code موجود
- ✅ التوقيع الرقمي موجود
- ✅ جميع العناصر المطلوبة موجودة

**البيانات:**
- رقم الفاتورة: INV-2024001
- المجموع: 63.25 ريال
- عدد الأصناف: 3 (برجر، بطاطس، مشروب)

### 2. `test_invoice_simplified.xml` ✅
**فاتورة مبسطة متوافقة**
- ✅ جميع المتطلبات الأساسية
- ✅ QR Code موجود
- ✅ بيانات بسيطة (قهوة واحدة)
- المجموع: 23.00 ريال

### 3. `test_invoice_with_errors.xml` ❌
**فاتورة تحتوي على أخطاء للاختبار**
- ❌ CustomizationID خاطئ
- ❌ ProfileID خاطئ
- ❌ العملة: USD (بدلاً من SAR)
- ❌ UUID غير صالح
- ❌ لا يوجد QR Code
- ❌ لا يوجد توقيع رقمي

## كيفية الاختبار

### 1. اختبار التحميل الصحيح
```bash
# استخدم الملفات المتوافقة
test_invoice_zatca_compliant.xml
test_invoice_simplified.xml
```

### 2. اختبار اكتشاف الأخطاء
```bash
# استخدم الملف مع الأخطاء
test_invoice_with_errors.xml
```

### 3. في واجهة البرنامج
1. افتح صفحة الطباعة
2. اضغط على "تحميل XML"
3. اسحب أحد الملفات أو اختره
4. راجع نتائج التحقق

## المتطلبات المطلوبة للهيئة

### العناصر الأساسية
- `cbc:CustomizationID` = `urn:sa:qayd-pos:invoice:1.0`
- `cbc:ProfileID` = `reporting:1.0`
- `cbc:DocumentCurrencyCode` = `SAR`
- `cbc:TaxCurrencyCode` = `SAR`

### معلومات البائع
- `cac:AccountingSupplierParty`
- رقم السجل التجاري (CRN)
- الرقم الضريبي (VAT)
- اسم البائع
- العنوان
- رقم الهاتف

### معلومات الفاتورة
- رقم الفاتورة (`cbc:ID`)
- UUID (`cbc:UUID`)
- تاريخ الإصدار (`cbc:IssueDate`)
- وقت الإصدار (`cbc:IssueTime`)
- نوع الفاتورة (`cbc:InvoiceTypeCode`)

### الأصناف والضرائب
- `cac:InvoiceLine` لكل صنف
- `cac:TaxTotal` للضرائب
- `cac:LegalMonetaryTotal` للمجاميع

### حقول الهيئة الإضافية
- QR Code (`cac:AdditionalDocumentReference` مع ID="QR")
- ICV - Invoice Counter Value
- PIH - Previous Invoice Hash
- التوقيع الرقمي (`cac:Signature`)

## ملاحظات مهمة

1. **الترتيب مهم**: العناصر يجب أن تظهر بالترتيب الصحيح حسب UBL
2. **التشفير**: يجب أن يكون الملف بـ UTF-8
3. **التنسيق**: يجب اتباع تنسيق UBL بدقة
4. **البيانات**: جميع البيانات يجب أن تكون صحيحة ومتسقة

## استكشاف الأخطاء

إذا ظهرت أخطاء في التحقق:
1. تأكد من صحة CustomizationID و ProfileID
2. تأكد من أن العملة SAR
3. تأكد من وجود جميع العناصر المطلوبة
4. تأكد من صحة تنسيق UUID والتواريخ
5. تأكد من وجود QR Code والتوقيع الرقمي

## روابط مفيدة

- [دليل التوافق مع الهيئة](ZATCA_COMPLIANCE_GUIDE.md)
- [قائمة التحقق من التكامل](ZATCA_INTEGRATION_CHECKLIST.md)
