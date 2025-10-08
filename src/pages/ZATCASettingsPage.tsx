import React, { useState, useEffect } from 'react'
import { Save, TestTube, CheckCircle, XCircle, AlertCircle, Upload, Download, Key, Building2, FileText } from 'lucide-react'
import { authService } from '../lib/authService'
import { settingsService } from '../lib/firebaseServices'

const ZATCASettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  
  // ZATCA Configuration
  const [zatcaEnv, setZatcaEnv] = useState<'sandbox' | 'production'>('sandbox')
  const [egsUnitId, setEgsUnitId] = useState('')
  const [csidCertPfxBase64, setCsidCertPfxBase64] = useState('')
  const [csidCertPassword, setCsidCertPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [subscriptionKey, setSubscriptionKey] = useState('')
  
  // Organization Details
  const [orgVatNumber, setOrgVatNumber] = useState('')
  const [orgNameAr, setOrgNameAr] = useState('')
  const [orgNameEn, setOrgNameEn] = useState('')
  const [orgCrn, setOrgCrn] = useState('')
  const [orgAddressAr, setOrgAddressAr] = useState('')
  const [orgAddressEn, setOrgAddressEn] = useState('')
  const [orgCity, setOrgCity] = useState('')
  const [orgPostalCode, setOrgPostalCode] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  
  // Connection Status
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected')
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const tenantId = authService.getCurrentTenantId()
      if (!tenantId) {
        setLoading(false)
        return
      }

      const settings = await settingsService.getSettingsByTenant(tenantId)
      if (settings?.zatca) {
        // Load ZATCA settings
        setZatcaEnv(settings.zatca.env || 'sandbox')
        setEgsUnitId(settings.zatca.egsUnitId || '')
        setCsidCertPfxBase64(settings.zatca.csidCertPfxBase64 || '')
        setCsidCertPassword(settings.zatca.csidCertPassword || '')
        setOtp(settings.zatca.otp || '')
        setSubscriptionKey(settings.zatca.subscriptionKey || '')
        
        // Load organization details
        setOrgVatNumber(settings.zatca.orgVatNumber || '')
        setOrgNameAr(settings.zatca.orgNameAr || '')
        setOrgNameEn(settings.zatca.orgNameEn || '')
        setOrgCrn(settings.zatca.orgCrn || '')
        setOrgAddressAr(settings.zatca.orgAddressAr || '')
        setOrgAddressEn(settings.zatca.orgAddressEn || '')
        setOrgCity(settings.zatca.orgCity || '')
        setOrgPostalCode(settings.zatca.orgPostalCode || '')
        setOrgPhone(settings.zatca.orgPhone || '')
        setOrgEmail(settings.zatca.orgEmail || '')
        
        setConnectionStatus(settings.zatca.connectionStatus || 'disconnected')
        setLastSync(settings.zatca.lastSync ? new Date(settings.zatca.lastSync) : null)
      }
    } catch (error) {
      console.error('Error loading ZATCA settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const tenantId = authService.getCurrentTenantId()
      if (!tenantId) {
        alert('لا يوجد معرف متجر. سجل الدخول أولاً.')
        return
      }

      const zatcaSettings = {
        env: zatcaEnv,
        egsUnitId,
        csidCertPfxBase64,
        csidCertPassword,
        otp,
        subscriptionKey,
        orgVatNumber,
        orgNameAr,
        orgNameEn,
        orgCrn,
        orgAddressAr,
        orgAddressEn,
        orgCity,
        orgPostalCode,
        orgPhone,
        orgEmail,
        connectionStatus,
        lastSync: new Date().toISOString(),
        updatedAt: new Date()
      }

      await settingsService.updateSettingsByTenant(tenantId, { zatca: zatcaSettings })
      alert('✅ تم حفظ إعدادات ZATCA بنجاح!')
      setLastSync(new Date())
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('❌ فشل في حفظ الإعدادات')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      setTestResult(null)

      // Test connection to ZATCA
      const response = await fetch('/api/zatca/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: zatcaEnv,
          egsUnitId,
          otp,
          subscriptionKey
        })
      })

      const result = await response.json()
      setTestResult(result)

      if (result.ok) {
        setConnectionStatus('connected')
        alert('✅ نجح الاتصال بزاتكا!')
      } else {
        setConnectionStatus('error')
        alert('❌ فشل الاتصال: ' + result.message)
      }
    } catch (error: any) {
      setConnectionStatus('error')
      setTestResult({ ok: false, message: error.message })
      alert('❌ خطأ في اختبار الاتصال: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  const handleUploadPFX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      // Remove data:application/x-pkcs12;base64, prefix if present
      const cleanBase64 = base64.split(',')[1] || base64
      setCsidCertPfxBase64(cleanBase64)
      alert('✅ تم رفع ملف الشهادة بنجاح!')
    }
    reader.readAsDataURL(file)
  }

  const handleDownloadConfig = () => {
    const config = {
      zatcaEnv,
      egsUnitId,
      orgVatNumber,
      orgNameAr,
      orgNameEn,
      orgCrn,
      orgAddressAr,
      orgAddressEn,
      orgCity,
      orgPostalCode,
      orgPhone,
      orgEmail,
      connectionStatus,
      lastSync: lastSync?.toISOString(),
      note: 'CSID Certificate and sensitive data are not included in this export'
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zatca-config-${new Date().getTime()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 arabic">جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 arabic">إعدادات ZATCA</h1>
              <p className="text-gray-600 mt-2 arabic">الربط مع بوابة فاتورة وهيئة الزكاة والضريبة والجمارك</p>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium arabic">متصل</span>
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium arabic">غير متصل</span>
                </div>
              )}
              {connectionStatus === 'disconnected' && (
                <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium arabic">لم يتم الربط</span>
                </div>
              )}
            </div>
          </div>
          {lastSync && (
            <p className="text-sm text-gray-500 mt-2 arabic">
              آخر تحديث: {lastSync.toLocaleString('ar-SA')}
            </p>
          )}
        </div>

        {/* Environment Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 arabic">البيئة</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setZatcaEnv('sandbox')}
              className={`p-4 rounded-lg border-2 ${
                zatcaEnv === 'sandbox'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-bold arabic">بيئة الاختبار</div>
                <div className="text-sm text-gray-600 mt-1">Sandbox</div>
              </div>
            </button>
            <button
              onClick={() => setZatcaEnv('production')}
              className={`p-4 rounded-lg border-2 ${
                zatcaEnv === 'production'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-bold arabic">بيئة الإنتاج</div>
                <div className="text-sm text-gray-600 mt-1">Production</div>
              </div>
            </button>
          </div>
        </div>

        {/* EGS Unit & Certificate */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            <span className="arabic">معلومات الشهادة والوحدة</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">معرف وحدة التوليد (EGS Unit ID)</label>
              <input
                type="text"
                value={egsUnitId}
                onChange={(e) => setEgsUnitId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., POS-UNIT-001"
              />
              <p className="text-xs text-gray-500 mt-1 arabic">احصل عليه من بوابة فاتورة بعد إنشاء الوحدة</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">شهادة CSID (PFX File)</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleUploadPFX}
                  className="hidden"
                  id="pfx-upload"
                />
                <label
                  htmlFor="pfx-upload"
                  className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span className="arabic">رفع ملف PFX</span>
                </label>
                {csidCertPfxBase64 && (
                  <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span className="arabic">تم الرفع</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 arabic">ملف الشهادة من بوابة فاتورة (.pfx أو .p12)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">كلمة مرور الشهادة (CSID Password)</label>
              <input
                type="password"
                value={csidCertPassword}
                onChange={(e) => setCsidCertPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">OTP (رمز التحقق)</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123456"
              />
              <p className="text-xs text-gray-500 mt-1 arabic">احصل عليه من بوابة فاتورة → الإعدادات → OTP</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">Subscription Key</label>
              <input
                type="text"
                value={subscriptionKey}
                onChange={(e) => setSubscriptionKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="your-subscription-key"
              />
              <p className="text-xs text-gray-500 mt-1 arabic">مفتاح الاشتراك من بوابة فاتورة</p>
            </div>
          </div>
        </div>

        {/* Organization Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <span className="arabic">بيانات المنشأة</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">رقم الضريبة (VAT Number)</label>
              <input
                type="text"
                value={orgVatNumber}
                onChange={(e) => setOrgVatNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="300000000000003"
                maxLength={15}
              />
              <p className="text-xs text-gray-500 mt-1">15 رقم</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">السجل التجاري (CR Number)</label>
              <input
                type="text"
                value={orgCrn}
                onChange={(e) => setOrgCrn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1010101010"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">اسم المنشأة (عربي)</label>
              <input
                type="text"
                value={orgNameAr}
                onChange={(e) => setOrgNameAr(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مطعم قيد"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name (English)</label>
              <input
                type="text"
                value={orgNameEn}
                onChange={(e) => setOrgNameEn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Qayd Restaurant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">العنوان (عربي)</label>
              <input
                type="text"
                value={orgAddressAr}
                onChange={(e) => setOrgAddressAr(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="الرياض، المملكة العربية السعودية"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address (English)</label>
              <input
                type="text"
                value={orgAddressEn}
                onChange={(e) => setOrgAddressEn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Riyadh, Saudi Arabia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">المدينة</label>
              <input
                type="text"
                value={orgCity}
                onChange={(e) => setOrgCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="الرياض"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">الرمز البريدي</label>
              <input
                type="text"
                value={orgPostalCode}
                onChange={(e) => setOrgPostalCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="12345"
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">رقم الهاتف</label>
              <input
                type="tel"
                value={orgPhone}
                onChange={(e) => setOrgPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+966 11 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 arabic">البريد الإلكتروني</label>
              <input
                type="email"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="info@company.com"
              />
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className={`rounded-lg shadow-lg p-6 mb-6 ${
            testResult.ok ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
          }`}>
            <h2 className="text-xl font-bold mb-4 arabic">
              {testResult.ok ? '✅ نجح الاختبار' : '❌ فشل الاختبار'}
            </h2>
            <pre className="bg-white p-4 rounded border overflow-auto text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleTestConnection}
              disabled={testing || !egsUnitId || !otp}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <TestTube className="w-5 h-5" />
              <span className="arabic">{testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span className="arabic">{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
            </button>

            <button
              onClick={handleDownloadConfig}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="w-5 h-5" />
              <span className="arabic">تصدير الإعدادات</span>
            </button>
          </div>
        </div>

        {/* Validation Checklist */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="arabic">قائمة التحقق</span>
          </h2>
          
          <div className="space-y-2">
            {[
              { label: 'معرف وحدة التوليد (EGS Unit ID)', value: egsUnitId },
              { label: 'شهادة CSID (PFX)', value: csidCertPfxBase64 },
              { label: 'كلمة مرور الشهادة', value: csidCertPassword },
              { label: 'OTP', value: otp },
              { label: 'Subscription Key', value: subscriptionKey },
              { label: 'رقم الضريبة', value: orgVatNumber },
              { label: 'اسم المنشأة (عربي)', value: orgNameAr },
              { label: 'اسم المنشأة (إنجليزي)', value: orgNameEn },
              { label: 'السجل التجاري', value: orgCrn },
              { label: 'العنوان (عربي)', value: orgAddressAr }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {item.value ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm arabic">{item.label}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800 arabic">
              ⚠️ تأكد من إدخال جميع البيانات المطلوبة قبل البدء في استخدام النظام
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ZATCASettingsPage
