import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminOperations } from '@/hooks/useAdminOperations'
import { useWhiskyUpload } from '@/hooks/useWhiskyUpload'
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
  Percent
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

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
  age_years: number
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

export function AdminPage() {
  const { user, profile } = useAuth()
  const { getAllUsers, updateUser, deleteUser, createAdmin, createUser, isLoading } = useAdminOperations()
  const [users, setUsers] = useState<User[]>([])
  const [whiskies, setWhiskies] = useState<Whisky[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'whiskies'>('overview')
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
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { uploadWhiskyImage, isUploading } = useWhiskyUpload()
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

  const loadUsers = async () => {
    try {
      const userData = await getAllUsers()
      setUsers(userData)
    } catch (error) {
      // Error already handled in hook
    }
  }

  const loadWhiskies = async () => {
    try {
      console.log('AdminPage: Starting to load whiskies with chunked approach...')
      
      // First, get the total count
      const { count, error: countError } = await supabase
        .from('whiskies')
        .select('*', { count: 'exact', head: true })

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
      
      toast.success(`${allWhiskies.length} viski başarıyla yüklendi!`)
      setWhiskies(allWhiskies)
      
    } catch (error) {
      console.error('AdminPage: Error loading whiskies:', error)
      toast.error('Viskiler yüklenemedi: ' + (error as any).message)
    }
  }

  useEffect(() => {
    loadUsers()
    loadWhiskies()
  }, [])

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
            <h1 className="text-2xl font-bold mb-4 text-red-600">Erişim Reddedildi</h1>
            <p className="text-slate-600 dark:text-slate-400">Bu sayfaya erişim için admin yetkisi gereklidir.</p>
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
      toast.error('İsim alanı boş bırakılamaz')
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
    if (!confirm(`${userEmail} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
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
      toast.error('Email ve isim alanları gereklidir')
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
      toast.error('Email ve ad soyad alanları gereklidir')
      return
    }

    if (!userForm.password) {
      toast.error('Şifre gereklidir')
      return
    }

    if (userForm.password !== userForm.confirmPassword) {
      toast.error('Şifreler eşleşmiyor')
      return
    }

    if (userForm.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
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
            Admin
          </span>
        )
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <Crown className="w-3 h-3" />
            VIP
          </span>
        )
      default:
        return (
          <span className="bg-slate-500/20 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full text-xs">
            Üye
          </span>
        )
    }
  }

  const handleCreateWhisky = async () => {
    if (!whiskyForm.name.trim() || !whiskyForm.type.trim() || !whiskyForm.country.trim()) {
      toast.error('Ad, tip ve ülke alanları gereklidir')
      return
    }

    try {
      let imageUrl = whiskyForm.image_url.trim() || null
      
      // Upload image if a file is selected
      if (whiskyForm.selectedImageFile) {
        setUploadingImage(true)
        try {
          const uploadResult = await uploadWhiskyImage(whiskyForm.selectedImageFile)
          imageUrl = uploadResult.publicUrl
        } catch (uploadError: any) {
          toast.error('Resim yüklenirken hata oluştu: ' + (uploadError.message || 'Bilinmeyen hata'))
          setUploadingImage(false)
          return
        }
        setUploadingImage(false)
      }

      const { data, error } = await supabase
        .from('whiskies')
        .insert({
          name: whiskyForm.name.trim(),
          type: whiskyForm.type.trim(),
          country: whiskyForm.country.trim(),
          region: whiskyForm.region.trim() || null,
          alcohol_percentage: whiskyForm.alcohol_percentage,
          rating: whiskyForm.rating,
          age_years: whiskyForm.age_years,
          color: whiskyForm.color.trim() || null,
          aroma: whiskyForm.aroma.trim() || null,
          taste: whiskyForm.taste.trim() || null,
          finish: whiskyForm.finish.trim() || null,
          description: whiskyForm.description.trim() || null,
          image_url: imageUrl,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error

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
        selectedImageFile: null
      })
      await loadWhiskies()
      toast.success('Viski başarıyla eklendi!')
    } catch (error: any) {
      console.error('Error creating whisky:', error)
      toast.error('Viski eklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
    }
  }

  const handleEditWhisky = (whisky: Whisky) => {
    setEditingWhisky(whisky)
    setWhiskyForm({
      name: whisky.name,
      type: whisky.type,
      country: whisky.country,
      region: whisky.region || '',
      alcohol_percentage: whisky.alcohol_percentage,
      rating: whisky.rating,
      age_years: whisky.age_years || null, 
      color: whisky.color || '',
      aroma: whisky.aroma || '',
      taste: whisky.taste || '',
      finish: whisky.finish || '',
      description: whisky.description || '',
      image_url: whisky.image_url || '',
      selectedImageFile: null
    })
  }

  const handleViewWhisky = (whisky: Whisky) => {
    setViewingWhisky(whisky)
  }

  const handleUpdateWhisky = async () => {
    if (!editingWhisky) return
    
    if (!whiskyForm.name.trim() || !whiskyForm.type.trim() || !whiskyForm.country.trim()) {
      toast.error('Ad, tip ve ülke alanları gereklidir')
      return
    }

    try {
      let imageUrl = whiskyForm.image_url.trim() || null
      
      // Upload new image if a file is selected
      if (whiskyForm.selectedImageFile) {
        setUploadingImage(true)
        try {
          const uploadResult = await uploadWhiskyImage(whiskyForm.selectedImageFile)
          imageUrl = uploadResult.publicUrl
        } catch (uploadError: any) {
          toast.error('Resim yüklenirken hata oluştu: ' + (uploadError.message || 'Bilinmeyen hata'))
          setUploadingImage(false)
          return
        }
        setUploadingImage(false)
      }

      const { error } = await supabase
        .from('whiskies')
        .update({
          name: whiskyForm.name.trim(),
          type: whiskyForm.type.trim(),
          country: whiskyForm.country.trim(),
          region: whiskyForm.region.trim() || null,
          alcohol_percentage: whiskyForm.alcohol_percentage,
          rating: whiskyForm.rating,
          age_years: whiskyForm.age_years,
          color: whiskyForm.color.trim() || null,
          aroma: whiskyForm.aroma.trim() || null,
          taste: whiskyForm.taste.trim() || null,
          finish: whiskyForm.finish.trim() || null,
          description: whiskyForm.description.trim() || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingWhisky.id)

      if (error) throw error

      setEditingWhisky(null)
      await loadWhiskies()
      toast.success('Viski başarıyla güncellendi!')
    } catch (error: any) {
      console.error('Error updating whisky:', error)
      toast.error('Viski güncellenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
    }
  }

  const handleDeleteWhisky = async (whiskyId: number, whiskyName: string) => {
    if (!confirm(`"${whiskyName}" viskisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return
    }

    try {
      // First check if whisky is in any user collections
      const { data: userWhiskies, error: checkError } = await supabase
        .from('user_whiskies')
        .select('id')
        .eq('whisky_id', whiskyId)
        .limit(1)

      if (checkError) throw checkError

      if (userWhiskies && userWhiskies.length > 0) {
        const shouldProceed = confirm(
          `Bu viski bazı kullanıcıların koleksiyonunda bulunuyor. Silmeye devam ederseniz, kullanıcı koleksiyonlarından da kaldırılacak. Devam etmek istediğinizden emin misiniz?`
        )
        if (!shouldProceed) return

        // Delete from user collections first
        const { error: deleteUserWhiskiesError } = await supabase
          .from('user_whiskies')
          .delete()
          .eq('whisky_id', whiskyId)

        if (deleteUserWhiskiesError) throw deleteUserWhiskiesError
      }

      // Delete the whisky
      const { error } = await supabase
        .from('whiskies')
        .delete()
        .eq('id', whiskyId)

      if (error) throw error

      await loadWhiskies()
      toast.success('Viski başarıyla silindi!')
    } catch (error: any) {
      console.error('Error deleting whisky:', error)
      toast.error('Viski silinirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
    }
  }

  const getStats = () => {
    const totalUsers = users.length
    const adminCount = users.filter(u => u.role === 'admin').length
    const vipCount = users.filter(u => u.role === 'vip').length
    const regularCount = users.filter(u => u.role === 'user').length
    const totalWhiskies = whiskies.length
    
    return { totalUsers, adminCount, vipCount, regularCount, totalWhiskies }
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
      
      toast.success(`${whiskies.length} viski başarıyla CSV formatında export edildi!`)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('CSV export edilirken hata oluştu')
    } finally {
      setIsExporting(false)
    }
  }

  // CSV Import Function
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Lütfen geçerli bir CSV dosyası seçin')
      return
    }

    setIsImporting(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          toast.error('CSV dosyası en az 2 satır içermelidir (başlık + veri)')
          setIsImporting(false)
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const expectedHeaders = ['name', 'type', 'country', 'region', 'alcohol_percentage', 'color', 'aroma', 'taste', 'finish', 'description', 'image_url']
        
        // Validate headers
        const requiredHeaders = ['name', 'type', 'country', 'alcohol_percentage']
        const missingRequired = requiredHeaders.filter(h => !headers.includes(h))
        
        if (missingRequired.length > 0) {
          toast.error(`Gerekli sütunlar eksik: ${missingRequired.join(', ')}`)
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
              errors.push(`Satır ${i + 2}: Ad, tip ve ülke alanları gereklidir`)
              continue
            }

            // Convert alcohol percentage to number
            whiskyData.alcohol_percentage = parseFloat(whiskyData.alcohol_percentage) || 0
            if (whiskyData.alcohol_percentage <= 0 || whiskyData.alcohol_percentage > 100) {
              errors.push(`Satır ${i + 2}: Geçersiz alkol oranı`)
              continue
            }

            // Add metadata
            whiskyData.created_by = user?.id
            whiskyData.created_at = new Date().toISOString()
            whiskyData.updated_at = new Date().toISOString()

            validWhiskies.push(whiskyData)
          } catch (error) {
            errors.push(`Satır ${i + 2}: Veri formatı hatası`)
          }
        }

        if (validWhiskies.length === 0) {
          toast.error('Import edilecek geçerli viski bulunamadı')
          setIsImporting(false)
          return
        }

        // Show confirmation dialog
        const shouldProceed = confirm(
          `${validWhiskies.length} adet viski import edilecek.${errors.length > 0 ? ` ${errors.length} hata göz ardı edilecek.` : ''} Devam etmek istiyor musunuz?`
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
            toast.error(`Batch ${Math.floor(i/batchSize) + 1} import edilirken hata oluştu`)
            continue
          }

          importedCount += data?.length || 0
        }

        await loadWhiskies()
        
        toast.success(
          `✅ ${importedCount} viski başarıyla import edildi!${errors.length > 0 ? ` (${errors.length} hata göz ardı edildi)` : ''}`
        )

        if (errors.length > 0 && errors.length <= 10) {
          console.warn('Import errors:', errors)
        }

      } catch (error) {
        console.error('CSV parsing error:', error)
        toast.error('CSV dosyası okunurken hata oluştu')
      } finally {
        setIsImporting(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      toast.error('Dosya okunurken hata oluştu')
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
      '"İskoçya"',
      '"Speyside"',
      '43.0',
      '"Altın"',
      '"Vanilya, bal, meyveli"',
      '"Bal, badem, hafif baharat"',
      '"Uzun ve sıcak"',
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
    
    toast.success('CSV template dosyası indirildi!')
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
      toast.error('Lütfen geçerli bir resim dosyası seçin')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'den küçük olmalıdır')
      return
    }

    console.log('File is valid, updating form')
    setWhiskyForm(prev => ({ ...prev, selectedImageFile: file, image_url: '' }))
    toast.success('Resim dosyası seçildi: ' + file.name)
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
      toast.error('Dosya girişi bulunamadı. Sayfayı yenileyin.')
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
            Yönetici Paneli
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Sistem yönetimi ve kullanıcı kontrolü</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white/20 text-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Genel Bakış
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
              Kullanıcı Yönetimi
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
              Viski Yönetimi
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
                    <p className="text-sm text-slate-600 dark:text-slate-400">Toplam Kullanıcı</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Admin</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.adminCount}</p>
                  </div>
                  <Settings className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">VIP Üye</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.vipCount}</p>
                  </div>
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Standart Üye</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.regularCount}</p>
                  </div>
                  <Shield className="w-8 h-8 text-slate-500" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Toplam Viski</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalWhiskies}</p>
                  </div>
                  <Wine className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </div>
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
                  Kullanıcı Ekle
                </button>
                <button
                  onClick={() => setIsCreatingAdmin(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200"
                >
                  <Crown className="w-4 h-4" />
                  Admin Ekle
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
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Kullanıcı</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Rol</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Kayıt Tarihi</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">İşlemler</th>
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
                              title="Düzenle"
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
                  {isLoading ? 'Yükleniyor...' : 'Tüm Viskileri Yenile'}
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
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tüm Ülkeler</option>
                  {countries.map(country => (
                    <option key={country} value={country} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{country}</option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full sm:w-auto text-slate-900 dark:text-white"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tüm Tipler</option>
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
                  Harf Filtresi
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
                    Tümü
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
                    <span className="font-medium text-slate-800 dark:text-white">{filteredWhiskies.length}</span> viski bulundu
                    <span className="ml-2 text-xs opacity-60">(Toplam yüklü: {whiskies.length})</span>
                    {filteredWhiskies.length > 0 && (
                      <span className="ml-2">
                        ({startIndex + 1}-{Math.min(endIndex, filteredWhiskies.length)} arası gösteriliyor)
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
                    <span className="text-sm text-slate-600 dark:text-slate-400">Sayfa başı:</span>
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
                        title="Önceki sayfa"
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
                    <p><strong>Gerekli sütunlar:</strong> name, type, country, alcohol_percentage</p>
                    <p><strong>Opsiyonel sütunlar:</strong> region, color, aroma, taste, finish, description, image_url</p>
                    <p><strong>Örnek:</strong> "Macallan 18","Single Malt","İskoçya","Speyside",43.0,"Altın","Vanilya","Bal","Uzun","Premium viski","https://..."
                    </p>
                    <p className="text-blue-600 dark:text-blue-400"><strong>İpuca:</strong> Mevcut veri formatını görmek için önce "CSV Export" butonunu kullanın.</p>
                    <div className="mt-3">
                      <button
                        onClick={downloadCSVTemplate}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-800/70 text-blue-700 dark:text-blue-300 rounded-md text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Örnek CSV Template İndir
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
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Viski</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Tip</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Ülke</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Alkol %</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Oluşturma</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">İşlemler</th>
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
                              title="Detayları görüntüle"
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
                              title="Detayları Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleEditWhisky(whisky)}
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Düzenle"
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
                      ? 'Arama kriterlerinize uygun viski bulunamadı.'
                      : 'Henüz viski eklenmemiş.'}
                  </p>
                </div>
              )}
              
              {paginatedWhiskies.length === 0 && filteredWhiskies.length > 0 && (
                <div className="text-center py-8">
                  <Wine className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Bu sayfada gösterilecek viski bulunamadı. Farklı bir sayfa seçin veya sayfa başına gösterilecek öğe sayısını artırın.
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
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Kullanıcı Düzenle</h3>
                
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
                      <option value="user" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Üye</option>
                      <option value="vip" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">VIP Üye</option>
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
                      <option value="tr" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Türkçe</option>
                      <option value="en" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">English</option>
                    </select>
                  </div>

                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    İptal
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
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Admin Kullanıcı Ekle</h3>
                
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
                      placeholder="Admin Kullanıcı"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Şifre (Opsiyonel)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminForm.password}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-white"
                        placeholder="Boş bırakılırsa varsayılan: Admin123!"
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
                    İptal
                  </button>
                  <button
                    onClick={handleCreateAdmin}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
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
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Yeni Kullanıcı Ekle</h3>
                
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
                      placeholder="Kullanıcı Adı"
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
                      <option value="user">Kullanıcı</option>
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
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Şifre
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
                      Şifreyi Onayla
                    </label>
                    <div className="relative">
                      <input
                        type={showUserConfirmPassword ? 'text' : 'password'}
                        value={userForm.confirmPassword}
                        onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                        placeholder="Şifreyi tekrar girin"
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
                    İptal
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
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
                      Viski Adı *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.name}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder="Örn. Macallan 18"
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
                      placeholder="Örn. Single Malt, Bourbon, Rye"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ülke *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.country}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder="Örn. İskoçya, ABD, Japonya"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bölge
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.region}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder="Örn. Speyside, Highland, Kentucky"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Alkol Oranı % *
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
                      placeholder="Örn. 85.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Yaş (Yıl)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={whiskyForm.age_years || ''}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, age_years: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white"
                      placeholder="Örn. 18 (NAS için boş bırakın)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Renk
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.color}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      placeholder="Örn. Altın, Kehribar, Koyu Bakır"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Koku
                    </label>
                    <textarea
                      value={whiskyForm.aroma}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, aroma: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      rows={2}
                      placeholder="Koku notlarını açıklayın..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Damak Tadı
                    </label>
                    <textarea
                      value={whiskyForm.taste}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, taste: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      rows={2}
                      placeholder="Damak tadı notlarını açıklayın..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bitiş
                    </label>
                    <textarea
                      value={whiskyForm.finish}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, finish: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      rows={2}
                      placeholder="Bitiş notlarını açıklayın..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      value={whiskyForm.description}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      rows={3}
                      placeholder="Genel açıklama..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Resim Yükleme
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
                                  Seçilen dosya: {whiskyForm.selectedImageFile.name}
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
                                  Mevcut resim URL
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
                          {isUploading || uploadingImage ? 'Yükleniyor...' : 'Dosya Seç'}
                        </button>
                        
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-3">
                          veya
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
                      Veya Resim URL
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
                        selectedImageFile: null
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleCreateWhisky}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Ekleniyor...' : 'Viski Ekle'}
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
                  Viski Düzenle
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Viski Adı *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.name}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Örn. Macallan 18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Tip *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.type}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Örn. Single Malt, Bourbon, Rye"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Ülke *
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.country}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Örn. İskoçya, ABD, Japonya"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Bölge
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.region}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Örn. Speyside, Highland, Kentucky"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Alkol Oranı % *
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
                      Puanlama (1-100)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={whiskyForm.rating || ''}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, rating: e.target.value ? parseFloat(e.target.value) : null }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Örn. 85.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Yaş (Yıl)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={whiskyForm.age_years || ''}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, age_years: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Örn. 18 (NAS için boş bırakın)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Renk
                    </label>
                    <input
                      type="text"
                      value={whiskyForm.color}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Örn. Altın, Kehribar, Koyu Bakır"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Koku
                    </label>
                    <textarea
                      value={whiskyForm.aroma}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, aroma: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={2}
                      placeholder="Koku notlarını açıklayın..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Damak Tadı
                    </label>
                    <textarea
                      value={whiskyForm.taste}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, taste: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={2}
                      placeholder="Damak tadı notlarını açıklayın..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Bitiş
                    </label>
                    <textarea
                      value={whiskyForm.finish}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, finish: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={2}
                      placeholder="Bitiş notlarını açıklayın..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      value={whiskyForm.description}
                      onChange={(e) => setWhiskyForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={3}
                      placeholder="Genel açıklama..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Resim Yükleme
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
                                  Seçilen dosya: {whiskyForm.selectedImageFile.name}
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
                                  Mevcut resim
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
                          {isUploading || uploadingImage ? 'Yükleniyor...' : 'Yeni Dosya Seç'}
                        </button>
                        
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-3">
                          veya
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
                      Veya Resim URL
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
                    İptal
                  </button>
                  <button
                    onClick={handleUpdateWhisky}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
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
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Viski Detayları
                  </h3>
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
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Ülke</label>
                          <p className="mt-1 text-slate-800 dark:text-white font-medium">{viewingWhisky.country}</p>
                        </div>
                        
                        {viewingWhisky.region && (
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Bölge</label>
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
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white">Tadim Notları</h4>
                      
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
                            <h5 className="font-medium text-slate-800 dark:text-white">Damak Tadı</h5>
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
                            <h5 className="font-medium text-slate-800 dark:text-white">Bitiş</h5>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 ml-10">{viewingWhisky.finish}</p>
                        </div>
                      )}
                      
                      {!viewingWhisky.aroma && !viewingWhisky.taste && !viewingWhisky.finish && (
                        <div className="text-center py-8">
                          <Wine className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">Henüz tadim notu eklenmemiş</p>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl p-4">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Sistem Bilgileri</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Oluşturma Tarihi:</span>
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
                          <span className="text-slate-600 dark:text-slate-400">Son Güncelleme:</span>
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
                    Düzenle
                  </button>
                  
                  <button
                    onClick={() => setViewingWhisky(null)}
                    className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}