import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { AddWhiskyModal } from '@/components/admin/AddWhiskyModal'
import { 
  Users, 
  Wine, 
  BarChart3, 
  Shield, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Whisky {
  id: string
  name: string
  type: string
  country: string
  region: string
  alcohol_percentage: number
  color: string
  aroma: string
  taste: string
  finish: string
  description: string
  image_url?: string
  created_at: string
}

interface DashboardStats {
  totalUsers: number
  totalWhiskies: number
  vipUsers: number
  activeUsers: number
}

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [whiskies, setWhiskies] = useState<Whisky[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddWhiskyModal, setShowAddWhiskyModal] = useState(false)

  // Check admin access
  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      window.location.href = '/'
      return
    }
    loadDashboardData()
  }, [user, profile])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load statistics
      const [usersResponse, whiskiesResponse] = await Promise.all([
        supabase.from('profiles').select('id, role, created_at, email, full_name'),
        supabase.from('whiskies').select('*')
      ])

      if (usersResponse.data && whiskiesResponse.data) {
        const usersData = usersResponse.data
        const whiskiesData = whiskiesResponse.data

        setStats({
          totalUsers: usersData.length,
          totalWhiskies: whiskiesData.length,
          vipUsers: usersData.filter(u => u.role === 'vip').length,
          activeUsers: usersData.filter(u => {
            const createdDate = new Date(u.created_at)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return createdDate > weekAgo
          }).length
        })

        setWhiskies(whiskiesData)
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWhisky = async (id: string) => {
    if (confirm('Bu viski silinecek. Emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('whiskies')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        setWhiskies(prev => prev.filter(w => w.id !== id))
        alert('Viski başarıyla silindi.')
      } catch (error) {
        console.error('Error deleting whisky:', error)
        alert('Viski silinirken hata oluştu.')
      }
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'vip' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
      
      if (error) throw error
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      alert('Kullanıcı rolü güncellendi.')
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Rol güncellenirken hata oluştu.')
    }
  }

  const handleWhiskyAdded = () => {
    // Reload whisky data
    loadDashboardData()
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('unauthorizedAccess')}</h1>
          <p className="text-text-secondary">{t('adminAccessRequired')}</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'whiskies', label: 'Viski Yönetimi', icon: Wine },
    { id: 'users', label: 'Kullanıcı Yönetimi', icon: Users },
    { id: 'settings', label: 'Sistem Ayarları', icon: Settings }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="glass-strong rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Admin Panel</h1>
              <p className="text-text-secondary">WhiskyVerse Yönetim Paneli</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-strong rounded-2xl p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                    : 'hover:bg-white/5 text-text-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Toplam Kullanıcı</p>
                    <p className="text-2xl font-bold text-gradient">{stats?.totalUsers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary-500" />
                </div>
              </div>
              
              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Toplam Viski</p>
                    <p className="text-2xl font-bold text-gradient">{stats?.totalWhiskies || 0}</p>
                  </div>
                  <Wine className="w-8 h-8 text-primary-500" />
                </div>
              </div>
              
              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">VIP Kullanıcılar</p>
                    <p className="text-2xl font-bold text-gradient">{stats?.vipUsers || 0}</p>
                  </div>
                  <Shield className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Son 7 Gün</p>
                    <p className="text-2xl font-bold text-gradient">{stats?.activeUsers || 0}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whiskies' && (
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">Viski Yönetimi</h2>
              <button 
                onClick={() => setShowAddWhiskyModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Yeni Viski Ekle
              </button>
            </div>
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Viski ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            {/* Whiskies List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-text-secondary">Ad</th>
                    <th className="text-left py-3 px-2 text-text-secondary">Tip</th>
                    <th className="text-left py-3 px-2 text-text-secondary">Ülke</th>
                    <th className="text-left py-3 px-2 text-text-secondary">Alkol %</th>
                    <th className="text-left py-3 px-2 text-text-secondary">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {whiskies
                    .filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((whisky) => (
                    <tr key={whisky.id} className="border-b border-white/5">
                      <td className="py-3 px-2 text-text-primary font-medium">{whisky.name}</td>
                      <td className="py-3 px-2 text-text-secondary">{whisky.type}</td>
                      <td className="py-3 px-2 text-text-secondary">{whisky.country}</td>
                      <td className="py-3 px-2 text-text-secondary">{whisky.alcohol_percentage}%</td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          <button className="btn-glass p-2 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteWhisky(whisky.id)}
                            className="btn-glass p-2 rounded-lg hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {whiskies.length === 0 && (
                <div className="text-center py-8">
                  <Wine className="w-12 h-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">Henüz viski eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-strong rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6">Kullanıcı Yönetimi</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-text-secondary">Ad Soyad</th>
                    <th className="text-left py-3 px-2 text-text-secondary">Email</th>
                    <th className="text-left py-3 px-2 text-text-secondary">Rol</th>
                    <th className="text-left py-3 px-2 text-text-secondary">Kayıt Tarihi</th>
                    <th className="text-left py-3 px-2 text-text-secondary">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="py-3 px-2 text-text-primary">{user.full_name || 'Belirtilmemiş'}</td>
                      <td className="py-3 px-2 text-text-secondary">{user.email}</td>
                      <td className="py-3 px-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value as any)}
                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-text-primary"
                        >
                          <option value="user">User</option>
                          <option value="vip">VIP</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-2">
                        <button className="btn-glass px-3 py-1 rounded-lg text-sm">
                          Detaylar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-strong rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6">Sistem Ayarları</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="font-medium text-text-primary mb-2">Veritabanı Durumu</h3>
                <p className="text-text-secondary text-sm">Tüm sistemler normal çalışıyor.</p>
                <div className="flex gap-2 mt-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-500 text-sm">Bağlantı Başarılı</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="font-medium text-text-primary mb-2">Sistem İstatistikleri</h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-text-secondary">Aktif Oturumlar</p>
                    <p className="text-lg font-bold text-primary-500">{users.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Sistem Çalışma Süresi</p>
                    <p className="text-lg font-bold text-primary-500">24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Whisky Modal */}
      <AddWhiskyModal 
        isOpen={showAddWhiskyModal}
        onClose={() => setShowAddWhiskyModal(false)}
        onSuccess={handleWhiskyAdded}
      />
    </div>
  )
}
