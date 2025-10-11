import { useEffect, useState } from 'react'
import { adminApi } from '../lib/adminApi'
import { auth } from '../lib/firebase'
import { Users, Building2, BarChart3, Settings, Plus, CheckCircle, XCircle } from 'lucide-react'

type Tab = 'users' | 'tenants' | 'stats' | 'settings'

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('users')
  const [allowed, setAllowed] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setAllowed(false)
        setLoading(false)
        return
      }
      const token = await u.getIdTokenResult()
      const email = (u.email || '').toLowerCase()
      const role = (token.claims as any).role
      const isOwner = role === 'owner'
      const isSuper = email === 'admin@qayd.com'
      setAllowed(isOwner || isSuper)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (!allowed) return <div className="p-8 text-red-600">Not authorized</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 arabic mb-2">لوحة تحكم المشرف</h1>
              <p className="text-gray-600 arabic text-lg">إدارة المستخدمين والمتاجر والإحصائيات</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
            <div className="flex gap-2">
              {([
                { key: 'users', label: 'المستخدمون', icon: Users },
                { key: 'tenants', label: 'المتاجر', icon: Building2 },
                { key: 'stats', label: 'الإحصائيات', icon: BarChart3 },
                { key: 'settings', label: 'الإعدادات', icon: Settings }
              ] as { key: Tab, label: string, icon: any }[]).map(({ key, label, icon: Icon }) => (
                <button 
                  key={key} 
                  onClick={() => setTab(key)} 
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    tab === key 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {tab === 'users' && <UsersTab onError={setError} />}
          {tab === 'tenants' && <TenantsTab onError={setError} />}
          {tab === 'stats' && <StatsTab onError={setError} />}
          {tab === 'settings' && <SettingsTab onError={setError} />}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg arabic">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UsersTab({ onError }: { onError: (e: string)=>void }) {
  const [email, setEmail] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('cashier')
  const [busy, setBusy] = useState(false)
  const [tenants, setTenants] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  async function addUser() {
    try {
      setBusy(true)
      await adminApi.createUser({ email, tenantId, name, role })
      setEmail(''); setName(''); setRole('cashier')
      const list = await adminApi.listUsers(tenantId || undefined)
      setUsers(list.users||[])
    } catch (e: any) { onError(e.message) } finally { setBusy(false) }
  }
  useEffect(()=>{ (async()=>{ try{ const t = await adminApi.listTenants(); setTenants(t.tenants||[]) } catch(e:any){ onError(e.message) } })() },[])
  useEffect(()=>{ (async()=>{ try{ const u = await adminApi.listUsers(tenantId || undefined); setUsers(u.users||[]) } catch(e:any){ onError(e.message) } })() },[tenantId])
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">المتجر</label>
          <select className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={tenantId} onChange={e=>setTenantId(e.target.value)}>
            <option value="">جميع المتاجر</option>
            {tenants.map((t:any)=> (<option key={t.id} value={t.id}>{t.nameAr || t.name}</option>))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">البريد الإلكتروني</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="user@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">الاسم</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="اسم المستخدم" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">الدور</label>
          <select className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="owner">owner</option>
          <option value="admin">admin</option>
          <option value="manager">manager</option>
          <option value="cashier">cashier</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2" disabled={busy} onClick={addUser}>
          <Plus className="h-5 w-5" />
          إضافة مستخدم
        </button>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 arabic mb-4">المستخدمون</h3>
        <div className="overflow-auto rounded-xl border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-right font-semibold text-gray-900">الاسم</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-900">البريد</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-900">الدور</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-900">المتجر</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-900">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u:any)=> (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900">{u.name || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      u.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'admin' ? 'bg-red-100 text-red-800' :
                      u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{(tenants.find(t=>t.id===u.tenantId)?.nameAr) || u.tenantId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {u.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className={u.isActive ? 'text-green-700' : 'text-red-700'}>{u.isActive ? 'نشط' : 'موقوف'}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length===0 && (
                <tr><td className="px-6 py-8 text-gray-500 text-center" colSpan={5}>لا يوجد مستخدمون</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TenantsTab({ onError }: { onError: (e: string)=>void }) {
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [addressAr, setAddressAr] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [crNumber, setCrNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [tenants, setTenants] = useState<any[]>([])
  async function createTenant(){
    try {
      setBusy(true)
      await adminApi.createTenant({ name, nameAr, email, phone, address, addressAr, vatNumber, crNumber, isActive: true })
      setName(''); setNameAr(''); setEmail(''); setPhone(''); setAddress(''); setAddressAr(''); setVatNumber(''); setCrNumber('')
      const list = await adminApi.listTenants()
      setTenants(list.tenants||[])
    } catch (e:any){ onError(e.message) } finally { setBusy(false) }
  }
  function clearForm(){ setName(''); setNameAr(''); setEmail(''); setPhone(''); setAddress(''); setAddressAr(''); setVatNumber(''); setCrNumber('') }
  useEffect(()=>{ (async()=>{ try{ const list = await adminApi.listTenants(); setTenants(list.tenants||[]) } catch(e:any){ onError(e.message) } })() },[])
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 arabic">إضافة متجر جديد</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">اسم المطعم (عربي)</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="اسم المطعم" value={nameAr} onChange={e=>setNameAr(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">اسم المطعم (إنجليزي)</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Restaurant Name" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">رقم ضريبة القيمة المضافة</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="123456789012345" value={vatNumber} onChange={e=>setVatNumber(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">رقم السجل التجاري</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="1010101010" value={crNumber} onChange={e=>setCrNumber(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">رقم الهاتف</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+966 50 123 4567" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">البريد الإلكتروني</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="store@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">العنوان (عربي)</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="الرياض، المملكة العربية السعودية" value={addressAr} onChange={e=>setAddressAr(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 arabic mb-2">العنوان (إنجليزي)</label>
          <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Riyadh, Saudi Arabia" value={address} onChange={e=>setAddress(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3">
        <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2" disabled={busy} onClick={createTenant}>
          <Plus className="h-5 w-5" />
          إضافة المتجر
        </button>
        <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200" onClick={clearForm}>إلغاء</button>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 arabic mb-4">المتاجر</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map(t => (
            <div key={t.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 arabic">{t.nameAr || t.name}</h4>
              <p className="text-sm text-gray-600 english">{t.name}</p>
              <p className="text-xs text-gray-500 mt-2">{t.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab({ onError }: { onError: (e: string)=>void }) {
  const [totals, setTotals] = useState<any>(null)
  useEffect(()=>{ (async()=>{ try{ const s = await adminApi.getSystemStats(); setTotals(s.totals) } catch(e:any){ onError(e.message) } })() },[])
  if (!totals) return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(totals).map(([k,v]) => (
        <div key={k} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-gray-500 text-sm font-medium mb-2">{k}</div>
          <div className="text-3xl font-bold text-gray-900">{String(v)}</div>
        </div>
      ))}
    </div>
  )
}

function SettingsTab({ onError }: { onError: (e: string)=>void }) {
  const [tenantId, setTenantId] = useState('')
  const [settings, setSettings] = useState<any>({})
  async function save(){ try{ await adminApi.updateTenantSettings(tenantId, settings) } catch(e:any){ onError(e.message) } }
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 arabic mb-2">معرف المتجر</label>
        <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Tenant ID" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 arabic mb-2">إعدادات JSON</label>
        <textarea className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-40 font-mono text-sm" placeholder="JSON settings" value={JSON.stringify(settings)} onChange={e=>{ try{ setSettings(JSON.parse(e.target.value||'{}')) } catch{} }} />
      </div>
      <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200" onClick={save}>حفظ الإعدادات</button>
    </div>
  )
}



