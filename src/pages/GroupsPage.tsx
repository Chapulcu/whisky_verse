import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search, 
  Crown, 
  MapPin, 
  Calendar,
  Settings,
  UserPlus,
  Eye,
  Lock,
  Trash2,
  Edit
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Group {
  id: number
  name: string
  description: string | null
  created_by: string
  is_public: boolean
  member_limit: number
  created_at: string
  member_count?: number
  is_member?: boolean
  creator_name?: string
}

export function GroupsPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover')
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    is_public: true,
    member_limit: 50
  })
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_public: true,
    member_limit: 50
  })

  const loadGroups = async () => {
    try {
      // Load public groups
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get member counts and creator names
      const groupsWithDetails = await Promise.all(
        (groupsData || []).map(async (group) => {
          // Get member count
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          // Check if user is member
          const { data: memberData } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.id)
            .eq('user_id', user?.id || '')
            .maybeSingle()

          // Get creator name
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', group.created_by)
            .maybeSingle()

          return {
            ...group,
            member_count: count || 0,
            is_member: !!memberData,
            creator_name: creatorData?.full_name || 'Bilinmeyen'
          }
        })
      )

      setGroups(groupsWithDetails)
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error(t('groupsPage.toasts.groupsLoadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadMyGroups = async () => {
    if (!user) return

    try {
      // Load groups created by user
      const { data: myGroupsData, error } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get member counts
      const myGroupsWithDetails = await Promise.all(
        (myGroupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          return {
            ...group,
            member_count: count || 0,
            is_member: true,
            creator_name: profile?.full_name || 'Ben'
          }
        })
      )

      setMyGroups(myGroupsWithDetails)
    } catch (error) {
      console.error('Error loading my groups:', error)
    }
  }

  useEffect(() => {
    loadGroups()
    loadMyGroups()
  }, [])

  // Redirect if not VIP
  if (!user || (profile?.role !== 'vip' && profile?.role !== 'admin')) {
    return <Navigate to="/upgrade" replace />
  }

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: createForm.name,
          description: createForm.description || null,
          created_by: user.id,
          is_public: createForm.is_public,
          member_limit: createForm.member_limit
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin'
        })

      if (memberError) throw memberError

      toast.success(t('groupsPage.toasts.groupCreated'))
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '', is_public: true, member_limit: 50 })
      loadGroups()
      loadMyGroups()
    } catch (error: any) {
      console.error('Error creating group:', error)
      toast.error(error.message || t('groupsPage.toasts.groupCreateError'))
    }
  }

  const joinGroup = async (groupId: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        })

      if (error) throw error

      toast.success(t('groupsPage.toasts.joinedGroup'))
      loadGroups()
    } catch (error: any) {
      console.error('Error joining group:', error)
      if (error.code === '23505') {
        toast.error(t('groupsPage.toasts.alreadyMember'))
      } else {
        toast.error(t('groupsPage.toasts.joinError'))
      }
    }
  }

  const leaveGroup = async (groupId: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success(t('groupsPage.toasts.leftGroup'))
      loadGroups()
    } catch (error) {
      console.error('Error leaving group:', error)
      toast.error(t('groupsPage.toasts.leaveError'))
    }
  }

  const deleteGroup = async (groupId: number) => {
    if (!user) return
    
    if (!confirm(t('groupsPage.toasts.deleteConfirm'))) return

    try {
      // Delete group members first
      const { error: membersError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)

      if (membersError) throw membersError

      // Delete group
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('created_by', user.id)

      if (error) throw error

      toast.success('Grup silindi')
      loadGroups()
      loadMyGroups()
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error(t('groupsPage.toasts.deleteError'))
    }
  }

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading-spinner w-8 h-8 text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-cyber font-bold text-gradient mb-4 flex items-center justify-center gap-3">
          <Users className="w-10 h-10" />
          {t('groupsPage.title')}
          <Crown className="w-8 h-8 text-yellow-500" />
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t('groupsPage.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'discover'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {t('groupsPage.tabs.discover')}
            </button>
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'my-groups'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {t('groupsPage.tabs.myGroups')} ({myGroups.length})
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('groupsPage.createButton')}
          </button>
        </div>

        {/* Search */}
        {activeTab === 'discover' && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('groupsPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-10"
            />
          </div>
        )}
      </div>

      {/* Groups Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === 'discover' ? filteredGroups : myGroups).map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass-card p-6 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:border-purple-500/50"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {group.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {group.creator_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {group.is_public ? (
                  <div title={t('groupsPage.publicTooltip')}>
                    <Eye className="w-4 h-4 text-green-500" />
                  </div>
                ) : (
                  <div title={t('groupsPage.privateTooltip')}>
                    <Lock className="w-4 h-4 text-orange-500" />
                  </div>
                )}
                
                {activeTab === 'my-groups' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        console.log('🛠️ Group manage button clicked:', group.id, group.name)
                        setEditingGroup(group)
                        setEditForm({
                          name: group.name,
                          description: group.description || '',
                          is_public: group.is_public,
                          member_limit: group.member_limit
                        })
                        setShowEditModal(true)
                      }}
                      className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                      title="Grubu Yönet"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-1 text-red-500 hover:text-red-600 transition-colors"
                      title="Grubu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {group.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                {group.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{group.member_count}/{group.member_limit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(group.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {activeTab === 'discover' && (
              <div className="flex gap-2">
                {group.is_member ? (
                  <button
                    onClick={() => leaveGroup(group.id)}
                    className="btn-glass flex-1 text-red-600 dark:text-red-400"
                  >
                    {t('groupsPage.leaveButton')}
                  </button>
                ) : (
                  <button
                    onClick={() => joinGroup(group.id)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={group.member_count >= group.member_limit}
                  >
                    <UserPlus className="w-4 h-4" />
                    {group.member_count >= group.member_limit ? t('groupsPage.fullLabel') : t('groupsPage.joinButton')}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {((activeTab === 'discover' && filteredGroups.length === 0) || 
        (activeTab === 'my-groups' && myGroups.length === 0)) && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
            {activeTab === 'discover' ? t('groupsPage.emptyStates.noGroupsFound') : t('groupsPage.emptyStates.noGroupsCreated')}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {activeTab === 'discover' 
              ? t('groupsPage.emptyStates.tryDifferentSearch')
              : t('groupsPage.emptyStates.createFirstGroup')
            }
          </p>
          {activeTab === 'my-groups' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('groupsPage.createButton')}
            </button>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-strong max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gradient">{t('groupsPage.createModal.title')}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('groupsPage.createModal.groupName')} *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-glass"
                  placeholder={t('groupsPage.createModal.groupNamePlaceholder')}
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('groupsPage.createModal.description')}
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-glass min-h-[100px] resize-none"
                  placeholder={t('groupsPage.createModal.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('groupsPage.createModal.memberLimit')}
                </label>
                <input
                  type="number"
                  value={createForm.member_limit}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, member_limit: parseInt(e.target.value) || 50 }))}
                  className="input-glass"
                  min={2}
                  max={1000}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={createForm.is_public}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_public" className="text-sm text-slate-700 dark:text-slate-300">
                  {t('groupsPage.createModal.publicGroup')}
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-glass flex-1"
                >
                  {t('groupsPage.createModal.cancelButton')}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={!createForm.name.trim()}
                >
                  {t('groupsPage.createModal.createButton')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-strong max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gradient">Grubu Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingGroup(null)
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!editingGroup) return

              try {
                const { error } = await supabase
                  .from('groups')
                  .update({
                    name: editForm.name,
                    description: editForm.description || null,
                    is_public: editForm.is_public,
                    member_limit: editForm.member_limit
                  })
                  .eq('id', editingGroup.id)

                if (error) throw error

                toast.success('Grup başarıyla güncellendi!')
                setShowEditModal(false)
                setEditingGroup(null)
                loadMyGroups()
              } catch (error: any) {
                console.error('Error updating group:', error)
                toast.error(error.message || 'Grup güncellenirken hata oluştu')
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grup Adı *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-glass"
                  placeholder="Grup adını girin"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-glass"
                  rows={3}
                  placeholder="Grup açıklamasını girin"
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Görünürlük
                  </label>
                  <select
                    value={editForm.is_public ? 'public' : 'private'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, is_public: e.target.value === 'public' }))}
                    className="input-glass"
                  >
                    <option value="public">Herkese Açık</option>
                    <option value="private">Özel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Üye Limiti
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={editForm.member_limit}
                    onChange={(e) => setEditForm(prev => ({ ...prev, member_limit: parseInt(e.target.value) || 50 }))}
                    className="input-glass"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingGroup(null)
                  }}
                  className="btn-glass flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={!editForm.name.trim()}
                >
                  Güncelle
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}