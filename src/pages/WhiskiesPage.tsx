import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  Wine, 
  Search, 
  Filter, 
  MapPin, 
  Percent, 
  Star,
  Heart,
  Plus,
  ChevronDown,
  X,
  Upload,
  Camera,
  Eye,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Globe
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useWhiskyUpload } from '@/hooks/useWhiskyUpload'
import { useMultilingualWhiskies, MultilingualWhisky } from '@/hooks/useMultilingualWhiskies'
import { useSimpleWhiskiesDB, SimpleWhiskyDB } from '@/hooks/useSimpleWhiskiesDB'
import { TranslationManager } from '@/components/TranslationManager'

interface UserWhisky {
  id: number
  whisky_id: number
  tasted: boolean
  rating: number | null
  personal_notes: string | null
}

export function WhiskiesPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  
  const { uploadWhiskyImage, isUploading } = useWhiskyUpload()
  const { whiskies: simpleWhiskies, loading: simpleLoading, loadWhiskies: loadSimpleWhiskies } = useSimpleWhiskiesDB()
  
  // Convert simple whiskies to multilingual format for compatibility
  const whiskies = simpleWhiskies.map(w => ({ ...w, language_code: 'tr' })) as MultilingualWhisky[]
  const whiskyLoading = simpleLoading
  const loadWhiskies = loadSimpleWhiskies
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userWhiskies, setUserWhiskies] = useState<UserWhisky[]>([])
  const [loading, setLoading] = useState(true)
  // Removed old searchTerm state - now using localSearchTerm and debouncedSearchTerm
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4 | 5 | 6>(3)
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewingWhisky, setViewingWhisky] = useState<MultilingualWhisky | null>(null)
  const [showTranslationManager, setShowTranslationManager] = useState(false)
  const [translatingWhisky, setTranslatingWhisky] = useState<MultilingualWhisky | null>(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null)
  const [addForm, setAddForm] = useState({
    name: '',
    type: '',
    country: '',
    region: '',
    alcohol_percentage: 40,
    rating: null as number | null,
    age_years: null as number | null,
    color: '',
    aroma: '',
    taste: '',
    finish: '',
    description: ''
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  // Translation management handlers
  const handleManageTranslations = (whisky: MultilingualWhisky) => {
    setTranslatingWhisky(whisky)
    setShowTranslationManager(true)
  }

  const loadUserCollection = async () => {
    if (!user) {
      console.log('No user found, skipping user collection load')
      return
    }

    try {
      console.log('Loading user collection for user:', user.id)
      const { data, error } = await supabase
        .from('user_whiskies')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading user collection:', error)
        throw error
      }
      
      console.log('User collection loaded:', { count: data?.length || 0, data })
      setUserWhiskies(data || [])
    } catch (error) {
      console.error('Error loading user collection:', error)
      toast.error('Kullanıcı koleksiyonu yüklenemedi')
    }
  }

  // Fetch whiskies and user collection
  useEffect(() => {
    setLoading(whiskyLoading)
    if (user) {
      loadUserCollection()
    }
  }, [whiskyLoading, user])

  // Local search state to prevent excessive API calls
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce the search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [localSearchTerm])

  // Load whiskies only when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.length >= 3 || debouncedSearchTerm.length === 0) {
      loadWhiskies(undefined, 0, debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  const addToCollection = async (whiskyId: number) => {
    if (!user) {
      toast.error('Koleksiyona eklemek için giriş yapmalısınız')
      return
    }

    console.log('Adding whisky to collection:', { whiskyId, userId: user.id })

    try {
      // Check if already in collection first (without .single() to avoid 406 error)
      const { data: existingEntries, error: checkError } = await supabase
        .from('user_whiskies')
        .select('id')
        .eq('user_id', user.id)
        .eq('whisky_id', whiskyId)

      if (checkError) {
        console.error('Error checking for existing entry:', checkError)
        throw checkError
      }

      if (existingEntries && existingEntries.length > 0) {
        console.log('Whisky already in collection:', existingEntries)
        toast.error('Bu viski zaten koleksiyonunuzda')
        return
      }

      console.log('No existing entry found, adding to collection')

      const { data, error } = await supabase
        .from('user_whiskies')
        .insert({
          user_id: user.id,
          whisky_id: whiskyId,
          tasted: false,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Error inserting into collection:', error)
        throw error
      }

      console.log('Successfully added to collection:', data)

      // Reload user collection to update local state
      await loadUserCollection()
      
      // Also trigger a storage event to notify other components
      window.dispatchEvent(new CustomEvent('collectionUpdated', { 
        detail: { action: 'added', whiskyId } 
      }))
      
      toast.success('Koleksiyona eklendi!')
    } catch (error: any) {
      console.error('Error adding to collection:', error)
      if (error.code === '23505') {
        toast.error('Bu viski zaten koleksiyonunuzda')
      } else {
        toast.error('Koleksiyona eklenirken hata oluştu')
      }
    }
  }

  const markAsTasted = async (whiskyId: number) => {
    if (!user) return

    try {
      const userWhisky = userWhiskies.find(uw => uw.whisky_id === whiskyId)
      
      if (userWhisky) {
        // Update existing record
        const { error } = await supabase
          .from('user_whiskies')
          .update({
            tasted: !userWhisky.tasted,
            tasted_at: !userWhisky.tasted ? new Date().toISOString() : null
          })
          .eq('id', userWhisky.id)

        if (error) throw error
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_whiskies')
          .insert({
            user_id: user.id,
            whisky_id: whiskyId,
            tasted: true,
            tasted_at: new Date().toISOString()
          })

        if (error) throw error
      }

      await loadUserCollection()
      toast.success('Durum güncellendi!')
    } catch (error) {
      console.error('Error updating tasted status:', error)
      toast.error('Durum güncellenirken hata oluştu')
    }
  }

  const handleViewWhisky = (whisky: MultilingualWhisky) => {
    setViewingWhisky(whisky)
  }

  const handleTranslateWhisky = (whisky: MultilingualWhisky) => {
    setTranslatingWhisky(whisky)
    setShowTranslationManager(true)
  }

  const handleTranslationSave = () => {
    // Reload whiskies to get updated translations
    loadWhiskies(undefined, 0, debouncedSearchTerm)
    setShowTranslationManager(false)
    setTranslatingWhisky(null)
  }

  const handleImageClick = (imageUrl: string, whiskyName: string) => {
    setViewingImage({ url: imageUrl, name: whiskyName })
    setShowImageViewer(true)
  }

  // Filter whiskies with memoization to prevent unnecessary re-renders
  const filteredWhiskies = useMemo(() => {
    return whiskies.filter(whisky => {
      const matchesSearch = localSearchTerm.length === 0 || localSearchTerm.length >= 3 ? 
        (whisky.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
         whisky.type.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
         whisky.country.toLowerCase().includes(localSearchTerm.toLowerCase())) : true
      
      const matchesCountry = !selectedCountry || whisky.country === selectedCountry
      const matchesType = !selectedType || whisky.type === selectedType

      return matchesSearch && matchesCountry && matchesType
    })
  }, [whiskies, localSearchTerm, selectedCountry, selectedType])

  // Get unique countries and types for filters
  const countries = [...new Set(whiskies.map(w => w.country))].sort()
  const types = [...new Set(whiskies.map(w => w.type))].sort()

  const isInCollection = (whiskyId: number) => {
    return userWhiskies.some(uw => uw.whisky_id === whiskyId)
  }

  const isTasted = (whiskyId: number) => {
    const userWhisky = userWhiskies.find(uw => uw.whisky_id === whiskyId)
    return userWhisky?.tasted || false
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredWhiskies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWhiskies = filteredWhiskies.slice(startIndex, endIndex)

  // Pagination Component
  const PaginationControls = ({ className = '' }: { className?: string }) => {
    if (totalPages <= 1) return null
    
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {startIndex + 1}-{Math.min(endIndex, filteredWhiskies.length)} / {filteredWhiskies.length} viski görüntülüyor
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-md border border-white/20"
            title="Önceki sayfa"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-md border min-w-[40px] ${
                    currentPage === pageNum
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400/30 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 border-white/20'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-md border border-white/20"
            title="Sonraki sayfa"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Grid column classes
  const gridColumnClasses = {
    2: 'sm:grid-cols-1 md:grid-cols-2',
    3: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [localSearchTerm, selectedCountry, selectedType])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen geçerli bir resim dosyası seçin')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Dosya boyutu 10MB\'den küçük olmalıdır')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetAddForm = () => {
    setAddForm({
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
      description: ''
    })
    setSelectedImage(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddWhisky = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Viski eklemek için giriş yapmalısınız')
      return
    }

    if (!addForm.name.trim()) {
      toast.error('Viski adı gereklidir')
      return
    }

    if (!selectedImage) {
      toast.error('Lütfen bir resim seçin')
      return
    }

    try {
      const whiskeyData = {
        name: addForm.name.trim(),
        type: addForm.type || 'Single Malt',
        country: addForm.country || 'Bilinmeyen',
        region: addForm.region.trim() || null,
        alcohol_percentage: addForm.alcohol_percentage,
        rating: addForm.rating,
        age_years: addForm.age_years,
        color: addForm.color.trim() || null,
        aroma: addForm.aroma.trim() || null,
        taste: addForm.taste.trim() || null,
        finish: addForm.finish.trim() || null,
        description: addForm.description.trim() || null
      }

      await uploadWhiskyImage(selectedImage, whiskeyData)
      
      // Reload whiskies
      await loadWhiskies(undefined, 0, debouncedSearchTerm)
      
      // Reset and close
      setShowAddModal(false)
      resetAddForm()
    } catch (error) {
      // Error already handled in hook
    }
  }

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
      <div className="text-center mobile-card-spacing">
        <h1 className="mobile-heading font-cyber font-bold text-gradient mb-4">
          {t('whiskies')}
        </h1>
        <p className="mobile-text-size text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Dünyanın en iyi viskilerini keşfedin ve koleksiyonunuzu oluşturun
        </p>
        
        {user && (
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary mobile-button mobile-touch-target touch-friendly inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Yeni Viski Ekle
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Viski ara... (en az 3 karakter)"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="input-glass pl-10 pr-32"
            autoComplete="off"
          />
          {localSearchTerm.length > 0 && localSearchTerm.length < 3 && (
            <div className="absolute left-3 top-full mt-1 text-xs text-amber-500 z-10 bg-black/80 px-2 py-1 rounded">
              Arama için en az 3 karakter gereklidir
            </div>
          )}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-white/10 dark:bg-slate-800/30 rounded-lg p-1 backdrop-blur-md border border-white/20">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-amber-500/30 text-amber-200 shadow-lg'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/10'
                }`}
                title="Grid Görünümü"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-amber-500/30 text-amber-200 shadow-lg'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/10'
                }`}
                title="Liste Görünümü"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-glass p-2 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Quick Clear Button - Always Visible */}
            {(localSearchTerm || selectedCountry || selectedType) && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedCountry('')
                  setSelectedType('')
                  setLocalSearchTerm('')
                  setDebouncedSearchTerm('')
                  setCurrentPage(1)
                }}
                className="btn-glass p-2 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-400/20"
                title="Tüm filtreleri temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid md:grid-cols-3 gap-4 pt-4 border-t border-white/10 dark:border-white/5"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('country')}
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="input-glass"
              >
                <option value="">Tüm Ülkeler</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('whiskyType')}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-glass"
              >
                <option value="">Tüm Tipler</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Clear filters clicked') // Debug log
                  setSelectedCountry('')
                  setSelectedType('')
                  setLocalSearchTerm('')
                  setDebouncedSearchTerm('')
                  setCurrentPage(1) // Reset page to 1
                }}
                className="btn-glass w-full flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Filtreleri Temizle
              </button>
            </div>
          </motion.div>
        )}
      </div>



      {/* Results Count and Grid Settings */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-slate-600 dark:text-slate-300">
          {filteredWhiskies.length} viski bulundu • Sayfa {currentPage} / {totalPages}
        </div>
        
        {viewMode === 'grid' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">Sütun:</span>
              <select
                value={gridColumns}
                onChange={(e) => setGridColumns(Number(e.target.value) as 2 | 3 | 4 | 5 | 6)}
                className="input-glass text-sm px-3 py-1"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">Sayfa başı:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="input-glass text-sm px-3 py-1"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={18}>18</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>
        )}
        
        {viewMode === 'list' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">Sayfa başı:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="input-glass text-sm px-3 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        )}
      </div>

      {/* Top Pagination */}
      <PaginationControls />

      {/* Whiskies Grid/List */}
      <div className={viewMode === 'grid' ? `grid grid-cols-1 ${gridColumnClasses[gridColumns]} gap-6` : 'space-y-4'}>
        {paginatedWhiskies.map((whisky, index) => (
          <motion.div
            key={whisky.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`card group hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 ${
              viewMode === 'list' ? 'flex items-center gap-6' : ''
            }`}
          >
            {viewMode === 'grid' ? (
              // Grid View
              <>
                {/* Image */}
                <div className="relative h-64 md:h-72 lg:h-80 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 shadow-lg ring-1 ring-white/20 dark:ring-white/10">
                  <button
                    onClick={() => handleViewWhisky(whisky)}
                    className="w-full h-full block cursor-pointer group"
                    title="Detayları görüntüle"
                  >
                    {whisky.image_url ? (
                      <img
                        src={whisky.image_url}
                        alt={whisky.name}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Wine className="w-16 h-16 text-amber-400" />
                      </div>
                    )}
                  </button>
                  
                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleViewWhisky(whisky)}
                      className="p-2 rounded-full bg-amber-600/20 hover:bg-amber-500/30 text-amber-100 hover:text-white backdrop-blur-md border border-amber-400/20 hover:border-amber-300/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                      title="Detayları Görüntüle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {/* Translation Management Button - for admin users only */}
                    {user && profile && profile.role === 'admin' && (
                      <button
                        onClick={() => handleTranslateWhisky(whisky)}
                        className="p-2 rounded-full bg-blue-600/20 hover:bg-blue-500/30 text-blue-100 hover:text-white backdrop-blur-md border border-blue-400/20 hover:border-blue-300/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                        title="Çevirileri Yönet"
                      >
                        <Globe className="w-4 h-4" />
                      </button>
                    )}
                    
                    {user && (
                      <>
                        <button
                          onClick={() => addToCollection(whisky.id)}
                          disabled={isInCollection(whisky.id)}
                          className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg ${
                            isInCollection(whisky.id)
                              ? 'bg-emerald-600/25 hover:bg-emerald-500/35 text-emerald-100 border-emerald-400/30 shadow-emerald-500/25'
                              : 'bg-orange-600/20 hover:bg-orange-500/30 text-orange-100 hover:text-white border-orange-400/20 hover:border-orange-300/30 shadow-orange-500/25'
                          }`}
                          title={isInCollection(whisky.id) ? 'Koleksiyonda' : 'Koleksiyona Ekle'}
                        >
                          {isInCollection(whisky.id) ? (
                            <Heart className="w-4 h-4 fill-current" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => markAsTasted(whisky.id)}
                          className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg ${
                            isTasted(whisky.id)
                              ? 'bg-yellow-600/25 hover:bg-yellow-500/35 text-yellow-100 border-yellow-400/30 shadow-yellow-500/25'
                              : 'bg-amber-700/20 hover:bg-amber-600/30 text-amber-100 hover:text-white border-amber-500/20 hover:border-amber-400/30 shadow-amber-600/25'
                          }`}
                          title={isTasted(whisky.id) ? 'Tadıldı' : 'Tadıldı Olarak İşaretle'}
                        >
                          <Star className={`w-4 h-4 ${isTasted(whisky.id) ? 'fill-current' : ''}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <button
                      onClick={() => handleViewWhisky(whisky)}
                      className="text-left hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      title="Detayları görüntüle"
                    >
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {whisky.name}
                      </h3>
                    </button>
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                      {whisky.type}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{whisky.country}</span>
                      {whisky.region && <span>/ {whisky.region}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      <span>{whisky.alcohol_percentage}</span>
                    </div>
                  </div>

                  {whisky.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                      {whisky.description}
                    </p>
                  )}

                  {/* Tasting Notes Preview */}
                  {(whisky.aroma || whisky.taste || whisky.finish) && (
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {whisky.aroma && (
                        <div>
                          <span className="font-medium">Koku:</span> {whisky.aroma.substring(0, 50)}...
                        </div>
                      )}
                      {whisky.taste && (
                        <div>
                          <span className="font-medium">Tat:</span> {whisky.taste.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // List View
              <>
                {/* Image */}
                <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 shadow-lg ring-1 ring-white/20 dark:ring-white/10">
                  <button
                    onClick={() => handleViewWhisky(whisky)}
                    className="w-full h-full block cursor-pointer group"
                    title="Detayları görüntüle"
                  >
                    {whisky.image_url ? (
                      <img
                        src={whisky.image_url}
                        alt={whisky.name}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Wine className="w-8 h-8 text-amber-400" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div>
                    <button
                      onClick={() => handleViewWhisky(whisky)}
                      className="text-left hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      title="Detayları görüntüle"
                    >
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {whisky.name}
                      </h3>
                    </button>
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                      {whisky.type}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{whisky.country}</span>
                      {whisky.region && <span>/ {whisky.region}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      <span>{whisky.alcohol_percentage}%</span>
                    </div>
                  </div>

                  {whisky.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {whisky.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewWhisky(whisky)}
                    className="p-2 rounded-lg bg-amber-600/20 hover:bg-amber-500/30 text-amber-100 hover:text-white backdrop-blur-md border border-amber-400/20 hover:border-amber-300/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Detayları Görüntüle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {/* Translation Management Button - for admin users only */}
                  {user && profile && profile.role === 'admin' && (
                    <button
                      onClick={() => handleTranslateWhisky(whisky)}
                      className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-500/30 text-blue-100 hover:text-white backdrop-blur-md border border-blue-400/20 hover:border-blue-300/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Çevirileri Yönet"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  )}
                  
                  {user && (
                    <>
                      <button
                        onClick={() => addToCollection(whisky.id)}
                        disabled={isInCollection(whisky.id)}
                        className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${
                          isInCollection(whisky.id)
                            ? 'bg-emerald-600/25 hover:bg-emerald-500/35 text-emerald-100 border-emerald-400/30 shadow-emerald-500/25'
                            : 'bg-orange-600/20 hover:bg-orange-500/30 text-orange-100 hover:text-white border-orange-400/20 hover:border-orange-300/30 shadow-orange-500/25'
                        }`}
                        title={isInCollection(whisky.id) ? 'Koleksiyonda' : 'Koleksiyona Ekle'}
                      >
                        {isInCollection(whisky.id) ? (
                          <Heart className="w-4 h-4 fill-current" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => markAsTasted(whisky.id)}
                        className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${
                          isTasted(whisky.id)
                            ? 'bg-yellow-600/25 hover:bg-yellow-500/35 text-yellow-100 border-yellow-400/30 shadow-yellow-500/25'
                            : 'bg-amber-700/20 hover:bg-amber-600/30 text-amber-100 hover:text-white border-amber-500/20 hover:border-amber-400/30 shadow-amber-600/25'
                        }`}
                        title={isTasted(whisky.id) ? 'Tadıldı' : 'Tadıldı Olarak İşaretle'}
                      >
                        <Star className={`w-4 h-4 ${isTasted(whisky.id) ? 'fill-current' : ''}`} />
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom Pagination */}
      <PaginationControls />

      {/* Empty State */}
      {filteredWhiskies.length === 0 && (
        <div className="text-center py-12">
          <Wine className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Viski bulunamadı
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Arama kriterlerinizi değiştirerek tekrar deneyin
          </p>
        </div>
      )}

      {/* Add Whisky Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content rounded-2xl mobile-card-spacing w-full max-w-2xl mobile-modal overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Yeni Viski Ekle
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetAddForm()
                }}
                className="modal-text-muted hover:text-slate-600 dark:hover:text-slate-300 p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWhisky} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Viski Resmi *
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                    />
                  </div>
                  {imagePreview && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      <img 
                        src={imagePreview} 
                        alt="Önizleme" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Viski Adı *
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Örn: Macallan 18"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Tip
                  </label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="Single Malt">Single Malt</option>
                    <option value="Blended">Blended</option>
                    <option value="Bourbon">Bourbon</option>
                    <option value="Rye">Rye</option>
                    <option value="Irish">Irish</option>
                    <option value="Canadian">Canadian</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Ülke
                  </label>
                  <input
                    type="text"
                    value={addForm.country}
                    onChange={(e) => setAddForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Örn: İskoçya"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Bölge
                  </label>
                  <input
                    type="text"
                    value={addForm.region}
                    onChange={(e) => setAddForm(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Örn: Speyside"
                  />
                </div>

                {/* Alcohol Percentage */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Alkol Oranı (%)
                  </label>
                  <input
                    type="number"
                    value={addForm.alcohol_percentage}
                    onChange={(e) => setAddForm(prev => ({ ...prev, alcohol_percentage: parseFloat(e.target.value) || 40 }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Puanlama (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={addForm.rating || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, rating: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Örn. 85.5"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Yaş (Yıl)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={addForm.age_years || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, age_years: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Örn. 18 (NAS için boş bırakın)"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Renk
                  </label>
                  <input
                    type="text"
                    value={addForm.color}
                    onChange={(e) => setAddForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Örn: Koyu kehribar"
                  />
                </div>
              </div>

              {/* Aroma */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Aroma
                </label>
                <textarea
                  value={addForm.aroma}
                  onChange={(e) => setAddForm(prev => ({ ...prev, aroma: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none"
                  placeholder="Aroma notlarını açıklayın..."
                  rows={3}
                />
              </div>

              {/* Taste */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tat
                </label>
                <textarea
                  value={addForm.taste}
                  onChange={(e) => setAddForm(prev => ({ ...prev, taste: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none"
                  placeholder="Tat notlarını açıklayın..."
                  rows={3}
                />
              </div>

              {/* Finish */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Final
                </label>
                <textarea
                  value={addForm.finish}
                  onChange={(e) => setAddForm(prev => ({ ...prev, finish: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none"
                  placeholder="Final notlarını açıklayın..."
                  rows={3}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Genel Açıklama
                </label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-none"
                  placeholder="Viski hakkında genel bilgiler..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetAddForm()
                  }}
                  className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !addForm.name.trim() || !selectedImage}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? 'Ekleniyor...' : 'Viski Ekle'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Whisky Detail Modal */}
      {viewingWhisky && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Viski Detayları
              </h3>
              <button
                onClick={() => setViewingWhisky(null)}
                className="p-2 modal-text-muted hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
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
                    <button
                      onClick={() => handleImageClick(viewingWhisky.image_url!, viewingWhisky.name)}
                      className="w-full h-80 block cursor-pointer group rounded-2xl overflow-hidden"
                      title="Resmi büyüt"
                    >
                      <img
                        src={viewingWhisky.image_url}
                        alt={viewingWhisky.name}
                        className="w-full h-full object-cover shadow-lg transition-all duration-300 group-hover:scale-105"
                      />
                    </button>
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
                <div className="modal-bg-section rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-semibold modal-text-primary mb-4">Temel Bilgiler</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium modal-text-muted">Tip</label>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          {viewingWhisky.type}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium modal-text-muted">Ülke</label>
                      <p className="mt-1 modal-text-primary font-medium">{viewingWhisky.country}</p>
                    </div>
                    
                    {viewingWhisky.rating && (
                      <div>
                        <label className="text-sm font-medium modal-text-muted">Puanlama</label>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            {viewingWhisky.rating}/100
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {viewingWhisky.age_years && (
                      <div>
                        <label className="text-sm font-medium modal-text-muted">Yaş</label>
                        <p className="mt-1 modal-text-primary font-medium">{viewingWhisky.age_years} yıl</p>
                      </div>
                    )}
                    
                    {viewingWhisky.region && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium modal-text-muted">Bölge</label>
                        <p className="mt-1 modal-text-primary font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          {viewingWhisky.region}
                        </p>
                      </div>
                    )}
                    
                    {viewingWhisky.color && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium modal-text-muted">Renk</label>
                        <p className="mt-1 modal-text-primary">{viewingWhisky.color}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collection Status */}
                {user && (
                  <div className="modal-bg-section rounded-xl p-4">
                    <h4 className="text-lg font-semibold modal-text-primary mb-3">Koleksiyon Durumu</h4>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => addToCollection(viewingWhisky.id)}
                        disabled={isInCollection(viewingWhisky.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border transition-all duration-300 shadow-lg ${
                          isInCollection(viewingWhisky.id)
                            ? 'bg-emerald-600/25 text-emerald-200 border-emerald-400/30 cursor-default shadow-emerald-500/25'
                            : 'bg-orange-600/20 hover:bg-orange-500/30 text-orange-200 hover:text-orange-100 border-orange-400/20 hover:border-orange-300/30 shadow-orange-500/25'
                        }`}
                      >
                        {isInCollection(viewingWhisky.id) ? (
                          <>
                            <Heart className="w-4 h-4 fill-current" />
                            Koleksiyonda
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Koleksiyona Ekle
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => markAsTasted(viewingWhisky.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border transition-all duration-300 shadow-lg ${
                          isTasted(viewingWhisky.id)
                            ? 'bg-yellow-600/25 text-yellow-200 border-yellow-400/30 shadow-yellow-500/25'
                            : 'bg-amber-700/20 hover:bg-amber-600/30 text-amber-200 hover:text-amber-100 border-amber-500/20 hover:border-amber-400/30 shadow-amber-600/25'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isTasted(viewingWhisky.id) ? 'fill-current' : ''}`} />
                        {isTasted(viewingWhisky.id) ? 'Tadıldı' : 'Tadıldı Olarak İşaretle'}
                      </button>
                    </div>
                  </div>
                )}
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
                    <div className="bg-white/20 dark:bg-slate-700/20 rounded-xl p-4">
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
                    <div className="bg-white/20 dark:bg-slate-700/20 rounded-xl p-4">
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
                    <div className="bg-white/20 dark:bg-slate-700/20 rounded-xl p-4">
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

              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-8 pt-6 border-t border-white/20 dark:border-slate-600">
              <button
                onClick={() => setViewingWhisky(null)}
                className="px-6 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && viewingImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-[90vw] max-h-[90vh] flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowImageViewer(false)
                setViewingImage(null)
              }}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors z-10"
              title="Kapat"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image Title */}
            <div className="absolute -top-12 left-0 text-white font-medium text-lg mb-4 max-w-[calc(100%-4rem)]">
              <h3 className="truncate">{viewingImage.name}</h3>
            </div>

            {/* Image Container */}
            <div className="relative bg-black/50 rounded-lg overflow-hidden shadow-2xl">
              <img
                src={viewingImage.url}
                alt={viewingImage.name}
                className="max-w-full max-h-[80vh] object-contain"
                style={{ minWidth: '300px', minHeight: '300px' }}
              />
            </div>

            {/* Image Info */}
            <div className="mt-4 text-center text-white/80 text-sm">
              Resmi büyütmek için tıklayın
            </div>
          </motion.div>

          {/* Background Click to Close */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={() => {
              setShowImageViewer(false)
              setViewingImage(null)
            }}
          />
        </div>
      )}

      {/* Translation Manager */}
      {showTranslationManager && translatingWhisky && (
        <TranslationManager
          whiskyId={translatingWhisky.id}
          onClose={() => setShowTranslationManager(false)}
          onSave={handleTranslationSave}
        />
      )}
    </div>
  )
}
