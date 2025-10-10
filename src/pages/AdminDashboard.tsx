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

  async function addUser() {
    try {
      setBusy(true)
      await adminApi.createUser({ email, tenantId, name, role })
      setEmail(''); setTenantId(''); setName(''); setRole('cashier')
    } catch (e: any) { onError(e.message) } finally { setBusy(false) }
  }
  async function test() { try { await adminApi.testAuth() } catch (e:any){ onError(e.message) } }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 max-w-xl">
        <input className="border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2" placeholder="Tenant ID" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
        <input className="border p-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <select className="border p-2" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="owner">owner</option>
          <option value="admin">admin</option>
          <option value="manager">manager</option>
          <option value="cashier">cashier</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button className="bg-green-600 text-white px-3 py-1 rounded" disabled={busy} onClick={addUser}>Add user</button>
        <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={test}>Quick test</button>
      </div>
    </div>
  )
}

function TenantsTab({ onError }: { onError: (e: string)=>void }) {
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [tenants, setTenants] = useState<any[]>([])
  async function createTenant(){
    try {
      await adminApi.createTenant({ name, nameAr, isActive: true })
      setName(''); setNameAr('');
      const list = await adminApi.listTenants()
      setTenants(list.tenants||[])
    } catch (e:any){ onError(e.message) }
  }
  useEffect(()=>{ (async()=>{ try{ const list = await adminApi.listTenants(); setTenants(list.tenants||[]) } catch(e:any){ onError(e.message) } })() },[])
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 max-w-xl">
        <input className="border p-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2" placeholder="Name (AR)" value={nameAr} onChange={e=>setNameAr(e.target.value)} />
      </div>
      <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={createTenant}>Create tenant</button>
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


