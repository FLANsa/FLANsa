import React, { useState, useEffect } from 'react'
import { Users, UserPlus, UserCheck, UserX, Shield, BarChart3, Database, Activity, Eye, Trash2, Lock, Unlock } from 'lucide-react'
import { authService } from '../lib/authService'
import { getAuth } from 'firebase/auth'
import { userService, tenantService } from '../lib/firebaseServices'
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface User {
  id: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'cashier'
  tenantId: string
  tenantName?: string
  isActive: boolean
  createdAt: any
  lastLogin?: any
}

const AdminPanel: React.FC = () => {
  const currentUser = authService.getCurrentUser()
  const fbEmail = getAuth().currentUser?.email?.toLowerCase()
  const isOwner = currentUser?.role === 'owner'
  const isSuperAdminEmail = fbEmail === 'admin@qayd.com'
  if (!isOwner && !isSuperAdminEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow-sm border rounded-lg p-6 text-center">
          <p className="text-red-600 arabic font-medium">ليس لديك صلاحية للوصول إلى بوابة المشرف</p>
        </div>
      </div>
    )
  }
  const [activeTab, setActiveTab] = useState<'users' | 'tenants' | 'stats' | 'logs'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAddTenantModal, setShowAddTenantModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null)
  const [selectedTenantStats, setSelectedTenantStats] = useState<{ users: number; orders: number; revenue: number }>({ users: 0, orders: 0, revenue: 0 })
  
  // New user form
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'owner' | 'admin' | 'manager' | 'cashier'>('cashier')
  const [newUserTenantId, setNewUserTenantId] = useState('')
  // New tenant form state
  const [newTenant, setNewTenant] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    address: '',
    addressAr: '',
    vatNumber: '',
    crNumber: ''
  })
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalTenants: 0,
    activeTenants: 0,
    totalOrders: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    loadData()
  }, [activeTab])
  
  useEffect(() => {
    // Load tenants when add user modal opens
    if (showAddUserModal && tenants.length === 0) {
      loadTenants()
    }
  }, [showAddUserModal])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'users') {
        await loadUsers()
      } else if (activeTab === 'tenants') {
        await loadTenants()
      } else if (activeTab === 'stats') {
        await loadStats()
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'))
      
      const tenantsMap = new Map()
      tenantsSnapshot.docs.forEach(doc => {
        tenantsMap.set(doc.id, doc.data().name || doc.data().nameAr)
      })

      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tenantName: tenantsMap.get(doc.data().tenantId)
      })) as User[]

      setUsers(usersList)
      console.log('Loaded users:', usersList.length)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadTenants = async () => {
    try {
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'))
      const tenantsList = tenantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTenants(tenantsList)
      console.log('Loaded tenants:', tenantsList.length)
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }
  const openTenantDetails = async (tenant: any) => {
    setSelectedTenant(tenant)
    try {
      const usersQ = query(collection(db, 'users'), where('tenantId', '==', tenant.id))
      const usersSnap = await getDocs(usersQ)
      const usersCount = usersSnap.size

      const ordersQ = query(collection(db, 'orders'), where('tenantId', '==', tenant.id))
      const ordersSnap = await getDocs(ordersQ)
      const ordersCount = ordersSnap.size
      const revenue = ordersSnap.docs.reduce((sum, d) => sum + (d.data().total || 0), 0)

      setSelectedTenantStats({ users: usersCount, orders: ordersCount, revenue })
    } catch (e) {
      console.error('Failed loading tenant details:', e)
      setSelectedTenantStats({ users: 0, orders: 0, revenue: 0 })
    }
  }
  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.nameAr || !newTenant.email) {
      alert('يرجى تعبئة الاسم العربي والإنجليزي والبريد الإلكتروني')
      return
    }
    try {
      setLoading(true)
      const tenantPayload = {
        ...newTenant,
        subscriptionPlan: 'basic' as const,
        subscriptionStatus: 'active' as const,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      }
      const id = await tenantService.createTenant(tenantPayload)
      console.log('Tenant created with id:', id)
      setShowAddTenantModal(false)
      setNewTenant({ name: '', nameAr: '', email: '', phone: '', address: '', addressAr: '', vatNumber: '', crNumber: '' })
      await loadTenants()
      alert('✅ تم إضافة المتجر بنجاح')
    } catch (error: any) {
      console.error('Error creating tenant:', error)
      alert('❌ فشل في إضافة المتجر: ' + (error.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Load all users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const totalUsers = usersSnapshot.size
      const activeUsers = usersSnapshot.docs.filter(doc => doc.data().isActive !== false).length
      
      // Load all tenants
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'))
      const totalTenants = tenantsSnapshot.size
      const activeTenants = tenantsSnapshot.docs.filter(doc => doc.data().isActive !== false).length
      
      // Load all orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'))
      const totalOrders = ordersSnapshot.size
      const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().total || 0)
      }, 0)

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalTenants,
        activeTenants,
        totalOrders,
        totalRevenue
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserTenantId) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      setLoading(true)
      
      // Create user in Firebase
      const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('user_' + Date.now())
      await userService.createUser({
        id: generatedId,
        name: newUserEmail.split('@')[0] || 'مستخدم',
        email: newUserEmail,
        role: newUserRole,
        tenantId: newUserTenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      alert('✅ تم إضافة المستخدم بنجاح!')
      setShowAddUserModal(false)
      resetForm()
      await loadUsers()
    } catch (error: any) {
      console.error('Error adding user:', error)
      alert('❌ فشل في إضافة المستخدم: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      })

      alert(`✅ تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح!`)
      await loadUsers()
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      alert('❌ فشل في تحديث حالة المستخدم: ' + error.message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'users', userId))
      alert('✅ تم حذف المستخدم بنجاح!')
      await loadUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert('❌ فشل في حذف المستخدم: ' + error.message)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      })

      alert('✅ تم تحديث صلاحيات المستخدم بنجاح!')
      await loadUsers()
    } catch (error: any) {
      console.error('Error changing role:', error)
      alert('❌ فشل في تحديث الصلاحيات: ' + error.message)
    }
  }

  const resetForm = () => {
    setNewUserEmail('')
    setNewUserPassword('')
    setNewUserRole('cashier')
    setNewUserTenantId('')
  }

  const getRoleBadge = (role: 'owner' | 'admin' | 'manager' | 'cashier') => {
    const colors: Record<'owner' | 'admin' | 'manager' | 'cashier', string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      cashier: 'bg-gray-100 text-gray-800'
    }
    const labels: Record<'owner' | 'admin' | 'manager' | 'cashier', string> = {
      owner: 'مالك',
      admin: 'مدير',
      manager: 'مشرف',
      cashier: 'كاشير'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || colors.cashier}`}>
        {labels[role] || role}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 arabic">بوابة المشرف</h1>
              <p className="text-gray-600 mt-1 arabic">التحكم الكامل بالنظام والحسابات</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b">
            {[
              { id: 'users', label: 'المستخدمين', icon: Users },
              { id: 'tenants', label: 'المتاجر', icon: Database },
              { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
              { id: 'logs', label: 'السجلات', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="arabic font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* Actions Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{users.length}</span> مستخدم
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">{users.filter(u => u.isActive !== false).length}</span> نشط
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-red-600">{users.filter(u => u.isActive === false).length}</span> معطل
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
                <span className="arabic">إضافة مستخدم</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">البريد الإلكتروني</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الصلاحية</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">المتجر</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">تاريخ الإنشاء</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider arabic">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500 arabic">لا توجد مستخدمين</td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="owner">مالك</option>
                            <option value="admin">مدير</option>
                            <option value="manager">مشرف</option>
                            <option value="cashier">كاشير</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 arabic">{user.tenantName || user.tenantId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isActive !== false ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <UserCheck className="w-4 h-4" />
                              <span className="text-sm arabic">نشط</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <UserX className="w-4 h-4" />
                              <span className="text-sm arabic">معطل</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.isActive !== false)}
                              className={`p-2 rounded-lg ${
                                user.isActive !== false
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                              title={user.isActive !== false ? 'تعطيل' : 'تفعيل'}
                            >
                              {user.isActive !== false ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === 'tenants' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold arabic">المتاجر المسجلة</h2>
                <button onClick={() => setShowAddTenantModal(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 arabic">إضافة متجر</button>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenants.map(tenant => (
                    <div key={tenant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTenantDetails(tenant)}>
                      <div className="flex justify بين items-start mb-2">
                        <div>
                          <h3 className="font-bold arabic">{tenant.nameAr || tenant.name}</h3>
                          <p className="text-sm text-gray-600">{tenant.name}</p>
                        </div>
                        {tenant.isActive !== false ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs arabic">نشط</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs arabic">معطل</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>VAT: {tenant.vatNumber || 'N/A'}</div>
                        <div>CR: {tenant.crNumber || 'N/A'}</div>
                        <div className="arabic">الهاتف: {tenant.phone || 'N/A'}</div>
                        <div className="arabic">البريد: {tenant.email || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[
                { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'blue' },
                { label: 'المستخدمين النشطين', value: stats.activeUsers, icon: UserCheck, color: 'green' },
                { label: 'إجمالي المتاجر', value: stats.totalTenants, icon: Database, color: 'purple' },
                { label: 'إجمالي الطلبات', value: stats.totalOrders, icon: BarChart3, color: 'orange' }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 arabic">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-12 h-12 text-${stat.color}-600`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 arabic">الإيرادات الإجمالية</h2>
              <p className="text-4xl font-bold text-green-600">{stats.totalRevenue.toFixed(2)} SAR</p>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 arabic">سجلات النظام</h2>
            <p className="text-gray-600 arabic">قريباً - سيتم عرض سجلات النشاطات هنا</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6 arabic">إضافة مستخدم جديد</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 arabic">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 arabic">كلمة المرور</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 arabic">الصلاحية</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cashier">كاشير</option>
                  <option value="manager">مشرف</option>
                  <option value="admin">مدير</option>
                  <option value="owner">مالك</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 arabic">المتجر</label>
                <select
                  value={newUserTenantId}
                  onChange={(e) => setNewUserTenantId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المتجر</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.nameAr || tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddUser}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 arabic"
              >
                {loading ? 'جاري الإضافة...' : 'إضافة'}
              </button>
              <button
                onClick={() => {
                  setShowAddUserModal(false)
                  resetForm()
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 arabic"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddTenantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold mb-6 arabic">إضافة متجر جديد</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 english">Store Name (EN)</label>
                <input value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 arabic">اسم المتجر (عربي)</label>
                <input value={newTenant.nameAr} onChange={(e) => setNewTenant({ ...newTenant, nameAr: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 arabic">البريد الإلكتروني</label>
                <input type="email" value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 arabic">رقم الهاتف</label>
                <input value={newTenant.phone} onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 english">Address (EN)</label>
                <input value={newTenant.address} onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 arabic">العنوان (عربي)</label>
                <input value={newTenant.addressAr} onChange={(e) => setNewTenant({ ...newTenant, addressAr: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 english">VAT Number</label>
                <input value={newTenant.vatNumber} onChange={(e) => setNewTenant({ ...newTenant, vatNumber: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 english">CR Number</label>
                <input value={newTenant.crNumber} onChange={(e) => setNewTenant({ ...newTenant, crNumber: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={handleCreateTenant} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 arabic">{loading ? 'جاري الإضافة...' : 'إضافة المتجر'}</button>
              <button onClick={() => setShowAddTenantModal(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 arabic">إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold mb-6 arabic">تفاصيل المتجر</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="arabic"><span className="text-gray-500">الاسم:</span> {selectedTenant.nameAr || selectedTenant.name}</div>
              <div><span className="text-gray-500">Email:</span> {selectedTenant.email || 'N/A'}</div>
              <div className="arabic"><span className="text-gray-500">الهاتف:</span> {selectedTenant.phone || 'N/A'}</div>
              <div className="arabic"><span className="text-gray-500">VAT:</span> {selectedTenant.vatNumber || 'N/A'}</div>
              <div className="arabic"><span className="text-gray-500">CR:</span> {selectedTenant.crNumber || 'N/A'}</div>
              <div className="arabic"><span className="text-gray-500">الحالة:</span> {selectedTenant.isActive !== false ? 'نشط' : 'معطل'}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{selectedTenantStats.users}</div>
                <div className="text-xs text-gray-600 arabic">مستخدمين</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{selectedTenantStats.orders}</div>
                <div className="text-xs text-gray-600 arabic">طلبات</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{selectedTenantStats.revenue.toFixed(0)}</div>
                <div className="text-xs text-gray-600 arabic">التحصيل (SAR)</div>
              </div>
            </div>
            <button onClick={() => setSelectedTenant(null)} className="w-full mt-6 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 arabic">إغلاق</button>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6 arabic">تفاصيل المستخدم</h2>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 arabic">البريد الإلكتروني:</span>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 arabic">الصلاحية:</span>
                <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600 arabic">المتجر:</span>
                <p className="font-medium arabic">{selectedUser.tenantName || selectedUser.tenantId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 arabic">الحالة:</span>
                <p className={`font-medium ${selectedUser.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedUser.isActive !== false ? 'نشط' : 'معطل'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 arabic">تاريخ الإنشاء:</span>
                <p className="font-medium">{selectedUser.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'N/A'}</p>
              </div>
              {selectedUser.lastLogin && (
                <div>
                  <span className="text-sm text-gray-600 arabic">آخر تسجيل دخول:</span>
                  <p className="font-medium">{selectedUser.lastLogin?.toDate?.()?.toLocaleDateString('ar-SA')}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full mt-6 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 arabic"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
