import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminOperations } from '@/hooks/useAdminOperations'
import { useDirectWhiskyUpload } from '@/hooks/useDirectWhiskyUpload'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Settings,
  Shield,
  Edit2,
  Trash2,
  UserPlus,
  Crown,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  Save,
  X,
  Wine,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  FileText,
  Image,
  MapPin,
  Percent,
  Users2,
  CalendarDays,
  Clock,
  MapPin as LocationIcon,
  Globe,
  Lock,
  Languages
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { BackgroundManager } from '@/components/admin/BackgroundManager'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { TranslationManagement } from '@/components/admin/TranslationManagement'

interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'user' | 'vip' | 'admin'
  language: 'tr' | 'en'
  created_at: string
  updated_at: string
}

interface Whisky {
  age_years: number | null
  id: number
  name: string
  type: string
  country: string
  region: string | null
  alcohol_percentage: number
  rating: number | null
  color: string | null
  aroma: string | null
  taste: string | null
  finish: string | null
  description: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

interface Group {
  id: string | number // Support both string and numeric IDs
  name: string
  description: string | null
  image_url: string | null
  category?: string | null // Optional - may not exist in all records
  privacy: 'public' | 'private' | 'members_only'
  max_members: number
  created_by: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  member_count?: number
}

interface Event {
  id: string | number // Support both string and numeric IDs
  title: string
  description: string | null
  image_url: string | null
  event_type: string | null
  location: string | null
  virtual_link: string | null
  start_date: string
  end_date: string | null
  max_participants: number
  // price and currency temporarily removed until database schema is fixed
  // price: number
  // currency: string
  group_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  participant_count?: number
  group_name?: string
}

export function AdminPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const { getAllUsers, updateUser, deleteUser, createAdmin, createUser, isLoading } = useAdminOperations()
  // CRITICAL FIX: Always start with empty state - no cache
  const [users, setUsers] = useState<User[]>([])
  const [whiskies, setWhiskies] = useState<Whisky[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'whiskies' | 'groups' | 'events' | 'analytics' | 'background' | 'translations'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedLetter, setSelectedLetter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [editingWhisky, setEditingWhisky] = useState<Whisky | null>(null)
  const [viewingWhisky, setViewingWhisky] = useState<Whisky | null>(null)
  const [isCreatingWhisky, setIsCreatingWhisky] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isWhiskyLoading, setIsWhiskyLoading] = useState(false)
  // const [selectedWhiskies, setSelectedWhiskies] = useState<number[]>([])
  // const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  // const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  // Switch to API-based operations (no more Supabase timeout issues)
  const { createWhiskyWithImage, updateWhisky, deleteWhisky, uploadImageDirect, isUploading } = useDirectWhiskyUpload()
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    full_name: ''
  })
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'user' as 'user' | 'vip' | 'admin',
    language: 'tr' as 'tr' | 'en'
  })
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: 'user' as 'user' | 'vip' | 'admin',
    language: 'tr' as 'tr' | 'en'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showUserPassword, setShowUserPassword] = useState(false)
  const [showUserConfirmPassword, setShowUserConfirmPassword] = useState(false)
  const [whiskyForm, setWhiskyForm] = useState<{
    name: string
    type: string
    country: string
    region: string
    alcohol_percentage: number
    rating: number | null
    age_years: number | null
    color: string
    aroma: string
    taste: string
    finish: string
    description: string
    image_url: string
    selectedImageFile: File | null
  }>({
    name: '',
    type: '',
    country: '',
    region: '',
    alcohol_percentage: 40,
    rating: null,
    age_years: null,
    color: '',
    aroma: '',
    taste: '',
    finish: '',
    description: '',
    image_url: '',
    selectedImageFile: null
  })

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public' as 'public' | 'private' | 'members_only',
    max_members: 50,
    image_url: '',
    selectedImageFile: null as File | null
  })

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: '',
    location: '',
    virtual_link: '',
    start_date: '',
    end_date: '',
    max_participants: 30,
    // price: 0,
    // currency: 'TRY',
    group_id: '',
    image_url: '',
    selectedImageFile: null as File | null
  })

  const loadUsers = async () => {
    try {
      console.log('Loading users...')
      const userData = await getAllUsers()
      setUsers(userData)
      // Cache the data
      // No caching - removed localStorage.setItem
      console.log(`Loaded and cached ${userData.length} users`)
    } catch (error) {
      console.error('Error loading users:', error)
      // Don't clear cache on error, keep existing data
    }
  }

  const loadWhiskies = async () => {
    try {
      console.log('AdminPage: Starting to load whiskies with chunked approach...')
      
      // First, get the total count (bypass cache)
      const { count, error: countError } = await supabase
        .from('whiskies')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', '2020-01-01') // Force cache bypass

      if (countError) {
        console.error('AdminPage: Error getting count:', countError)
        throw countError
      }

      const totalRecords = count || 0
      console.log(`AdminPage: Database reports ${totalRecords} total whiskies`)

      if (totalRecords === 0) {
        setWhiskies([])
        return
      }

      // Load data in chunks to bypass any server limits
      const chunkSize = 1000
      const chunks = Math.ceil(totalRecords / chunkSize)
      let allWhiskies: any[] = []

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize
        const end = start + chunkSize - 1
        
        console.log(`AdminPage: Loading chunk ${i + 1}/${chunks} (records ${start}-${end})`)
        
        const { data, error } = await supabase
          .from('whiskies')
          .select('*')
          .gte('created_at', '2020-01-01') // Force cache bypass
          .range(start, end)
          .order('name')

        if (error) {
          console.error(`AdminPage: Error loading chunk ${i + 1}:`, error)
          throw error
        }

        if (data) {
          allWhiskies = [...allWhiskies, ...data]
          console.log(`AdminPage: Loaded chunk ${i + 1}/${chunks}, total so far: ${allWhiskies.length}`)
        }
      }
      
      console.log(`AdminPage: Successfully loaded ${allWhiskies.length} whiskies total`)
      
      if (allWhiskies.length !== totalRecords) {
        console.warn(`AdminPage: Loaded count (${allWhiskies.length}) doesn't match expected count (${totalRecords})`)
      }
      
      setWhiskies(allWhiskies)
      // Cache the data
      localStorage.setItem('admin_whiskies_cache', JSON.stringify(allWhiskies))
      
    } catch (error) {
      console.error('AdminPage: Error loading whiskies:', error)
      toast.error(t('adminPage.toasts.whiskiesLoadError') + ': ' + (error as any).message)
    }
  }

  const loadGroups = async () => {
    try {
      console.log('AdminPage: Loading groups...')
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('AdminPage: Error loading groups:', error)
        throw error
      }

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
          
          return { ...group, member_count: count || 0 }
        })
      )

      console.log(`AdminPage: Successfully loaded ${groupsWithCounts.length} groups`)
      setGroups(groupsWithCounts)
      // Cache the data
      localStorage.setItem('admin_groups_cache', JSON.stringify(groupsWithCounts))
      
    } catch (error) {
      console.error('AdminPage: Error loading groups:', error)
      toast.error(t('admin.groupsLoadError') + ': ' + (error as any).message)
    }
  }

  const loadEvents = async () => {
    try {
      console.log('AdminPage: Loading events...')
      
      // First check if events table exists
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false }) // Use created_at instead of start_date initially

      if (error) {
        console.error('AdminPage: Error loading events:', error)
        
        // If table doesn't exist, show a helpful message
        if (error.message.includes('relation "events" does not exist')) {
          console.warn('Events table does not exist - creating empty array')
          setEvents([])
          localStorage.setItem('admin_events_cache', JSON.stringify([]))
          toast(t('admin.eventsNotLoading'))
          return
        }
        
        throw error
      }

      // Get participant counts and group names for each event
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
          
          // Get group name if group_id exists
          let groupName = null
          if (event.group_id) {
            const { data: groupData } = await supabase
              .from('groups')
              .select('name')
              .eq('id', event.group_id)
              .single()
            groupName = groupData?.name || null
          }
          
          // Calculate event status based on dates
          const now = new Date()
          const startDate = new Date(event.start_date)
          const endDate = event.end_date ? new Date(event.end_date) : startDate
          
          let status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          if (now < startDate) {
            status = 'upcoming'
          } else if (now >= startDate && now <= endDate) {
            status = 'ongoing'
          } else {
            status = 'completed'
          }
          
          return { 
            ...event, 
            participant_count: count || 0,
            group_name: groupName,
            status
          }
        })
      )

      console.log(`AdminPage: Successfully loaded ${eventsWithCounts.length} events`)
      setEvents(eventsWithCounts)
      // Cache the data
      localStorage.setItem('admin_events_cache', JSON.stringify(eventsWithCounts))
      
    } catch (error) {
      console.error('AdminPage: Error loading events:', error)
      toast.error(t('admin.eventsLoadError') + ': ' + (error as any).message)
    }
  }

  // Clear all cached data
  const clearAllCache = () => {
    localStorage.removeItem('admin_users_cache')
    localStorage.removeItem('admin_whiskies_cache')
    localStorage.removeItem('admin_groups_cache')
    localStorage.removeItem('admin_events_cache')
    setHasLoadedData(false) // Allow data to be reloaded
    console.log('All admin cache cleared')
    toast.success('Cache temizlendi! Sayfa yenileyin.')
  }

  // Test database connection (simplified)
  const testDatabaseConnection = async () => {
    try {
      // Just test basic connection, don't show toast errors
      await supabase.from('groups').select('*', { count: 'exact', head: true })
      await supabase.from('events').select('*', { count: 'exact', head: true })
      console.log('Database connection: OK')
    } catch (error) {
      console.warn('Database connection issue:', error)
    }
  }

  // CRITICAL FIX: Always reload fresh data - disable cache temporarily
  const [hasLoadedData, setHasLoadedData] = useState(false)
  
  // Clear corrupted cache on mount
  useEffect(() => {
    localStorage.removeItem('admin_groups_cache')
    localStorage.removeItem('admin_events_cache')
    localStorage.removeItem('admin_users_cache')
    localStorage.removeItem('admin_whiskies_cache')
    localStorage.removeItem('admin_data_loaded')
  }, [])
  
  // Load data when user and profile are available (only once)
  useEffect(() => {
    console.log('AdminPage: Auth state changed:', { 
      user: user?.email, 
      profile: profile?.role, 
      loading: isLoading,
      hasLoadedData
    })
    
    // Only load data when we have a user, not loading, and haven't loaded yet
    // For admin@whiskyverse.com, we don't require profile to be loaded
    if (user && !isLoading && !hasLoadedData && (profile || user.email === 'admin@whiskyverse.com')) {
      console.log('AdminPage: Auth ready, loading data for the first time...')
      
      setHasLoadedData(true)
      // No caching - removed localStorage.setItem
      
      // Load data without delay to prevent multiple calls
      const loadData = async () => {
        try {
          await Promise.all([
            loadUsers(),
            loadWhiskies(), 
            loadGroups(),
            loadEvents()
          ])
          console.log('AdminPage: All data loaded successfully')
        } catch (error) {
          console.error('AdminPage: Error loading data:', error)
        }
      }
      
      loadData()
    }
  }, [user?.email, profile?.role, isLoading, hasLoadedData])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCountry, selectedType, selectedLetter])

  // Check if user is admin - temporarily disabled for admin access
  // Allow access for admin@whiskyverse.com or if user is logged in
  if (!user || (profile && profile.role !== 'admin' && user.email !== 'admin@whiskyverse.com')) {
    // If user is admin@whiskyverse.com but profile role is not set, allow access
    if (user?.email === 'admin@whiskyverse.com') {
      console.log('Admin user detected, allowing access despite profile role')
    } else {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-xl">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-4 text-red-600">{t('admin.accessDenied')}</h1>
            <p className="text-slate-600 dark:text-slate-400">{t('admin.adminAccessRequired')}</p>
            <p className="text-sm text-slate-500 mt-2">User: {user?.email} | Role: {profile?.role || 'loading...'}</p>
          </div>
        </div>
      )
    }
  }

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit)
    setEditForm({
      full_name: userToEdit.full_name,
      role: userToEdit.role,
      language: userToEdit.language
    })
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    
    if (!editForm.full_name.trim()) {
      toast.error(t('adminPage.toasts.nameRequired'))
      return
    }

    try {
      const updateData: any = {
        full_name: editForm.full_name.trim(),
        role: editForm.role,
        language: editForm.language
      }

      await updateUser(editingUser.id, updateData)
      
      setEditingUser(null)
      await loadUsers()
    } catch (error) {
      // Error already handled in hook
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`${userEmail} ${t('adminPage.toasts.confirmDeleteUser')}`)) {
      return
    }

    try {
      await deleteUser(userId)
      await loadUsers()
    } catch (error) {
      // Error already handled in hook
    }
  }

  const handleCreateAdmin = async () => {
    if (!adminForm.email.trim() || !adminForm.full_name.trim()) {
      toast.error(t('admin.emailAndNameRequired'))
      return
    }

    try {
      await createAdmin({
        email: adminForm.email.trim(),
        password: adminForm.password || undefined,
        full_name: adminForm.full_name.trim()
      })
      
      setIsCreatingAdmin(false)
      setAdminForm({ email: '', password: '', full_name: '' })
      await loadUsers()
    } catch (error) {
      // Error already handled in hook
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.email.trim() || !userForm.full_name.trim()) {
      toast.error(t('admin.emailAndFullNameRequired'))
      return
    }

    if (!userForm.password) {
      toast.error(t('admin.passwordRequired'))
      return
    }

    if (userForm.password !== userForm.confirmPassword) {
      toast.error(t('adminPage.toasts.passwordsMustMatch'))
      return
    }

    if (userForm.password.length < 6) {
      toast.error(t('adminPage.toasts.passwordMinLength'))
      return
    }

    try {
      await createUser({
        email: userForm.email.trim(),
        password: userForm.password,
        full_name: userForm.full_name.trim(),
        role: userForm.role,
        language: userForm.language
      })
      
      setIsCreatingUser(false)
      setUserForm({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'user',
        language: 'tr'
      })
      await loadUsers()
    } catch (error) {
      // Error already handled in hook
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <Settings className="w-3 h-3" />
            {t('admin.administrator')}
          </span>
        )
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <Crown className="w-3 h-3" />
            {t('admin.vipUser')}
          </span>
        )
      default:
        return (
          <span className="bg-slate-500/20 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full text-xs">
            {t('admin.member')}
          </span>
        )
    }
  }

  // Safe number conversion utilities
  const parseNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null
    const parsed = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(parsed) ? null : parsed
  }

  const parsePositiveInteger = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null
    const parsed = typeof value === 'string' ? parseInt(value, 10) : Number(value)
    return isNaN(parsed) || parsed <= 0 ? null : parsed
  }

  const validateWhiskyForm = () => {
    const errors: string[] = []

    if (!whiskyForm.name.trim()) errors.push('Viski adı gerekli')
    if (!whiskyForm.type.trim()) errors.push('Viski tipi gerekli')
    if (!whiskyForm.country.trim()) errors.push('Ülke gerekli')

    // Number validation according to database constraints
    if (whiskyForm.alcohol_percentage < 0 || whiskyForm.alcohol_percentage > 100) {
      errors.push('Alkol oranı 0-100 arasında olmalıdır')
    }

    // Database constraint: rating >= 1.0 AND rating <= 100.0 (or null)
    if (whiskyForm.rating !== null && whiskyForm.rating !== undefined) {
      if (whiskyForm.rating < 1 || whiskyForm.rating > 100) {
        errors.push('Puan 1-100 arasında olmalıdır veya boş bırakılmalıdır')
      }
    }

    // Database constraint: age_years > 0 AND age_years <= 100 (or null)
    if (whiskyForm.age_years !== null && whiskyForm.age_years !== undefined) {
      if (whiskyForm.age_years <= 0 || whiskyForm.age_years > 100) {
        errors.push('Yaş 1-100 arasında olmalıdır veya boş bırakılmalıdır')
      }
    }

    return errors
  }

  const handleCreateWhisky = async () => {
    console.log('🚀 handleCreateWhisky started', { whiskyForm })

    const validationErrors = validateWhiskyForm()
    if (validationErrors.length > 0) {
      console.log('❌ Validation errors:', validationErrors)
      toast.error('Form hatası: ' + validationErrors.join(', '))
      return
    }

    console.log('✅ Validation passed, starting creation...')
    setIsWhiskyLoading(true)

    try {
      // Prepare whisky data
      const whiskyData = {
        name: whiskyForm.name.trim(),
        type: whiskyForm.type.trim(),
        country: whiskyForm.country.trim(),
        region: whiskyForm.region.trim() || undefined,
        alcohol_percentage: parseNumber(whiskyForm.alcohol_percentage) || 40,
        rating: whiskyForm.rating ? parseInt(whiskyForm.rating.toString()) : undefined,
        age_years: parsePositiveInteger(whiskyForm.age_years) || undefined,
        color: whiskyForm.color.trim() || undefined,
        aroma: whiskyForm.aroma.trim() || undefined,
        taste: whiskyForm.taste.trim() || undefined,
        finish: whiskyForm.finish.trim() || undefined,
        description: whiskyForm.description.trim() || undefined
      }

      console.log('📊 Creating whisky with data:', whiskyData)
      console.log('📁 Image file:', whiskyForm.selectedImageFile?.name || 'none')

      // Use the new hook to create whisky with image
      const result = await createWhiskyWithImage(
        whiskyData,
        whiskyForm.selectedImageFile || undefined
      )

      console.log('✅ Whisky created successfully:', result)

      // Reset form (modal will close in finally block)
      setWhiskyForm({
        name: '',
        type: '',
        country: '',
        region: '',
        alcohol_percentage: 40,
        rating: null,
        age_years: null,
        color: '',
        aroma: '',
        taste: '',
        finish: '',
        description: '',
        image_url: '',
        selectedImageFile: null
      })

      // Reload whiskies list
      await loadWhiskies()

    } catch (error: any) {
      console.error('❌ Error creating whisky:', error)
      toast.error('Viski oluşturma hatası: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setIsWhiskyLoading(false)
      setIsCreatingWhisky(false)
    }
  }

  const handleEditWhisky = (whisky: Whisky) => {
    // Find the latest version of this whisky from state
    const currentWhisky = whiskies.find(w => w.id === whisky.id) || whisky
    console.log('🔧 Opening edit modal for whisky:', currentWhisky.id, currentWhisky.name)
    console.log('📊 Using latest data:', currentWhisky.updated_at)

    // Reset loading state when opening modal
    setIsWhiskyLoading(false)
    setEditingWhisky(currentWhisky)
    setWhiskyForm({
      name: currentWhisky.name,
      type: currentWhisky.type,
      country: currentWhisky.country,
      region: currentWhisky.region || '',
      alcohol_percentage: currentWhisky.alcohol_percentage,
      rating: currentWhisky.rating,
      age_years: currentWhisky.age_years || null,
      color: currentWhisky.color || '',
      aroma: currentWhisky.aroma || '',
      taste: currentWhisky.taste || '',
      finish: currentWhisky.finish || '',
      description: currentWhisky.description || '',
      image_url: currentWhisky.image_url || '',
      selectedImageFile: null
    })
  }

  const handleViewWhisky = (whisky: Whisky) => {
    setViewingWhisky(whisky)
  }

  const handleUpdateWhisky = async () => {
    if (!editingWhisky) {
      toast.error('Düzenlenecek viski bulunamadı')
      return
    }

    const validationErrors = validateWhiskyForm()
    if (validationErrors.length > 0) {
      toast.error('Form hatası: ' + validationErrors.join(', '))
      return
    }

    setIsWhiskyLoading(true)

    try {
      // Prepare update data
      const whiskyData = {
        name: whiskyForm.name.trim(),
        type: whiskyForm.type.trim(),
        country: whiskyForm.country.trim(),
        region: whiskyForm.region.trim() || undefined,
        alcohol_percentage: parseNumber(whiskyForm.alcohol_percentage) || 40,
        rating: whiskyForm.rating ? parseInt(whiskyForm.rating.toString()) : undefined,
        age_years: parsePositiveInteger(whiskyForm.age_years) || undefined,
        color: whiskyForm.color.trim() || undefined,
        aroma: whiskyForm.aroma.trim() || undefined,
        taste: whiskyForm.taste.trim() || undefined,
        finish: whiskyForm.finish.trim() || undefined,
        description: whiskyForm.description.trim() || undefined
      }

      console.log('🔄 Updating whisky:', editingWhisky.id, whiskyData)
      console.log('📁 New image file:', whiskyForm.selectedImageFile?.name || 'none')

      // Use API-based update (no more timeout issues!)
      const result = await updateWhisky(
        editingWhisky.id,
        whiskyData,
        whiskyForm.selectedImageFile || undefined
      )

      console.log('✅ Whisky updated successfully:', result)

      // Update the whisky in current state immediately
      if (result.whisky) {
        setWhiskies(prevWhiskies =>
          prevWhiskies.map(w =>
            w.id === editingWhisky.id ? { ...w, ...result.whisky } : w
          )
        )
        console.log('🔄 Updated whisky in state:', result.whisky.id)
      }

      // Reset editing state and form
      setEditingWhisky(null)
      setWhiskyForm({
        name: '',
        type: '',
        country: '',
        region: '',
        alcohol_percentage: 40,
        rating: null,
        age_years: null,
        color: '',
        aroma: '',
        taste: '',
        finish: '',
        description: '',
        image_url: '',
        selectedImageFile: null
      })

      // Also reload whiskies list as backup
      await loadWhiskies()

    } catch (error: any) {
      console.error('❌ Error updating whisky:', error)
      toast.error('Viski güncelleme hatası: ' + (error.message || 'Bilinmeyen hata'))

      // Ensure modal closes even on error
      setEditingWhisky(null)
      setWhiskyForm({
        name: '',
        type: '',
        country: '',
        region: '',
        alcohol_percentage: 40,
        rating: null,
        age_years: null,
        color: '',
        aroma: '',
        taste: '',
        finish: '',
        description: '',
        image_url: '',
        selectedImageFile: null
      })
    } finally {
      setIsWhiskyLoading(false)
    }
  }

  const handleDeleteWhisky = async (whiskyId: number, whiskyName: string) => {
    if (!confirm(`"${whiskyName}" viskisini silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      console.log('🗑️ Deleting whisky:', whiskyId, whiskyName)

      // Use the new hook to delete whisky (it handles user collections automatically)
      await deleteWhisky(whiskyId)

      console.log('✅ Whisky deleted successfully')

      // Reload whiskies list
      await loadWhiskies()

    } catch (error: any) {
      console.error('❌ Error deleting whisky:', error)
      // Error is already shown by the hook via toast
    }
  }

  // Bulk operations for whiskies - TEMPORARILY DISABLED
  /*
  const handleSelectAllWhiskies = () => {
    const currentPageIds = paginatedWhiskies.map(w => w.id)
    if (selectedWhiskies.length === currentPageIds.length && 
        currentPageIds.every(id => selectedWhiskies.includes(id))) {
      setSelectedWhiskies([])
    } else {
      setSelectedWhiskies(currentPageIds)
    }
  }

  const handleSelectWhisky = (whiskyId: number) => {
    setSelectedWhiskies(prev => 
      prev.includes(whiskyId) 
        ? prev.filter(id => id !== whiskyId)
        : [...prev, whiskyId]
    )
  }

  const handleBulkDeleteWhiskies = async () => {
    if (selectedWhiskies.length === 0) {
      toast.error(t('admin.selectWhiskiesToDelete'))
      return
    }

    if (!confirm(`${selectedWhiskies.length} ${t('adminPage.toasts.multipleDeleteConfirm')}`)) {
      return
    }

    setIsBulkDeleting(true)
    try {
      // Delete user_whiskies records first for all selected whiskies
      for (const whiskyId of selectedWhiskies) {
        await supabase
          .from('user_whiskies')
          .delete()
          .eq('whisky_id', whiskyId)
      }

      // Delete whiskies
      const { error } = await supabase
        .from('whiskies')
        .delete()
        .in('id', selectedWhiskies)

      if (error) throw error

      setSelectedWhiskies([])
      await loadWhiskies()
      toast.success(`${selectedWhiskies.length} ${t('admin.whiskiesDeletedSuccess')}`)
    } catch (error: any) {
      console.error('Error bulk deleting whiskies:', error)
      toast.error(t('admin.whiskiesDeleteError') + ': ' + (error.message || 'Unknown error'))
    } finally {
      setIsBulkDeleting(false)
    }
  }
  */

  const getStats = () => {
    const totalUsers = users.length
    const adminCount = users.filter(u => u.role === 'admin').length
    const vipCount = users.filter(u => u.role === 'vip').length
    const regularCount = users.filter(u => u.role === 'user').length
    const totalWhiskies = whiskies.length
    
    return { totalUsers, adminCount, vipCount, regularCount, totalWhiskies }
  }

  // Group CRUD Functions
  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error(t('admin.groupNameRequired'))
      return
    }

    try {
      console.log('Creating group with data:', groupForm)
      
      // Build insert object with minimal fields - only what definitely exists
      const insertData: any = {
        name: groupForm.name.trim(),
        description: groupForm.description.trim() || null,
        created_by: user?.id
        // Skip privacy, max_members for now - might not exist in DB
      }
      
      // Category column doesn't exist in database - skip it for now
      // TODO: Add category column to groups table if needed
      
      console.log('Final insert data:', insertData)
      console.log('🔄 Starting Supabase insert directly...')
      
      // Direct insert without timeout - it's working now!
      console.log('🚀 Attempting direct insert...')
      const { data, error } = await supabase
        .from('groups')
        .insert(insertData)
        .select()

      console.log('📊 Supabase insert result:', { data, error })

      if (error) {
        console.error('❌ Supabase insert error:', error)
        throw error
      }

      console.log('Group created successfully:', data)
      toast.success(t('admin.groupCreatedSuccess'))
      
      // Add new group to state immediately instead of reloading
      if (data && data.length > 0) {
        const newGroupWithCount = { ...data[0], member_count: 0 }
        setGroups(prev => {
          const updated = [newGroupWithCount, ...prev]
          localStorage.setItem('admin_groups_cache', JSON.stringify(updated))
          return updated
        })
      }
      
      setIsCreatingGroup(false)
      setGroupForm({
        name: '',
        description: '',
        category: '',
        privacy: 'public',
        max_members: 50,
        image_url: '',
        selectedImageFile: null
      })
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error(t('admin.groupCreateError') + ': ' + (error as any).message)
      // Always close modal and reset form even on error
      setIsCreatingGroup(false)
      setGroupForm({
        name: '',
        description: '',
        category: '',
        privacy: 'public',
        max_members: 50,
        image_url: '',
        selectedImageFile: null
      })
    }
  }

  const handleEditGroup = (group: Group) => {
    console.log('🏛️ Opening group edit modal for:', group.id, group.name)
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description || '',
      category: group.category || '',
      privacy: group.privacy,
      max_members: group.max_members,
      image_url: group.image_url || '',
      selectedImageFile: null
    })
    console.log('✅ Group edit state set:', group)
  }

  const handleSaveGroup = async () => {
    if (!editingGroup) return
    
    if (!groupForm.name.trim()) {
      toast.error(t('admin.groupNameCannotBeEmpty'))
      return
    }

    try {
      console.log('Updating group:', editingGroup.id, 'with data:', groupForm)
      
      // Build update object with only basic required fields first
      const updateData: any = {
        name: groupForm.name.trim(),
        description: groupForm.description.trim() || null,
        privacy: groupForm.privacy,
        max_members: groupForm.max_members,
        updated_at: new Date().toISOString()
      }
      
      // Only add category if it's provided and not empty
      if (groupForm.category && groupForm.category.trim()) {
        updateData.category = groupForm.category.trim()
      }
      
      console.log('Final update data:', updateData)

      // Use fetch API to bypass session issues
      const updateResponse = await fetch(`https://örnek.supabase.co/rest/v1/groups?id=eq.${editingGroup.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ''
          'apikey': ''      
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...updateData,
          updated_at: new Date().toISOString()
        })
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`)
      }

      const data = await updateResponse.json()
      console.log('✅ Group updated successfully:', data)

      // Update groups state immediately
      if (data && data.length > 0) {
        setGroups(prevGroups =>
          prevGroups.map(g =>
            g.id === editingGroup.id ? { ...g, ...data[0] } : g
          )
        )
      }

      toast.success(t('admin.groupUpdatedSuccess'))
      setEditingGroup(null)
      await loadGroups()
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error(t('admin.groupUpdateError') + ': ' + (error as any).message)
    }
  }

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`"${groupName}" ${t('adminPage.groupManagement.deleteConfirm')}`)) {
      return
    }

    try {
      console.log('Deleting group with ID:', groupId, 'Type:', typeof groupId, 'Length:', groupId?.length)
      console.log('Group name:', groupName)
      
      // SAFETY: Very basic validation - just check if ID exists
      if (!groupId) {
        throw new Error('Grup ID bulunamadı')
      }
      
      // Convert to string if it's a number (some DBs use numeric IDs)
      const safeGroupId = String(groupId)
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', safeGroupId)
        .eq('name', groupName) // Extra safety check

      if (error) {
        console.error('Delete error:', error)
        throw error
      }

      console.log('Group deleted successfully')
      
      // Update local state immediately, don't reload from DB
      setGroups(prevGroups => {
        const filteredGroups = prevGroups.filter(g => String(g.id) !== safeGroupId)
        // Update cache with filtered data
        localStorage.setItem('admin_groups_cache', JSON.stringify(filteredGroups))
        return filteredGroups
      })
      
      toast.success(t('admin.groupDeletedSuccess'))
      
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Grup silinirken hata: ' + (error as any).message)
    }
  }

  // Event CRUD Functions
  const handleCreateEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.start_date) {
      toast.error(t('admin.eventNameAndDateRequired'))
      return
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: eventForm.title.trim(),
          description: eventForm.description.trim() || null,
          event_type: eventForm.event_type.trim() || null,
          location: eventForm.location.trim() || null,
          virtual_link: eventForm.virtual_link.trim() || null,
          start_date: eventForm.start_date,
          end_date: eventForm.end_date || null,
          max_participants: eventForm.max_participants,
          // Temporarily commented out until database schema is updated
          // price: eventForm.price,
          // currency: eventForm.currency,
          group_id: eventForm.group_id || null,
          created_by: user?.id
        }])
        .select()

      if (error) throw error

      toast.success(t('admin.eventCreatedSuccess'))
      
      // Add new event to state immediately instead of reloading
      if (data && data.length > 0) {
        const newEventWithCount = { ...data[0], participant_count: 0, group_name: null }
        setEvents(prev => {
          const updated = [newEventWithCount, ...prev]
          localStorage.setItem('admin_events_cache', JSON.stringify(updated))
          return updated
        })
      }
      
      setIsCreatingEvent(false)
      setEventForm({
        title: '',
        description: '',
        event_type: '',
        location: '',
        virtual_link: '',
        start_date: '',
        end_date: '',
        max_participants: 30,
        // price: 0,
        // currency: 'TRY',
        group_id: '',
        image_url: '',
        selectedImageFile: null
      })
      // No need to reload from DB
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error(t('admin.eventCreateError') + ': ' + (error as any).message)
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type || '',
      location: event.location || '',
      virtual_link: event.virtual_link || '',
      start_date: event.start_date.slice(0, 16), // Format for datetime-local input
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      max_participants: event.max_participants,
      // price: event.price,
      // currency: event.currency,
      group_id: event.group_id || '',
      image_url: event.image_url || '',
      selectedImageFile: null
    })
  }

  const handleSaveEvent = async () => {
    if (!editingEvent) return
    
    if (!eventForm.title.trim() || !eventForm.start_date) {
      toast.error(t('admin.eventNameAndDateCannotBeEmpty'))
      return
    }

    try {
      console.log('🔄 Updating event:', editingEvent.id)

      const updateData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || null,
        event_type: eventForm.event_type.trim() || null,
        location: eventForm.location.trim() || null,
        virtual_link: eventForm.virtual_link.trim() || null,
        start_date: eventForm.start_date,
        end_date: eventForm.end_date || null,
        max_participants: eventForm.max_participants,
        // Temporarily commented out until database schema is updated
        // price: eventForm.price,
        // currency: eventForm.currency,
        group_id: eventForm.group_id || null,
        updated_at: new Date().toISOString()
      }

      // Use fetch API to bypass session issues
      const updateResponse = await fetch(`https://örnek.supabase.co/rest/v1/groups?id=eq.${editingEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ''
          'apikey': ''
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`)
      }

      const data = await updateResponse.json()
      console.log('✅ Event updated successfully:', data)

      // Update events state immediately with returned data
      if (data && data.length > 0) {
        setEvents(prev => {
          const updated = prev.map(e =>
            String(e.id) === String(editingEvent.id)
              ? { ...e, ...data[0], participant_count: e.participant_count || 0 }
              : e
          )
          localStorage.setItem('admin_events_cache', JSON.stringify(updated))
          return updated
        })
      }

      toast.success(t('admin.eventUpdatedSuccess'))
      setEditingEvent(null)
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error(t('admin.eventUpdateError') + ': ' + (error as any).message)
    }
  }

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`"${eventTitle}" ${t('adminPage.eventManagement.deleteConfirm')}`)) {
      return
    }

    try {
      console.log('Deleting event with ID:', eventId, 'Type:', typeof eventId, 'Length:', eventId?.length)
      console.log('Event title:', eventTitle)
      
      // SAFETY: Very basic validation - just check if ID exists
      if (!eventId) {
        throw new Error('Etkinlik ID bulunamadı')
      }
      
      // Convert to string if it's a number (some DBs use numeric IDs)
      const safeEventId = String(eventId)
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', safeEventId)
        .eq('title', eventTitle) // Extra safety check

      if (error) {
        console.error('Delete error:', error)
        throw error
      }

      console.log('Event deleted successfully')
      
      // Update local state immediately, don't reload from DB
      setEvents(prevEvents => {
        const filteredEvents = prevEvents.filter(e => String(e.id) !== safeEventId)
        // Update cache with filtered data
        localStorage.setItem('admin_events_cache', JSON.stringify(filteredEvents))
        return filteredEvents
      })
      
      toast.success(t('admin.eventDeletedSuccess'))
      
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Etkinlik silinirken hata: ' + (error as any).message)
    }
  }

  // Filter whiskies based on search and filters
  const filteredWhiskies = whiskies.filter(whisky => {
    const matchesSearch = whisky.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         whisky.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         whisky.country.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCountry = !selectedCountry || whisky.country === selectedCountry
    const matchesType = !selectedType || whisky.type === selectedType
    const matchesLetter = !selectedLetter || whisky.name.toLowerCase().startsWith(selectedLetter.toLowerCase())

    return matchesSearch && matchesCountry && matchesType && matchesLetter
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredWhiskies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWhiskies = filteredWhiskies.slice(startIndex, endIndex)

  // Get unique countries and types for filters
  const countries = [...new Set(whiskies.map(w => w.country))].sort()
  const types = [...new Set(whiskies.map(w => w.type))].sort()

  // CSV Export Function
  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const csvHeaders = [
        'name',
        'type', 
        'country',
        'region',
        'alcohol_percentage',
        'color',
        'aroma',
        'taste',
        'finish',
        'description',
        'image_url'
      ]

      const csvData = whiskies.map(whisky => [
        `"${(whisky.name || '').replace(/"/g, '""')}"`,
        `"${(whisky.type || '').replace(/"/g, '""')}"`,
        `"${(whisky.country || '').replace(/"/g, '""')}"`,
        `"${(whisky.region || '').replace(/"/g, '""')}"`,
        whisky.alcohol_percentage || 0,
        `"${(whisky.color || '').replace(/"/g, '""')}"`,
        `"${(whisky.aroma || '').replace(/"/g, '""')}"`,
        `"${(whisky.taste || '').replace(/"/g, '""')}"`,
        `"${(whisky.finish || '').replace(/"/g, '""')}"`,
        `"${(whisky.description || '').replace(/"/g, '""')}"`,
        `"${(whisky.image_url || '').replace(/"/g, '""')}"`
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `whiskies_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`${whiskies.length} ${t('admin.csvExportSuccess')}`)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error(t('admin.csvExportError'))
    } finally {
      setIsExporting(false)
    }
  }

  // CSV Import Function
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error(t('admin.selectValidCsvFile'))
      return
    }

    setIsImporting(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          toast.error(t('admin.csvMinimumRowsError'))
          setIsImporting(false)
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const expectedHeaders = ['name', 'type', 'country', 'region', 'alcohol_percentage', 'color', 'aroma', 'taste', 'finish', 'description', 'image_url']
        
        // Validate headers
        const requiredHeaders = ['name', 'type', 'country', 'alcohol_percentage']
        const missingRequired = requiredHeaders.filter(h => !headers.includes(h))
        
        if (missingRequired.length > 0) {
          toast.error(`${t('adminPage.toasts.csvColumnsError')}: ${missingRequired.join(', ')}`)
          setIsImporting(false)
          return
        }

        const dataLines = lines.slice(1)
        const validWhiskies: any[] = []
        const errors: string[] = []

        for (let i = 0; i < dataLines.length; i++) {
          const line = dataLines[i].trim()
          if (!line) continue

          try {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
            const whiskyData: any = {}

            headers.forEach((header, index) => {
              if (expectedHeaders.includes(header)) {
                whiskyData[header] = values[index] || null
              }
            })

            // Validate required fields
            if (!whiskyData.name || !whiskyData.type || !whiskyData.country) {
              errors.push(`Row ${i + 2}: ${t('admin.csvRowRequiredFields')}`)
              continue
            }

            // Convert alcohol percentage to number
            whiskyData.alcohol_percentage = parseFloat(whiskyData.alcohol_percentage) || 0
            if (whiskyData.alcohol_percentage <= 0 || whiskyData.alcohol_percentage > 100) {
              errors.push(`${t('adminPage.toasts.csvInvalidAlcohol', {row: i + 2})}`)
              continue
            }

            // Add metadata
            whiskyData.created_by = user?.id
            whiskyData.created_at = new Date().toISOString()
            whiskyData.updated_at = new Date().toISOString()

            validWhiskies.push(whiskyData)
          } catch (error) {
            errors.push(`${t('adminPage.toasts.csvDataError', {row: i + 2})}`)
          }
        }

        if (validWhiskies.length === 0) {
          toast.error(t('adminPage.toasts.csvNoValidWhiskies'))
          setIsImporting(false)
          return
        }

        // Show confirmation dialog
        const shouldProceed = confirm(
          `${validWhiskies.length} ${t('adminPage.toasts.csvImportConfirm')}${errors.length > 0 ? ` ${errors.length} ${t('admin.csvErrorsIgnored')}` : ''}`
        )

        if (!shouldProceed) {
          setIsImporting(false)
          return
        }

        // Import to database in batches
        const batchSize = 50
        let importedCount = 0
        
        for (let i = 0; i < validWhiskies.length; i += batchSize) {
          const batch = validWhiskies.slice(i, i + batchSize)
          
          const { data, error } = await supabase
            .from('whiskies')
            .insert(batch)
            .select()

          if (error) {
            console.error('Batch import error:', error)
            toast.error(`Batch ${Math.floor(i/batchSize) + 1} ${t('admin.csvBatchImportError')}`)
            continue
          }

          importedCount += data?.length || 0
        }

        await loadWhiskies()
        
        toast.success(
          `✅ ${importedCount} ${t('admin.csvImportSuccess')}${errors.length > 0 ? ` (${errors.length} errors ignored)` : ''}`
        )

        if (errors.length > 0 && errors.length <= 10) {
          console.warn('Import errors:', errors)
        }

      } catch (error) {
        console.error('CSV parsing error:', error)
        toast.error(t('admin.csvParsingError'))
      } finally {
        setIsImporting(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      toast.error(t('admin.fileReadError'))
      setIsImporting(false)
    }

    reader.readAsText(file, 'UTF-8')
  }

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Download CSV template
  const downloadCSVTemplate = () => {
    const headers = [
      'name',
      'type',
      'country', 
      'region',
      'alcohol_percentage',
      'color',
      'aroma',
      'taste',
      'finish',
      'description',
      'image_url'
    ]

    const exampleData = [
      '"Macallan 18"',
      '"Single Malt"',
      `"${t('admin.exampleScotland')}"`,
      '"Speyside"',
      '43.0',
      '"Altın"',
      `"${t('admin.exampleVanilla')}"`,
      '"Bal, badem, hafif baharat"',
      `"${t('admin.exampleLongWarm')}"`,
      '"Premium İskoç viskisi"',
      '"https://example.com/image.jpg"'
    ]

    const csvContent = [
      headers.join(','),
      exampleData.join(',')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'viski_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(t('admin.csvTemplateDownloaded'))
  }

  // Handle image file selection
  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImageFileSelect called')
    const file = event.target.files?.[0]
    console.log('Selected file:', file)
    if (!file) {
      console.log('No file selected')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('admin.selectValidImageFile'))
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('admin.fileSizeLimit'))
      return
    }

    console.log('File is valid, updating form')
    setWhiskyForm(prev => ({ ...prev, selectedImageFile: file, image_url: '' }))
    toast.success(t('admin.imageFileSelected') + ': ' + file.name)
  }

  // Trigger image file input
  const triggerImageInput = () => {
    console.log('triggerImageInput called')
    console.log('imageInputRef.current:', imageInputRef.current)
    
    // Try to find the input by ref first
    if (imageInputRef.current) {
      imageInputRef.current.click()
      return
    }
    
    // Fallback: try to find the input by ID (check which modal is open)
    let fileInput: HTMLInputElement | null = null
    
    if (isCreatingWhisky) {
      fileInput = document.getElementById('whisky-image-upload') as HTMLInputElement
      console.log('Create modal - fallback file input found:', fileInput)
    } else if (editingWhisky) {
      fileInput = document.getElementById('whisky-image-upload-edit') as HTMLInputElement
      console.log('Edit modal - fallback file input found:', fileInput)
    }
    
    if (fileInput) {
      fileInput.click()
    } else {
      console.error('No file input found for current modal state')
      toast.error(t('admin.fileInputNotFound'))
    }
  }

  // Remove selected image
  const removeSelectedImage = () => {
    setWhiskyForm(prev => ({ ...prev, selectedImageFile: null }))
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const stats = getStats()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            {t('admin.adminPanel')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">{t('admin.systemManagementDescription')}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              {t('admin.overview')}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              {t('admin.userManagement')}
            </button>
            <button
              onClick={() => setActiveTab('whiskies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'whiskies'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Wine className="w-4 h-4" />
              {t('admin.whiskyManagement')}
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'groups'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Users2 className="w-4 h-4" />
              {t('admin.groupManagement')}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'events'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              {t('admin.eventManagement')}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'background'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Image className="w-4 h-4" />
              {t('admin.background')}
            </button>
            <button
              onClick={() => setActiveTab('translations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'translations'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Languages className="w-4 h-4" />
              Çeviriler
            </button>
          </div>

          {/* Mobile Navigation - Dropdown */}
          <div className="lg:hidden mb-4">
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none"
              >
                <option value="overview">{t('admin.overview')}</option>
                <option value="users">{t('admin.userManagement')}</option>
                <option value="whiskies">{t('admin.whiskyManagement')}</option>
                <option value="groups">{t('admin.groupManagement')}</option>
                <option value="events">{t('admin.eventManagement')}</option>
                <option value="analytics">Analytics</option>
                <option value="background">{t('admin.background')}</option>
                <option value="translations">Çeviriler</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tablet Navigation - Scrollable */}
          <div className="hidden md:flex lg:hidden overflow-x-auto bg-white/10 backdrop-blur-sm rounded-lg p-1 space-x-1 scrollbar-none"
               style={{
                 scrollbarWidth: 'none', /* Firefox */
                 msOverflowStyle: 'none' /* IE and Edge */
               }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              {t('admin.overview')}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              {t('admin.userManagement')}
            </button>
            <button
              onClick={() => setActiveTab('whiskies')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'whiskies'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Wine className="w-4 h-4" />
              {t('admin.whiskyManagement')}
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Users2 className="w-4 h-4" />
              {t('admin.groupManagement')}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'events'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              {t('admin.eventManagement')}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'background'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Image className="w-4 h-4" />
              {t('admin.background')}
            </button>
            <button
              onClick={() => setActiveTab('translations')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'translations'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Languages className="w-4 h-4" />
              Çeviriler
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('admin.totalUsers')}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('admin.administrator')}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.adminCount}</p>
                  </div>
                  <Settings className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('admin.vipMember')}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.vipCount}</p>
                  </div>
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('admin.standardMember')}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.regularCount}</p>
                  </div>
                  <Shield className="w-8 h-8 text-slate-500" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('admin.totalWhiskies')}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalWhiskies}</p>
                  </div>
                  <Wine className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Analytics Dashboard
              </h2>
              <p className="text-slate-600 dark:text-slate-400">Gelişmiş analitik gösterge paneli ve interaktif grafikler</p>
            </div>
            <AnalyticsDashboard refreshInterval={300000} />
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCreatingUser(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('admin.addUser')}
                </button>
                <button
                  onClick={() => setIsCreatingAdmin(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200"
                >
                  <Crown className="w-4 h-4" />
                  {t('admin.addAdmin')}
                </button>
                
                <button
                  onClick={loadUsers}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  Yenile
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.user')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.role')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.registrationDate')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {userItem.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">{userItem.full_name}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {userItem.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(userItem.role)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-sm">
                            <Calendar className="w-3 h-3" />
                            {new Date(userItem.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditUser(userItem)}
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title={t('admin.edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            
                            {userItem.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Whiskies Tab */}
        {activeTab === 'whiskies' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Actions and Filters */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  onClick={() => setIsCreatingWhisky(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Viski Ekle
                </button>

                
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerFileInput}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isImporting ? 'Import Ediliyor...' : 'CSV Import'}
                  </button>
                  
                  <button
                    onClick={handleExportCSV}
                    disabled={isExporting || whiskies.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isExporting ? 'Export Ediliyor...' : 'CSV Export'}
                  </button>
                </div>
                
                <button
                  onClick={loadWhiskies}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  {isLoading ? t('adminPage.whiskyManagement.loading') : t('adminPage.whiskyManagement.refreshAll')}
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Viski ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full sm:w-64 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                  />
                </div>

                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full sm:w-auto text-slate-900 dark:text-white"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('admin.allCountries')}</option>
                  {countries.map(country => (
                    <option key={country} value={country} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{country}</option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full sm:w-auto text-slate-900 dark:text-white"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('adminPage.whiskyManagement.filters.allTypes')}</option>
                  {types.map(type => (
                    <option key={type} value={type} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alphabetical Filter */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl">
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {t('adminPage.whiskyManagement.filters.alphabetical')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedLetter('')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                      selectedLetter === ''
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t('adminPage.whiskyManagement.filters.all')}
                  </button>
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
                    const count = whiskies.filter(w => w.name.toLowerCase().startsWith(letter.toLowerCase())).length
                    return (
                      <button
                        key={letter}
                        onClick={() => setSelectedLetter(letter)}
                        disabled={count === 0}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 relative ${
                          selectedLetter === letter
                            ? 'bg-amber-500 text-white shadow-lg'
                            : count > 0
                            ? 'bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-400'
                            : 'bg-slate-300/20 text-slate-400 cursor-not-allowed'
                        }`}
                        title={`${count} viski`}
                      >
                        {letter}
                        {count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Results Counter and Pagination Controls */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-800 dark:text-white">{filteredWhiskies.length}</span> {t('adminPage.whiskyManagement.filters.whiskitotalsFound')} 
                    <span className="ml-2 text-xs opacity-60">({t('adminPage.whiskyManagement.filters.totalLoaded')}: {whiskies.length})</span>
                    {filteredWhiskies.length > 0 && (
                      <span className="ml-2">
                        ({startIndex + 1}-{Math.min(endIndex, filteredWhiskies.length)} {t('adminPage.whiskyManagement.filters.between')} {t('adminPage.whiskyManagement.filters.showing')})
                      </span>
                    )}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Sayfa:</span>
                      <select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white"
                      >
                        {Array.from({ length: totalPages }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                      <span className="text-sm text-slate-600 dark:text-slate-400">/ {totalPages}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('adminPage.whiskyManagement.filters.perPage')}</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={t('adminPage.whiskyManagement.previousPage')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const pages = []
                          const maxVisible = 5
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                          const endPage = Math.min(totalPages, startPage + maxVisible - 1)
                          
                          if (endPage - startPage + 1 < maxVisible) {
                            startPage = Math.max(1, endPage - maxVisible + 1)
                          }
                          
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                                  i === currentPage
                                    ? 'bg-amber-500 text-white shadow-lg'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/10'
                                }`}
                              >
                                {i}
                              </button>
                            )
                          }
                          
                          return pages
                        })()}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Sonraki sayfa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CSV Format Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">CSV Format Bilgisi</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p><strong>{t('adminPage.whiskyManagement.importSection.requiredColumns')}</strong> name, type, country, alcohol_percentage</p>
                    <p><strong>{t('adminPage.whiskyManagement.importSection.optionalColumns')}</strong> region, color, aroma, taste, finish, description, image_url</p>
                    <p><strong>Example:</strong> {t('admin.csvExampleNote')}","https://..."
                    </p>
                    <p className="text-blue-600 dark:text-blue-400"><strong>{t('admin.tip')}:</strong> Mevcut veri formatını görmek için önce "CSV Export" butonunu kullanın.</p>
                    <div className="mt-3">
                      <button
                        onClick={downloadCSVTemplate}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-800/70 text-blue-700 dark:text-blue-300 rounded-md text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        {t('adminPage.whiskyManagement.importSection.downloadTemplate')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Whiskies Table */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('adminPage.whiskyManagement.tableHeaders.name')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('adminPage.whiskyManagement.tableHeaders.type')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('adminPage.whiskyManagement.tableHeaders.country')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Alkol %</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('adminPage.whiskyManagement.tableHeaders.creation')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t('adminPage.whiskyManagement.tableHeaders.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {paginatedWhiskies.map((whisky) => (
                      <tr key={whisky.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewWhisky(whisky)}
                              className="flex items-center gap-3 hover:bg-white/5 rounded-lg p-1 transition-colors group"
                              title={t('adminPage.whiskyManagement.viewDetails')}
                            >
                              {whisky.image_url ? (
                                <img
                                  src={whisky.image_url}
                                  alt={whisky.name}
                                  className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                  <Wine className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div className="text-left">
                                <p className="font-medium text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{whisky.name}</p>
                                {whisky.region && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {whisky.region}
                                  </p>
                                )}
                              </div>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            {whisky.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 dark:text-slate-300">{whisky.country}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <Percent className="w-3 h-3" />
                            {whisky.alcohol_percentage}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(whisky.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewWhisky(whisky)}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                              title={t('adminPage.whiskyManagement.viewDetails')}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleEditWhisky(whisky)}
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title={t('admin.edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteWhisky(whisky.id, whisky.name)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {paginatedWhiskies.length === 0 && filteredWhiskies.length === 0 && (
                <div className="text-center py-8">
                  <Wine className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchTerm || selectedCountry || selectedType || selectedLetter
                      ? t('adminPage.whiskyManagement.emptyStates.noMatchingWhiskies')
                      : t('adminPage.whiskyManagement.emptyStates.noWhiskiesYet')}
                  </p>
                </div>
              )}
              
              {paginatedWhiskies.length === 0 && filteredWhiskies.length > 0 && (
                <div className="text-center py-8">
                  <Wine className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {t('adminPage.whiskyManagement.emptyStates.noWhiskiesOnPage')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Edit User Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">{t('adminPage.userManagement.titles.editUser')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Rol
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-white"
                    >
                      <option value="user" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('adminPage.userManagement.options.user')}</option>
                      <option value="vip" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('adminPage.userManagement.options.vipUser')}</option>
                      <option value="admin" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Dil
                    </label>
                    <select
                      value={editForm.language}
                      onChange={(e) => setEditForm(prev => ({ ...prev, language: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-white"
                    >
                      <option value="tr" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('adminPage.userManagement.options.turkish')}</option>
                      <option value="en" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">English</option>
                    </select>
                  </div>

                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    {t('adminPage.whiskyForm.buttons.cancel')}
                  </button>
                  <button
                    onClick={handleSaveUser}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Admin Modal */}
        <AnimatePresence>
          {isCreatingAdmin && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">{t('adminPage.userManagement.titles.addAdmin')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-white"
                      placeholder="admin@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={adminForm.full_name}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-white"
                      placeholder={t('adminPage.userManagement.placeholders.adminUser')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.userManagement.labels.passwordOptional')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminForm.password}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-white"
                        placeholder={t('adminPage.userManagement.placeholders.defaultPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setIsCreatingAdmin(false)
                      setAdminForm({ email: '', password: '', full_name: '' })
                    }}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    {t('adminPage.whiskyForm.buttons.cancel')}
                  </button>
                  <button
                    onClick={handleCreateAdmin}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? t('adminPage.whiskyForm.buttons.creating') : t('adminPage.whiskyForm.buttons.create')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Create User Modal */}
          {isCreatingUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">{t('adminPage.userManagement.titles.addUser')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={userForm.full_name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                      placeholder={t('adminPage.userManagement.placeholders.userName')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Rol
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                    >
                      <option value="user">{t('adminPage.userManagement.options.user')}</option>
                      <option value="vip">VIP</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Dil
                    </label>
                    <select
                      value={userForm.language}
                      onChange={(e) => setUserForm(prev => ({ ...prev, language: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                    >
                      <option value="tr">{t('adminPage.userManagement.options.turkish')}</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.userManagement.labels.password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showUserPassword ? 'text' : 'password'}
                        value={userForm.password}
                        onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                        placeholder="Minimum 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserPassword(!showUserPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.userManagement.labels.confirmPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showUserConfirmPassword ? 'text' : 'password'}
                        value={userForm.confirmPassword}
                        onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                        placeholder={t('adminPage.userManagement.placeholders.confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserConfirmPassword(!showUserConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showUserConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setIsCreatingUser(false)
                      setUserForm({
                        email: '',
                        password: '',
                        confirmPassword: '',
                        full_name: '',
                        role: 'user',
                        language: 'tr'
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    {t('adminPage.whiskyForm.buttons.cancel')}
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? t('adminPage.whiskyForm.buttons.creating') : t('adminPage.whiskyForm.buttons.create')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Whisky Modal */}
        <AnimatePresence>
          {isCreatingWhisky && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Wine className="w-5 h-5 text-amber-500" />
                  Yeni Viski Ekle
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.whiskyName')} *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.name}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder={t('adminPage.whiskyForm.placeholders.whiskyName')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tip *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.type}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder={t('adminPage.whiskyForm.placeholders.type')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.country')} *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.country}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder={t('admin.scotlandPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.region')}
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.region}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder={t('adminPage.whiskyForm.placeholders.region')}
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.alcoholPercentage')} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={whiskyForm.alcohol_percentage}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, alcohol_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Puanlama (1-100)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={whiskyForm.rating || ''}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, rating: e.target.value ? parseFloat(e.target.value) : null }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white"
                      placeholder={t('adminPage.whiskyForm.placeholders.score')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.age')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={whiskyForm.age_years || ''}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, age_years: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white"
                      placeholder={t('adminPage.whiskyForm.placeholders.age')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.color')}
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.color}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder={t('adminPage.whiskyForm.placeholders.color')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.aroma')}
                    </label>
                    <textarea
                      value={whiskyForm.aroma}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, aroma: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      rows={2}
                      placeholder={t('adminPage.whiskyForm.placeholders.aroma')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.taste')}
                    </label>
                    <textarea
                      value={whiskyForm.taste}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, taste: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      rows={2}
                      placeholder={t('adminPage.whiskyForm.placeholders.taste')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.finish')}
                    </label>
                    <textarea
                      value={whiskyForm.finish}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, finish: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      rows={2}
                      placeholder={t('adminPage.whiskyForm.placeholders.finish')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.description')}
                    </label>
                    <textarea
                      value={whiskyForm.description}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      rows={3}
                      placeholder={t('adminPage.whiskyForm.placeholders.description')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.imageUpload')}
                    </label>
                    <div className="space-y-3">
                      {/* Current image preview */}
                      {(whiskyForm.selectedImageFile || whiskyForm.image_url) && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          {whiskyForm.selectedImageFile ? (
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                                <Image className="w-8 h-8 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {t('adminPage.whiskyForm.labels.selectedFile')}: {whiskyForm.selectedImageFile.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {(whiskyForm.selectedImageFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={removeSelectedImage}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : whiskyForm.image_url ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={whiskyForm.image_url}
                                alt="Current whisky image"
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                 {t('adminPage.whiskyForm.labels.currentImage')}: {whiskyForm.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 break-all">
                                  {whiskyForm.image_url.substring(0, 50)}...
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                      
                      {/* Upload options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('File upload button clicked')
                            triggerImageInput()
                          }}
                          disabled={isUploading || uploadingImage}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                          {isUploading || uploadingImage ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {isUploading || uploadingImage ? t('adminPage.whiskyForm.buttons.uploading') : t('adminPage.whiskyForm.buttons.selectFile')}
                        </button>
                        
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-3">
                          {t('adminPage.whiskyForm.labels.or')}
                        </div>
                      </div>
                      
                      {/* Hidden file input */}
                      <input
                        id="whisky-image-upload"
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          console.log('File input onChange triggered')
                          handleImageFileSelect(e)
                        }}
                        onClick={() => console.log('File input clicked')}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('adminPage.whiskyForm.labels.imageUrl')}
                    </label>
                    <input
                      type="url"
                      value={whiskyForm.image_url}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, image_url: e.target.value, selectedImageFile: null }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder="https://example.com/whisky-image.jpg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setIsCreatingWhisky(false)
                      setWhiskyForm({
                        name: '',
                        type: '',
                        country: '',
                        region: '',
                        alcohol_percentage: 40,
                        rating: null,
                        age_years: null,
                        color: '',
                        aroma: '',
                        taste: '',
                        finish: '',
                        description: '',
                        image_url: '',
                        selectedImageFile: null,
                                      })
                    }}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    {t('adminPage.whiskyForm.buttons.cancel')}
                  </button>
                  <button
                    onClick={handleCreateWhisky}
                    disabled={isWhiskyLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isWhiskyLoading ? 'Ekleniyor...' : 'Viski Ekle'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Whisky Modal */}
        <AnimatePresence>
          {editingWhisky && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Edit2 className="w-5 h-5 text-blue-500" />
                  {t('admin.editWhisky')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.whiskyName')} *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.name}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder={t('adminPage.whiskyForm.placeholders.whiskyName')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.type')} *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.type}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder={t('adminPage.whiskyForm.placeholders.type')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.country')} *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.country}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder={t('admin.scotlandPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.region')}
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.region}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder={t('adminPage.whiskyForm.placeholders.region')}
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.alcoholPercentage')} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={whiskyForm.alcohol_percentage}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, alcohol_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                     {t('adminPage.whiskyForm.labels.score')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={whiskyForm.rating || ''}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, rating: e.target.value ? parseFloat(e.target.value) : null }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder={t('adminPage.whiskyForm.placeholders.score')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.age')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={whiskyForm.age_years || ''}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, age_years: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder={t('adminPage.whiskyForm.placeholders.age')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                     {t('adminPage.whiskyForm.labels.color')}
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.color}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder={t('adminPage.whiskyForm.placeholders.color')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                     {t('adminPage.whiskyForm.labels.aroma')}
                    </label>
                    <textarea
                      value={whiskyForm.aroma}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, aroma: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={2}
                      placeholder={t('adminPage.whiskyForm.placeholders.aroma')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.taste')}
                    </label>
                    <textarea
                      value={whiskyForm.taste}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, taste: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={2}
                      placeholder={t('adminPage.whiskyForm.placeholders.taste')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.finish')}
                    </label>
                    <textarea
                      value={whiskyForm.finish}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, finish: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={2}
                      placeholder={t('adminPage.whiskyForm.placeholders.finish')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.description')}
                    </label>
                    <textarea
                      value={whiskyForm.description}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={3}
                      placeholder={t('adminPage.whiskyForm.placeholders.description')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.imageUpload')}
                    </label>
                    <div className="space-y-3">
                      {/* Current image preview */}
                      {(whiskyForm.selectedImageFile || whiskyForm.image_url) && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          {whiskyForm.selectedImageFile ? (
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                                <Image className="w-8 h-8 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {t('adminPage.whiskyForm.labels.selectedFile')}: {whiskyForm.selectedImageFile.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {(whiskyForm.selectedImageFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={removeSelectedImage}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : whiskyForm.image_url ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={whiskyForm.image_url}
                                alt="Current whisky image"
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                 {t('adminPage.whiskyForm.labels.currentImage')}: {whiskyForm.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 break-all">
                                  {whiskyForm.image_url.length > 50 ? whiskyForm.image_url.substring(0, 50) + '...' : whiskyForm.image_url}
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                      
                      {/* Upload options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Edit modal file upload button clicked')
                            triggerImageInput()
                          }}
                          disabled={isUploading || uploadingImage}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                          {isUploading || uploadingImage ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {isUploading || uploadingImage ? t('adminPage.whiskyForm.buttons.uploading') : t('adminPage.whiskyForm.buttons.selectNewFile')}
                        </button>
                        
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-3">
                          { t('adminPage.whiskyForm.labels.or')}
                        </div>
                      </div>
                      
                      {/* Hidden file input for edit modal */}
                      <input
                        id="whisky-image-upload-edit"
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          console.log('Edit modal file input onChange triggered')
                          handleImageFileSelect(e)
                        }}
                        onClick={() => console.log('Edit modal file input clicked')}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {t('adminPage.whiskyForm.labels.imageUrl')}
                    </label>
                    <input
                      type="url"
                      value={whiskyForm.image_url}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, image_url: e.target.value, selectedImageFile: null }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://example.com/whisky-image.jpg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setEditingWhisky(null)}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    {t('adminPage.whiskyForm.buttons.cancel')}
                  </button>
                  <button
                    onClick={handleUpdateWhisky}
                    disabled={isWhiskyLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isWhiskyLoading ? t('adminPage.whiskyForm.buttons.updating') : t('adminPage.whiskyForm.buttons.update')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Whisky Detail Modal */}
        <AnimatePresence>
          {viewingWhisky && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{t('adminPage.whiskyDetails.title')}</h3>
                  <button
                    onClick={() => setViewingWhisky(null)}
                    className="p-2 text-slate-500 hover:bg-slate-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Image and Basic Info */}
                  <div className="space-y-6">
                    {/* Whisky Image */}
                    <div className="relative">
                      {viewingWhisky.image_url ? (
                        <img
                          src={viewingWhisky.image_url}
                          alt={viewingWhisky.name}
                          className="w-full h-80 object-cover rounded-2xl shadow-lg"
                        />
                      ) : (
                        <div className="w-full h-80 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg flex items-center justify-center">
                          <Wine className="w-20 h-20 text-white" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-white font-medium">
                          {viewingWhisky.alcohol_percentage}% ABV
                        </span>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl p-6 space-y-4">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Temel Bilgiler</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Tip</label>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                              {viewingWhisky.type}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('adminPage.whiskyDetails.labels.country')}</label>
                          <p className="mt-1 text-slate-800 dark:text-white font-medium">{viewingWhisky.country}</p>
                        </div>
                        
                        {viewingWhisky.region && (
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('adminPage.whiskyDetails.labels.region')}</label>
                            <p className="mt-1 text-slate-800 dark:text-white font-medium flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-amber-500" />
                              {viewingWhisky.region}
                            </p>
                          </div>
                        )}
                        
                        {viewingWhisky.color && (
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Renk</label>
                            <p className="mt-1 text-slate-800 dark:text-white">{viewingWhisky.color}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Detailed Information */}
                  <div className="space-y-6">
                    {/* Whisky Name and Description */}
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                        {viewingWhisky.name}
                      </h1>
                      {viewingWhisky.description && (
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {viewingWhisky.description}
                        </p>
                      )}
                    </div>

                    {/* Tasting Notes */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white">{t('adminPage.whiskyDetails.labels.tastingNotes')}</h4>
                      
                      {viewingWhisky.aroma && (
                        <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">A</span>
                            </div>
                            <h5 className="font-medium text-slate-800 dark:text-white">Koku</h5>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 ml-10">{viewingWhisky.aroma}</p>
                        </div>
                      )}
                      
                      {viewingWhisky.taste && (
                        <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">T</span>
                            </div>
                            <h5 className="font-medium text-slate-800 dark:text-white">{t('adminPage.whiskyDetails.labels.taste')}</h5>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 ml-10">{viewingWhisky.taste}</p>
                        </div>
                      )}
                      
                      {viewingWhisky.finish && (
                        <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">F</span>
                            </div>
                            <h5 className="font-medium text-slate-800 dark:text-white">{t('adminPage.whiskyDetails.labels.finish')}</h5>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 ml-10">{viewingWhisky.finish}</p>
                        </div>
                      )}
                      
                      {!viewingWhisky.aroma && !viewingWhisky.taste && !viewingWhisky.finish && (
                        <div className="text-center py-8">
                          <Wine className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">{t('adminPage.whiskyDetails.labels.noTastingNotes')}</p>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl p-4">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{t('adminPage.whiskyDetails.labels.metadata')}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{t('adminPage.whiskyDetails.labels.createdDate')}:</span>
                          <span className="text-slate-800 dark:text-white">
                            {new Date(viewingWhisky.created_at).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{t('adminPage.whiskyDetails.labels.lastUpdated')}:</span>
                          <span className="text-slate-800 dark:text-white">
                            {new Date(viewingWhisky.updated_at).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Viski ID:</span>
                          <span className="text-slate-800 dark:text-white font-mono">#{viewingWhisky.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/20 dark:border-slate-600">
                  <button
                    onClick={() => {
                      setViewingWhisky(null)
                      handleEditWhisky(viewingWhisky)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('adminPage.whiskyDetails.buttons.edit')}
                  </button>
                  
                  <button
                    onClick={() => setViewingWhisky(null)}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    {t('adminPage.whiskyDetails.buttons.close')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Groups Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('adminPage.groupManagement.title')}</h2>
                <p className="text-slate-600 dark:text-slate-400">{t('adminPage.groupManagement.description', {count: groups.length})}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('Manual groups reload requested')
                    loadGroups()
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
                  title={t('admin.refreshGroups')}
                >
                  <Search className="w-4 h-4" />
                  {t('admin.refresh')}
                </button>
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  {t('adminPage.groupManagement.buttons.createGroup')}
                </button>
              </div>
            </div>

            {/* Groups List */}
            <div className="glass-strong rounded-xl p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32 mx-auto mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48 mx-auto"></div>
                  </div>
                  <p className="text-slate-500 mt-4">{t('adminPage.groupManagement.loading')}</p>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8">
                  <Users2 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">{t('adminPage.groupManagement.noGroups')}</h3>
                  <p className="text-slate-500">{t('adminPage.groupManagement.firstGroupMessage')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{group.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              group.privacy === 'public' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              group.privacy === 'private' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {group.privacy === 'public' ? t('adminPage.groupManagement.privacy.public') :
                               group.privacy === 'private' ? t('adminPage.groupManagement.privacy.private') : t('adminPage.groupManagement.privacy.membersOnly')}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mb-2">{group.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>📊 {group.member_count} {t('adminPage.groupManagement.members')}</span>
                            <span>📋 {group.category || 'Kategori yok'}</span>
                            <span>👥 Max: {group.max_members}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              console.log('🖱️ Group edit button clicked!', group.id, group.name)
                              handleEditGroup(group)
                            }}
                            className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title={t('admin.editGroup')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(String(group.id), group.name)}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="{t('admin.deleteGroup')}"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Group Modal */}
            <AnimatePresence>
              {isCreatingGroup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-strong rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('adminPage.groupManagement.titles.createGroup')}</h3>
                      <button
                        onClick={() => {
                          setIsCreatingGroup(false)
                          setGroupForm({
                            name: '',
                            description: '',
                            category: '',
                            privacy: 'public',
                            max_members: 50,
                            image_url: '',
                            selectedImageFile: null
                          })
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grup Adı *</label>
                        <input
                          type="text"
                          value={groupForm.name}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={t('admin.enterGroupName')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Açıklama</label>
                        <textarea
                          value={groupForm.description}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={3}
                          placeholder={t('adminPage.groupManagement.placeholders.description')}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                          <select
                            value={groupForm.category}
                            onChange={(e) => setGroupForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('adminPage.groupManagement.options.selectCategory')}</option>
                            <option value="whisky_tasting">{t('adminPage.groupManagement.options.whiskyTasting')}</option>
                            <option value="social">{t('adminPage.groupManagement.options.social')}</option>
                            <option value="educational">{t('adminPage.groupManagement.options.educational')}</option>
                            <option value="competition">{t('adminPage.groupManagement.options.competition')}</option>
                            <option value="networking">{t('adminPage.groupManagement.options.networking')}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gizlilik</label>
                          <select
                            value={groupForm.privacy}
                            onChange={(e) => setGroupForm(prev => ({ ...prev, privacy: e.target.value as 'public' | 'private' | 'members_only' }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="public">{t('adminPage.groupManagement.options.public')}</option>
                            <option value="members_only">{t('adminPage.groupManagement.options.membersOnly')}</option>
                            <option value="private">{t('adminPage.groupManagement.options.private')}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.groupManagement.labels.maxMembers')}</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={groupForm.max_members}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, max_members: parseInt(e.target.value) || 50 }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <button
                          onClick={handleCreateGroup}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          {t('adminPage.groupManagement.buttons.createGroup')}
                        </button>
                        <button
                          onClick={() => {
                            setIsCreatingGroup(false)
                            setGroupForm({
                              name: '',
                              description: '',
                              category: '',
                              privacy: 'public',
                              max_members: 50,
                              image_url: '',
                              selectedImageFile: null
                            })
                          }}
                          className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                        >
                          {t('adminPage.whiskyForm.buttons.cancel')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Edit Group Modal */}
            <AnimatePresence>
              {editingGroup && (
                <div>
                  {console.log('🎭 Rendering group edit modal:', editingGroup?.name)}
                </div>) &&
              (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-strong rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('admin.editGroup')}</h3>
                      <button
                        onClick={() => setEditingGroup(null)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grup Adı *</label>
                        <input
                          type="text"
                          value={groupForm.name}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Açıklama</label>
                        <textarea
                          value={groupForm.description}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                          <select
                            value={groupForm.category}
                            onChange={(e) => setGroupForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('adminPage.groupManagement.options.selectCategory')}</option>
                            <option value="whisky_tasting">{t('adminPage.groupManagement.options.whiskyTasting')}</option>
                            <option value="social">{t('adminPage.groupManagement.options.social')}</option>
                            <option value="educational">{t('adminPage.groupManagement.options.educational')}</option>
                            <option value="competition">{t('adminPage.groupManagement.options.competition')}</option>
                            <option value="networking">{t('adminPage.groupManagement.options.networking')}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gizlilik</label>
                          <select
                            value={groupForm.privacy}
                            onChange={(e) => setGroupForm(prev => ({ ...prev, privacy: e.target.value as 'public' | 'private' | 'members_only' }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="public">{t('adminPage.groupManagement.options.public')}</option>
                            <option value="members_only">{t('adminPage.groupManagement.options.membersOnly')}</option>
                            <option value="private">{t('adminPage.groupManagement.options.private')}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.groupManagement.labels.maxMembers')}</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={groupForm.max_members}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, max_members: parseInt(e.target.value) || 50 }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <button
                          onClick={handleSaveGroup}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          {t('admin.saveChanges')}
                        </button>
                        <button
                          onClick={() => setEditingGroup(null)}
                          className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                        >
                          {t('adminPage.whiskyForm.buttons.cancel')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Events Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('adminPage.eventManagement.title')}</h2>
                <p className="text-slate-600 dark:text-slate-400">{t('adminPage.eventManagement.description', {count: events.length})}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('Manual events reload requested')
                    loadEvents()
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
                  title={t('admin.refreshEvents')}
                >
                  <Search className="w-4 h-4" />
                  {t('admin.refresh')}
                </button>
                <button
                  onClick={() => setIsCreatingEvent(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  {t('adminPage.eventManagement.buttons.createEvent')}
                </button>
              </div>
            </div>

            {/* Events List */}
            <div className="glass-strong rounded-xl p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32 mx-auto mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48 mx-auto"></div>
                  </div>
                  <p className="text-slate-500 mt-4">{t('admin.loadingEvents')}</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">{t('adminPage.eventManagement.noEvents')}</h3>
                  <p className="text-slate-500">{t('adminPage.eventManagement.noEventsDescription')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{event.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              event.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              event.status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              event.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {event.status === 'upcoming' ? t("adminPage.eventManagement.status.upcoming") :
                               event.status === 'ongoing' ? t("adminPage.eventManagement.status.ongoing") :
                               event.status === 'completed' ? t("adminPage.eventManagement.status.completed") : t("adminPage.eventManagement.status.cancelled")}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>📅 {new Date(event.start_date).toLocaleDateString('tr-TR')}</span>
                            <span>📊 {event.participant_count} {t('adminPage.eventManagement.participants')}</span>
                            <span>💰 {t('adminPage.eventManagement.free')}</span>
                            {event.group_name && <span>👥 {event.group_name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title={t('admin.editEvent')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(String(event.id), event.title)}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Etkinliği Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Event Modal */}
            <AnimatePresence>
              {isCreatingEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-strong rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('adminPage.eventManagement.createEvent')}</h3>
                      <button
                        onClick={() => {
                          setIsCreatingEvent(false)
                          setEventForm({
                            title: '',
                            description: '',
                            event_type: '',
                            location: '',
                            virtual_link: '',
                            start_date: '',
                            end_date: '',
                            max_participants: 30,
                            // price: 0,
                            // currency: 'TRY',
                            group_id: '',
                            image_url: '',
                            selectedImageFile: null
                          })
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.eventTitle')} *</label>
                        <input
                          type="text"
                          value={eventForm.title}
                          onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={t('adminPage.eventManagement.placeholders.eventTitle')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.description')}</label>
                        <textarea
                          value={eventForm.description}
                          onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={3}
                          placeholder={t('adminPage.eventManagement.placeholders.description')}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.eventType')}</label>
                          <select
                            value={eventForm.event_type}
                            onChange={(e) => setEventForm(prev => ({ ...prev, event_type: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('adminPage.eventManagement.placeholders.eventType')}</option>
                            <option value="tasting">{t('adminPage.eventManagement.options.tasting')}</option>
                            <option value="workshop">{t('adminPage.eventManagement.options.workshop')}</option>
                            <option value="meetup">{t('adminPage.eventManagement.options.meetup')}</option>
                            <option value="competition">{t('adminPage.groupManagement.options.competition')}</option>
                            <option value="seminar">{t('adminPage.eventManagement.options.seminar')}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.group')}</label>
                          <select
                            value={eventForm.group_id}
                            onChange={(e) => setEventForm(prev => ({ ...prev, group_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('adminPage.eventManagement.placeholders.group')}</option>
                            {groups.map(group => (
                              <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.startDate')} *</label>
                          <input
                            type="datetime-local"
                            value={eventForm.start_date}
                            onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.endDate')}</label>
                          <input
                            type="datetime-local"
                            value={eventForm.end_date}
                            onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.location')}</label>
                          <input
                            type="text"
                            value={eventForm.location}
                            onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Etkinlik konumu"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.virtualLink')}</label>
                          <input
                            type="url"
                            value={eventForm.virtual_link}
                            onChange={(e) => setEventForm(prev => ({ ...prev, virtual_link: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Zoom, Meet vs. linki"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.maxParticipants')}</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={eventForm.max_participants}
                            onChange={(e) => setEventForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 30 }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

{/* Price and currency fields removed until database schema is updated */}
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <button
                          onClick={handleCreateEvent}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          {t('adminPage.eventManagement.buttons.createEvent')}
                        </button>
                        <button
                          onClick={() => {
                            setIsCreatingEvent(false)
                            setEventForm({
                              title: '',
                              description: '',
                              event_type: '',
                              location: '',
                              virtual_link: '',
                              start_date: '',
                              end_date: '',
                              max_participants: 30,
                              // price: 0,
                              // currency: 'TRY',
                              group_id: '',
                              image_url: '',
                              selectedImageFile: null
                            })
                          }}
                          className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                        >
                          {t('adminPage.whiskyForm.buttons.cancel')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Edit Event Modal */}
            <AnimatePresence>
              {editingEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-strong rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Etkinliği Düzenle</h3>
                      <button
                        onClick={() => setEditingEvent(null)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.title')} *</label>
                        <input
                          type="text"
                          value={eventForm.title}
                          onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.description')}</label>
                        <textarea
                          value={eventForm.description}
                          onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.eventType')}</label>
                          <select
                            value={eventForm.event_type}
                            onChange={(e) => setEventForm(prev => ({ ...prev, event_type: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('adminPage.eventManagement.placeholders.eventType')}</option>
                            <option value="tasting">{t('adminPage.eventManagement.options.tasting')}</option>
                            <option value="workshop">{t('adminPage.eventManagement.options.workshop')}</option>
                            <option value="meetup">{t('adminPage.eventManagement.options.meetup')}</option>
                            <option value="competition">{t('adminPage.groupManagement.options.competition')}</option>
                            <option value="seminar">{t('adminPage.eventManagement.options.seminar')}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.group')}</label>
                          <select
                            value={eventForm.group_id}
                            onChange={(e) => setEventForm(prev => ({ ...prev, group_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('adminPage.eventManagement.placeholders.group')}</option>
                            {groups.map(group => (
                              <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.startDate')} *</label>
                          <input
                            type="datetime-local"
                            value={eventForm.start_date}
                            onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.endDate')}</label>
                          <input
                            type="datetime-local"
                            value={eventForm.end_date}
                            onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Konum</label>
                          <input
                            type="text"
                            value={eventForm.location}
                            onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.virtualLink')}</label>
                          <input
                            type="url"
                            value={eventForm.virtual_link}
                            onChange={(e) => setEventForm(prev => ({ ...prev, virtual_link: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('adminPage.eventManagement.labels.maxParticipants')}</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={eventForm.max_participants}
                            onChange={(e) => setEventForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 30 }))}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

{/* Price and currency fields removed until database schema is updated */}
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <button
                          onClick={handleSaveEvent}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          {t('admin.saveChanges')}
                        </button>
                        <button
                          onClick={() => setEditingEvent(null)}
                          className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                        >
                          {t('adminPage.whiskyForm.buttons.cancel')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Background Management Tab */}
        {activeTab === 'background' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <BackgroundManager />
          </motion.div>
        )}

        {/* Translations Management Tab */}
        {activeTab === 'translations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <TranslationManagement />
          </motion.div>
        )}

      </div>
    </div>
  )
}
