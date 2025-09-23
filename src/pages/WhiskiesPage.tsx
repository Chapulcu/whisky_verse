import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
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
import { useWhiskiesMultilingual, MultilingualWhisky } from '@/hooks/useWhiskiesMultilingual'
import { useUserCollection } from '@/hooks/useUserCollection'
import { TranslationManager } from '@/components/TranslationManager'
import { WhiskyErrorBoundary } from '@/components/WhiskyErrorBoundary'
import { WhiskySkeleton, WhiskySkeletonMini } from '@/components/WhiskySkeleton'

interface UserWhisky {
  id: number
  whisky_id: number
  tasted: boolean
  rating: number | null
  personal_notes: string | null
}

function WhiskiesPageContent() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const { uploadWhiskyImage, isUploading } = useWhiskyUpload()
  const { whiskies, totalCount, loading: whiskyLoading, isRefetching: whiskyRefetching, loadWhiskies } = useWhiskiesMultilingual()
  const { collection: userCollection, loading: userCollectionLoading, addToCollection: addToCollectionHook, updateCollectionItem } = useUserCollection()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert collection to legacy format for compatibility
  const userWhiskies = userCollection.map(item => ({
    id: item.id,
    whisky_id: item.whisky_id,
    tasted: item.tasted,
    rating: item.rating,
    personal_notes: item.personal_notes
  }))

  // Combined loading state for both whiskies and user collection
  const loading = whiskyLoading || userCollectionLoading
  const [isSearching, setIsSearching] = useState(false)
  // Removed old searchTerm state - now using localSearchTerm and debouncedSearchTerm
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedLetter, setSelectedLetter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Cleanup refs for memory management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
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

  // loadUserCollection is now handled by useUserCollection hook

  // Note: Loading state and user collection are now handled by hooks automatically

  // Local search state to prevent excessive API calls
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce the search term with proper cleanup
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm)
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [localSearchTerm])

  // Handle URL query parameter for whisky ID
  useEffect(() => {
    const whiskyId = searchParams.get('id')
    if (whiskyId && whiskies.length > 0) {
      const targetWhisky = whiskies.find(w => w.id === parseInt(whiskyId))
      if (targetWhisky) {
        setViewingWhisky(targetWhisky)
        // Clear the URL parameter after opening the modal
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev)
          newParams.delete('id')
          return newParams
        })
      }
    }
  }, [searchParams, whiskies, setSearchParams])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Load whiskies when search/filter/page/size or language changes (server-side pagination)
  useEffect(() => {
    if (debouncedSearchTerm.length >= 3 || debouncedSearchTerm.length === 0) {
      setIsSearching(true)
      const offset = (currentPage - 1) * itemsPerPage
      loadWhiskies(i18n.language as any, itemsPerPage, offset, debouncedSearchTerm, selectedCountry, selectedType)
        .finally(() => setIsSearching(false))
    }
  }, [debouncedSearchTerm, selectedCountry, selectedType, currentPage, itemsPerPage, i18n.language, loadWhiskies])

  const addToCollection = async (whiskyId: number) => {
    if (!user) {
      toast.error(t('loginRequiredCollection'))
      return
    }

    // Check if already in collection first
    const isAlreadyInCollection = userWhiskies.some(uw => uw.whisky_id === whiskyId)
    if (isAlreadyInCollection) {
      toast.error(t('whiskyAlreadyInCollection'))
      return
    }

    // Optimistic update: Add to local state immediately
    const optimisticItem = {
      id: Date.now(), // Temporary ID
      whisky_id: whiskyId,
      tasted: false,
      rating: null,
      personal_notes: null
    }

    // Create a fake collection item for optimistic update
    const optimisticCollectionItem = {
      id: optimisticItem.id,
      user_id: user.id,
      whisky_id: whiskyId,
      tasted: false,
      rating: null,
      personal_notes: null,
      tasted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      whisky: whiskies.find(w => w.id === whiskyId) || null
    }

    // Immediately update UI
    const setOptimisticCollection = (prev: any[]) => [optimisticCollectionItem, ...prev]

    try {
      // Show immediate feedback
      toast.success(t('whiskiesPage.toasts.addedToCollection'))

      const result = await addToCollectionHook(whiskyId)

      if (result.error) {
        console.error('Error adding to collection:', result.error)

        // Rollback optimistic update
        // The hook will handle the actual state management

        if (result.error.code === '23505') {
          toast.error(t('whiskyAlreadyInCollection'))
        } else {
          toast.error(t('addToCollectionError'))
        }
        return
      }

      // Trigger storage event to notify other components
      window.dispatchEvent(new CustomEvent('collectionUpdated', {
        detail: { action: 'added', whiskyId }
      }))

    } catch (error: any) {
      console.error('Error adding to collection:', error)
      toast.error(t('addToCollectionError'))
    }
  }

  const markAsTasted = async (whiskyId: number) => {
    if (!user) return

    const userWhisky = userWhiskies.find(uw => uw.whisky_id === whiskyId)
    const newTastedStatus = userWhisky ? !userWhisky.tasted : true

    // Optimistic update: Show immediate UI feedback
    toast.success(t('whiskiesPage.toasts.statusUpdated'))

    try {
      if (userWhisky) {
        // Update existing record using hook
        const result = await updateCollectionItem(userWhisky.id, {
          tasted: newTastedStatus,
          tasted_at: newTastedStatus ? new Date().toISOString() : null
        })

        if (result.error) {
          // Rollback toast
          toast.error(t('whiskiesPage.toasts.statusUpdateError'))
          throw result.error
        }
      } else {
        // Create new record using hook
        const result = await addToCollectionHook(whiskyId)

        if (result.error) {
          toast.error(t('whiskiesPage.toasts.statusUpdateError'))
          throw result.error
        }

        // Then update it to mark as tasted
        if (result.data) {
          const updateResult = await updateCollectionItem(result.data.id, {
            tasted: true,
            tasted_at: new Date().toISOString()
          })

          if (updateResult.error) {
            toast.error(t('whiskiesPage.toasts.statusUpdateError'))
            throw updateResult.error
          }
        }
      }
    } catch (error) {
      console.error('Error updating tasted status:', error)
      // Error toast already shown above
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
    // Reload whiskies to get updated data
    const offset = (currentPage - 1) * itemsPerPage
    loadWhiskies(i18n.language as any, itemsPerPage, offset, debouncedSearchTerm, selectedCountry, selectedType)
    setShowTranslationManager(false)
    setTranslatingWhisky(null)
  }

  const handleImageClick = (imageUrl: string, whiskyName: string) => {
    setViewingImage({ url: imageUrl, name: whiskyName })
    setShowImageViewer(true)
  }

  // Apply client-side letter filtering on top of server-side filtering
  const filteredWhiskies = useMemo(() => {
    if (!selectedLetter) return whiskies

    return whiskies.filter(whisky =>
      whisky.name.toLowerCase().startsWith(selectedLetter.toLowerCase())
    )
  }, [whiskies, selectedLetter])

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

  // Pagination calculations from server totalCount
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + (filteredWhiskies?.length || 0)
  const paginatedWhiskies = filteredWhiskies

  // Pagination Component
  const PaginationControls = ({ className = '' }: { className?: string }) => {
    if (totalPages <= 1) return null
    
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {Math.min(startIndex + 1, totalCount)}-{Math.min(startIndex + filteredWhiskies.length, totalCount)} / {totalCount} {t('whiskiesPage.showing')}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-md border border-white/20"
            title={t('whiskiesPage.previousPage')}
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
            title={t('whiskiesPage.nextPage')}
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
  }, [localSearchTerm, selectedCountry, selectedType, selectedLetter])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('whiskiesPage.toasts.validImageFile'))
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('whiskiesPage.toasts.maxFileSize'))
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
      toast.error(t('whiskiesPage.toasts.loginRequiredAdd'))
      return
    }

    if (!addForm.name.trim()) {
      toast.error(t('whiskiesPage.toasts.nameRequired'))
      return
    }

    if (!selectedImage) {
      toast.error(t('whiskiesPage.toasts.imageRequired'))
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

      // Reload whiskies with current pagination
      const offset = (currentPage - 1) * itemsPerPage
      await loadWhiskies(i18n.language as any, itemsPerPage, offset, debouncedSearchTerm, selectedCountry, selectedType)

      // Reset and close
      setShowAddModal(false)
      resetAddForm()
    } catch (error) {
      // Error already handled in hook
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="text-center mobile-card-spacing animate-pulse">
          <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto mb-4 w-64"></div>
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto max-w-2xl mb-6"></div>
          {user && (
            <div className="mt-6">
              <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-md w-48 mx-auto"></div>
            </div>
          )}
        </div>

        {/* Search and filters skeleton */}
        <div className="card space-y-4 animate-pulse">
          <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
        </div>

        {/* Results count skeleton */}
        <div className="flex justify-between items-center gap-4 animate-pulse">
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-64"></div>
          <div className="h-10 bg-slate-300 dark:bg-slate-700 rounded w-32"></div>
        </div>

        {/* Main content skeleton */}
        <WhiskySkeleton
          viewMode={viewMode}
          gridColumns={gridColumns}
          count={itemsPerPage}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mobile-card-spacing">
        <h1 className="mobile-heading font-cyber font-bold text-gradient mb-4">
          {t('whiskiesPage.title')}
        </h1>
        <p className="mobile-text-size text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t('whiskiesPage.subtitle')}
        </p>
        
        {user && (
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary mobile-button mobile-touch-target touch-friendly inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('whiskiesPage.addNewWhisky')}
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="glass-panel space-y-4 p-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('whiskiesPage.searchPlaceholder')}
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="glass-input pl-10 pr-32 w-full"
            autoComplete="off"
          />
          {localSearchTerm.length > 0 && localSearchTerm.length < 3 && (
            <div className="absolute left-3 top-full mt-1 text-xs text-amber-500 z-10 bg-black/80 px-2 py-1 rounded">
              {t('whiskiesPage.searchMinChars')}
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
                title={t('whiskiesPage.gridView')}
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
                title={t('whiskiesPage.listView')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-glass p-2 flex items-center gap-2"
              title={t('whiskiesPage.toggleFilters')}
              aria-label={t('whiskiesPage.toggleFilters')}
            >
              <Filter className="w-4 h-4" />
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Quick Clear Button - Always Visible */}
            {(localSearchTerm || selectedCountry || selectedType || selectedLetter) && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedCountry('')
                  setSelectedType('')
                  setSelectedLetter('')
                  setLocalSearchTerm('')
                  setDebouncedSearchTerm('')
                  setCurrentPage(1)
                }}
                className="btn-glass p-2 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-400/20"
                title={t('whiskiesPage.clearAllFilters')}
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
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10 dark:border-white/5"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('country')}
              </label>
              <select
                id="countrySelect"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="glass-input w-full"
                aria-label={t('country')}
              >
                <option value="">{t('whiskiesPage.allCountries')}</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="typeSelect" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('whiskyType')}
              </label>
              <select
                id="typeSelect"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="glass-input w-full"
                aria-label={t('whiskyType')}
              >
                <option value="">{t('whiskiesPage.allTypes')}</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Alphabetical Filter */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {t('adminPage.whiskyManagement.filters.alphabetical')}
              </label>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl">
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

            <div className="flex items-end col-span-full">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Clear filters clicked') // Debug log
                  setSelectedCountry('')
                  setSelectedType('')
                  setSelectedLetter('')
                  setLocalSearchTerm('')
                  setDebouncedSearchTerm('')
                  setCurrentPage(1) // Reset page to 1
                }}
                className="btn-glass w-full flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {t('whiskiesPage.clearFilters')}
              </button>
            </div>
          </motion.div>
        )}
      </div>



      {/* Results Count and Grid Settings */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-slate-600 dark:text-slate-300">
          {totalCount} {t('whiskiesPage.whiskiesFound')} • {t('whiskiesPage.page')} {currentPage} / {totalPages}
        </div>
        
        {viewMode === 'grid' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t('whiskiesPage.column')}:</span>
              <select
                id="gridColumnsSelect"
                value={gridColumns}
                onChange={(e) => setGridColumns(Number(e.target.value) as 2 | 3 | 4 | 5 | 6)}
                className="glass-input text-sm px-3 py-1 w-full"
                aria-label={t('whiskiesPage.column')}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t('whiskiesPage.perPage')}:</span>
              <select
                id="itemsPerPageSelectGrid"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="glass-input text-sm px-3 py-1 w-full"
                aria-label={t('whiskiesPage.perPage')}
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
            <span className="text-sm text-slate-600 dark:text-slate-300">{t('whiskiesPage.perPage')}:</span>
            <select
              id="itemsPerPageSelectList"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="glass-input text-sm px-3 py-1 w-full"
              aria-label={t('whiskiesPage.perPage')}
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

      {/* Lightweight refetch/search indicator without clearing the list */}
      {(isSearching || whiskyRefetching) && (
        <div className="mb-4" data-testid="whisky-skeleton-mini">
          <WhiskySkeletonMini />
        </div>
      )}

      {/* Whiskies Grid/List - keep previous data while refetching */}
      <div
        data-testid="whisky-grid"
        className={viewMode === 'grid' ? `grid grid-cols-1 ${gridColumnClasses[gridColumns]} gap-8` : 'space-y-4'}
      >
          {paginatedWhiskies.map((whisky, index) => (
          <motion.div
            key={whisky.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`card group hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 hover:shadow-amber-500/20 hover:border-amber-300/30 ${
              viewMode === 'list' ? 'flex items-center gap-6' : 'p-6'
            }`}
          >
            {viewMode === 'grid' ? (
              // Grid View
              <>
                {/* Image */}
                <div className="relative h-80 md:h-96 lg:h-[420px] mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 shadow-2xl ring-2 ring-amber-200/30 dark:ring-amber-500/20">
                  <button
                    onClick={() => handleViewWhisky(whisky)}
                    className="w-full h-full block cursor-pointer group"
                    title={t('whiskiesPage.viewDetails')}
                  >
                    {whisky.image_url ? (
                      <img
                        src={whisky.image_url}
                        alt={whisky.name}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-125 shadow-inner"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Wine className="w-20 h-20 text-amber-400 drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                  
                  {/* Quick Actions */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleViewWhisky(whisky)}
                      className="p-2 rounded-full bg-amber-600/20 hover:bg-amber-500/30 text-amber-100 hover:text-white backdrop-blur-md border border-amber-400/20 hover:border-amber-300/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                      title={t('whiskiesPage.viewDetails')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {/* Translation Management Button - for admin users only */}
                    {user && profile && profile.role === 'admin' && (
                      <button
                        onClick={() => handleTranslateWhisky(whisky)}
                        className="p-2 rounded-full bg-blue-600/20 hover:bg-blue-500/30 text-blue-100 hover:text-white backdrop-blur-md border border-blue-400/20 hover:border-blue-300/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                        title={t('whiskiesPage.manageTranslations')}
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
                          title={isInCollection(whisky.id) ? t('whiskiesPage.inCollection') : t('whisky.addToCollection')}
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
                          title={isTasted(whisky.id) ? t('whiskiesPage.tasted') : t('whiskiesPage.markTasted')}
                        >
                          <Star className={`w-4 h-4 ${isTasted(whisky.id) ? 'fill-current' : ''}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 p-1">
                  <div>
                    <button
                      onClick={() => handleViewWhisky(whisky)}
                      className="text-left hover:text-amber-600 dark:hover:text-amber-400 transition-colors w-full"
                      title={t('whiskiesPage.viewDetails')}
                    >
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 leading-tight">
                        {whisky.name}
                      </h3>
                    </button>
                    <p className="text-base text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/50 dark:bg-primary-900/20 px-3 py-1 rounded-full inline-block">
                      {whisky.type}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-base text-slate-600 dark:text-slate-300 font-medium">
                    <div className="flex items-center gap-2 bg-slate-100/70 dark:bg-slate-800/50 px-3 py-2 rounded-lg">
                      <MapPin className="w-5 h-5 text-amber-500" />
                      <span>{whisky.country}</span>
                      {whisky.region && <span className="text-slate-500 dark:text-slate-400">/ {whisky.region}</span>}
                    </div>
                    <div className="flex items-center gap-2 bg-amber-100/70 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                      <Percent className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold">{whisky.alcohol_percentage}%</span>
                    </div>
                  </div>

                  {/* Rating display if available */}
                  {whisky.rating && (
                    <div className="flex items-center gap-2 bg-yellow-100/70 dark:bg-yellow-900/20 px-3 py-2 rounded-lg w-fit">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-semibold text-yellow-700 dark:text-yellow-300">{whisky.rating}/100</span>
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
                    title={t('whiskiesPage.viewDetails')}
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
                      title={t('whiskiesPage.viewDetails')}
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
            {t('whiskiesPage.noWhiskiesFound')}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {t('whiskiesPage.changeSearchCriteria')}
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
                {t('whiskiesPage.addWhiskyModal.title')}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetAddForm()
                }}
                className="modal-text-muted hover:text-slate-600 dark:hover:text-slate-300 p-2"
                aria-label={t('common.close')}
                title={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWhisky} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label htmlFor="whiskyImageInput" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t('whiskiesPage.addWhiskyModal.whiskyImageRequired')}
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      id="whiskyImageInput"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                    />
                  </div>
                  {imagePreview && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      <img 
                        src={imagePreview} 
                        alt={t('whiskiesPage.addWhiskyModal.preview')} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="addNameInput" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {t('whiskiesPage.addWhiskyModal.whiskyNameRequired')}
                  </label>
                  <input
                    id="addNameInput"
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('whiskiesPage.addWhiskyModal.whiskyNamePlaceholder')}
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label htmlFor="addTypeSelect" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {t('whiskiesPage.addWhiskyModal.type')}
                  </label>
                  <select
                    id="addTypeSelect"
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
                  <label htmlFor="addCountryInput" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {t('whisky.country')}
                  </label>
                  <input
                    id="addCountryInput"
                    type="text"
                    value={addForm.country}
                    onChange={(e) => setAddForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('whiskiesPage.addWhiskyModal.countryPlaceholder')}
                  />
                </div>

                {/* Region */}
                <div>
                  <label htmlFor="addRegionInput" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {t('whiskiesPage.addWhiskyModal.region')}
                  </label>
                  <input
                    id="addRegionInput"
                    type="text"
                    value={addForm.region}
                    onChange={(e) => setAddForm(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('whiskiesPage.addWhiskyModal.regionPlaceholder')}
                  />
                </div>

                {/* Alcohol Percentage */}
                <div>
                  <label htmlFor="addAbvInput" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {t('whiskiesPage.addWhiskyModal.alcoholPercent')}
                  </label>
                  <input
                    id="addAbvInput"
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
                    {t('whiskiesPage.addWhiskyModal.ratingLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={addForm.rating || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, rating: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('whiskiesPage.addWhiskyModal.ratingPlaceholder')}
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {t('whiskiesPage.addWhiskyModal.ageLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={addForm.age_years || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, age_years: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('whiskiesPage.addWhiskyModal.agePlaceholder')}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {t('whiskiesPage.addWhiskyModal.color')}
                  </label>
                  <input
                    type="text"
                    value={addForm.color}
                    onChange={(e) => setAddForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('whiskiesPage.addWhiskyModal.colorPlaceholder')}
                  />
                </div>
              </div>

              {/* Aroma */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t('whiskiesPage.addWhiskyModal.aroma')}
                </label>
                <textarea
                  value={addForm.aroma}
                  onChange={(e) => setAddForm(prev => ({ ...prev, aroma: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none"
                  placeholder={t('whiskiesPage.addWhiskyModal.aromaPlaceholder')}
                  rows={3}
                />
              </div>

              {/* Taste */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t('whiskiesPage.addWhiskyModal.taste')}
                </label>
                <textarea
                  value={addForm.taste}
                  onChange={(e) => setAddForm(prev => ({ ...prev, taste: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none"
                  placeholder={t('whiskiesPage.addWhiskyModal.tastePlaceholder')}
                  rows={3}
                />
              </div>

              {/* Finish */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t('whiskiesPage.addWhiskyModal.finish')}
                </label>
                <textarea
                  value={addForm.finish}
                  onChange={(e) => setAddForm(prev => ({ ...prev, finish: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none"
                  placeholder={t('whiskiesPage.addWhiskyModal.finishPlaceholder')}
                  rows={3}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t('whiskiesPage.addWhiskyModal.generalDescription')}
                </label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-none"
                  placeholder={t('whiskiesPage.addWhiskyModal.descriptionPlaceholder')}
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
                  {t('whiskiesPage.addWhiskyModal.cancel')}
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
                  {isUploading ? t('whiskiesPage.addWhiskyModal.adding') : t('whiskiesPage.addWhiskyModal.addWhisky')}
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
                {t('whiskiesPage.whiskyDetails')}
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
                  <h4 className="text-lg font-semibold modal-text-primary mb-4">{t('whiskiesPage.basicInfo')}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium modal-text-muted">{t('whiskiesPage.type')}</label>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          {viewingWhisky.type}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium modal-text-muted">{t('whisky.country')}</label>
                      <p className="mt-1 modal-text-primary font-medium">{viewingWhisky.country}</p>
                    </div>
                    
                    {viewingWhisky.rating && (
                      <div>
                        <label className="text-sm font-medium modal-text-muted">{t('whiskiesPage.rating')}</label>
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
                        <label className="text-sm font-medium modal-text-muted">{t('whiskiesPage.age')}</label>
                        <p className="mt-1 modal-text-primary font-medium">{viewingWhisky.age_years} {t('whiskiesPage.years')}</p>
                      </div>
                    )}
                    
                    {viewingWhisky.region && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium modal-text-muted">{t('whisky.region')}</label>
                        <p className="mt-1 modal-text-primary font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          {viewingWhisky.region}
                        </p>
                      </div>
                    )}
                    
                    {viewingWhisky.color && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium modal-text-muted">{t('whisky.color')}</label>
                        <p className="mt-1 modal-text-primary">{viewingWhisky.color}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collection Status */}
                {user && (
                  <div className="modal-bg-section rounded-xl p-4">
                    <h4 className="text-lg font-semibold modal-text-primary mb-3">{t('whiskiesPage.collectionStatus')}</h4>
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
                            {t('whiskiesPage.inCollection')}
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            {t('whisky.addToCollection')}
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
                        {isTasted(viewingWhisky.id) ? t('whiskiesPage.tasted') : t('whiskiesPage.markTasted')}
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
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-white">{t('whiskiesPage.tastingNotes')}</h4>
                  
                  {viewingWhisky.aroma && (
                    <div className="bg-white/20 dark:bg-slate-700/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">A</span>
                        </div>
                        <h5 className="font-medium text-slate-800 dark:text-white">{t('whiskiesPage.smell')}</h5>
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
                        <h5 className="font-medium text-slate-800 dark:text-white">{t('whiskiesPage.palate')}</h5>
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
                        <h5 className="font-medium text-slate-800 dark:text-white">{t('whiskiesPage.finish')}</h5>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 ml-10">{viewingWhisky.finish}</p>
                    </div>
                  )}
                  
                  {!viewingWhisky.aroma && !viewingWhisky.taste && !viewingWhisky.finish && (
                    <div className="text-center py-8">
                      <Wine className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">{t('whiskiesPage.noTastingNotes')}</p>
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
                {t('whiskiesPage.close')}
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
              title={t('whiskiesPage.close')}
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

// Main export with Error Boundary
export function WhiskiesPage() {
  return (
    <WhiskyErrorBoundary>
      <WhiskiesPageContent />
    </WhiskyErrorBoundary>
  )
}
