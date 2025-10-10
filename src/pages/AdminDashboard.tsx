import { useEffect, useState } from 'react'
import { adminApi } from '../lib/adminApi'
import { auth } from '../lib/firebase'

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
    <div className="p-6 space-y-4" dir="rtl">
      <h1 className="text-2xl font-bold arabic">لوحة تحكم المشرف</h1>
      <div className="flex gap-2">
        {(['users','tenants','stats','settings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded ${tab===t?'bg-blue-600 text-white':'bg-gray-100'}`}>{t}</button>
        ))}
      </div>

      {tab === 'users' && <UsersTab onError={setError} />}
      {tab === 'tenants' && <TenantsTab onError={setError} />}
      {tab === 'stats' && <StatsTab onError={setError} />}
      {tab === 'settings' && <SettingsTab onError={setError} />}

      {error && <div className="text-red-600">{error}</div>}
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
  async function test() { try { await adminApi.testAuth() } catch (e:any){ onError(e.message) } }
  useEffect(()=>{ (async()=>{ try{ const t = await adminApi.listTenants(); setTenants(t.tenants||[]) } catch(e:any){ onError(e.message) } })() },[])
  useEffect(()=>{ (async()=>{ try{ const u = await adminApi.listUsers(tenantId || undefined); setUsers(u.users||[]) } catch(e:any){ onError(e.message) } })() },[tenantId])
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 max-w-3xl">
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">المتجر</label>
          <select className="border p-2" value={tenantId} onChange={e=>setTenantId(e.target.value)}>
            <option value="">جميع المتاجر</option>
            {tenants.map((t:any)=> (<option key={t.id} value={t.id}>{t.nameAr || t.name}</option>))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">البريد الإلكتروني</label>
          <input className="border p-2" placeholder="user@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">الاسم</label>
          <input className="border p-2" placeholder="اسم المستخدم" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">الدور</label>
          <select className="border p-2" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="owner">owner</option>
          <option value="admin">admin</option>
          <option value="manager">manager</option>
          <option value="cashier">cashier</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="bg-green-600 text-white px-3 py-1 rounded" disabled={busy} onClick={addUser}>Add user</button>
        <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={test}>Quick test</button>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold arabic">المستخدمون</h3>
        <div className="overflow-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border text-right">الاسم</th>
                <th className="p-2 border text-right">البريد</th>
                <th className="p-2 border text-right">الدور</th>
                <th className="p-2 border text-right">المتجر</th>
                <th className="p-2 border text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u:any)=> (
                <tr key={u.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border">{u.name || '-'}</td>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border">{u.role}</td>
                  <td className="p-2 border">{(tenants.find(t=>t.id===u.tenantId)?.nameAr) || u.tenantId}</td>
                  <td className="p-2 border">{u.isActive ? 'نشط' : 'موقوف'}</td>
                </tr>
              ))}
              {users.length===0 && (
                <tr><td className="p-3 text-gray-500 text-center" colSpan={5}>لا يوجد مستخدمون</td></tr>
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
    <div className="space-y-3">
      <h3 className="text-lg font-semibold arabic">إضافة متجر جديد</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">اسم المطعم (عربي)</label>
          <input className="border p-2" placeholder="اسم المطعم" value={nameAr} onChange={e=>setNameAr(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">اسم المطعم (إنجليزي)</label>
          <input className="border p-2" placeholder="Restaurant Name" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">رقم ضريبة القيمة المضافة</label>
          <input className="border p-2" placeholder="123456789012345" value={vatNumber} onChange={e=>setVatNumber(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">رقم السجل التجاري</label>
          <input className="border p-2" placeholder="1010101010" value={crNumber} onChange={e=>setCrNumber(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">رقم الهاتف</label>
          <input className="border p-2" placeholder="+966 50 123 4567" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">البريد الإلكتروني</label>
          <input className="border p-2" placeholder="store@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">العنوان (عربي)</label>
          <input className="border p-2" placeholder="الرياض، المملكة العربية السعودية" value={addressAr} onChange={e=>setAddressAr(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 arabic">العنوان (إنجليزي)</label>
          <input className="border p-2" placeholder="Riyadh, Saudi Arabia" value={address} onChange={e=>setAddress(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="bg-green-600 text-white px-3 py-1 rounded" disabled={busy} onClick={createTenant}>إضافة المتجر</button>
        <button className="bg-gray-200 px-3 py-1 rounded" onClick={clearForm}>إلغاء</button>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold">Tenants</h3>
        <ul className="list-disc ml-6">
          {tenants.map(t => <li key={t.id}>{t.name} / {t.nameAr}</li>)}
        </ul>
      </div>
    </div>
  )
}

function StatsTab({ onError }: { onError: (e: string)=>void }) {
  const [totals, setTotals] = useState<any>(null)
  useEffect(()=>{ (async()=>{ try{ const s = await adminApi.getSystemStats(); setTotals(s.totals) } catch(e:any){ onError(e.message) } })() },[])
  if (!totals) return <div>...</div>
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
      {Object.entries(totals).map(([k,v]) => (
        <div key={k} className="bg-white p-4 rounded shadow"><div className="text-gray-500">{k}</div><div className="text-2xl font-bold">{String(v)}</div></div>
      ))}
    </div>
  )
}

function SettingsTab({ onError }: { onError: (e: string)=>void }) {
  const [tenantId, setTenantId] = useState('')
  const [settings, setSettings] = useState<any>({})
  async function save(){ try{ await adminApi.updateTenantSettings(tenantId, settings) } catch(e:any){ onError(e.message) } }
  return (
    <div className="space-y-3 max-w-xl">
      <input className="border p-2 w-full" placeholder="Tenant ID" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
      <textarea className="border p-2 w-full h-40" placeholder="JSON settings" value={JSON.stringify(settings)} onChange={e=>{ try{ setSettings(JSON.parse(e.target.value||'{}')) } catch{} }} />
      <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={save}>Save settings</button>
    </div>
  )
}


