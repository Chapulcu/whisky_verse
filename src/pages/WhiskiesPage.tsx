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
  Eye,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useDbAchievements } from '@/hooks/useDbAchievements'
import { useWhiskiesMultilingual, MultilingualWhisky, AppLanguage } from '@/hooks/useWhiskiesMultilingual'
import { useUserCollection } from '@/hooks/useUserCollection'
import { useSwipeGestures, usePullToRefresh } from '@/hooks/useSwipeGestures'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { PullToRefreshIndicator } from '@/components/mobile/PullToRefreshIndicator'
import { WhiskyErrorBoundary } from '@/components/WhiskyErrorBoundary'
import { WhiskySkeleton, WhiskySkeletonMini } from '@/components/WhiskySkeleton'

interface UserWhisky {
  id: number
  whisky_id: number
  tasted: boolean
  rating: number | null
  personal_notes: string | null
}

/**
 * CRITICAL TRANSLATION REMINDER:
 * ================================
 *
 * 🚨 NEVER USE STATIC TEXT IN UI COMPONENTS!
 *
 * ✅ ALWAYS use: t('translationKey')
 * ❌ NEVER use: "Static text"
 *
 * Supported languages: Turkish (tr), English (en), Russian (ru), Bulgarian (bg)
 *
 * Before committing ANY changes:
 * 1. Ensure ALL user-facing text uses t() function
 * 2. Test in ALL 4 languages
 * 3. Add missing translation keys to all language files
 *
 * Translation files location:
 * - public/locales/tr/translation.json
 * - public/locales/en/translation.json
 * - public/locales/ru/translation.json
 * - public/locales/bg/translation.json
 */
function WhiskiesPageContent() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const { hapticSuccess, hapticButton } = useHapticFeedback()
  const { whiskies, totalCount, loading: whiskyLoading, isRefetching: whiskyRefetching, loadWhiskies } = useWhiskiesMultilingual()
  const { collection: userCollection, loading: userCollectionLoading, addToCollection: addToCollectionHook, updateCollectionItem } = useUserCollection()
  const { addWhisky } = useDbAchievements()

  const containerRef = useRef<HTMLDivElement>(null)

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
  const [viewingWhisky, setViewingWhisky] = useState<MultilingualWhisky | null>(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null)

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    hapticButton()
    try {
      await loadWhiskies({
        search: debouncedSearchTerm,
        country: selectedCountry,
        type: selectedType,
        letter: selectedLetter,
        page: 1,
        limit: itemsPerPage
      })
      hapticSuccess()
      toast.success(t('whiskiesPage.refreshSuccess') || 'Viski listesi yenilendi!')
    } catch (error) {
      console.error('Refresh failed:', error)
      toast.error(t('whiskiesPage.refreshError') || 'Yenileme başarısız')
    }
  }

  const { isRefreshing, isPulling, pullDistance, progress } = usePullToRefresh(
    containerRef,
    handleRefresh,
    {
      threshold: 80,
      maxPullDistance: 150,
      enableHaptic: true,
      disabled: loading || whiskyRefetching
    }
  )


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
    if (whiskyId) {
      const whiskyIdNum = parseInt(whiskyId)
      console.log('🔗 URL parameter detected - Whisky ID:', whiskyIdNum)

      // First try to find in loaded whiskies
      if (whiskies.length > 0) {
        console.log('📚 Searching in loaded whiskies:', whiskies.length, 'items')
        const targetWhisky = whiskies.find(w => w.id === whiskyIdNum)
        if (targetWhisky) {
          console.log('✅ Found whisky in loaded list:', targetWhisky.name)
          setViewingWhisky(targetWhisky)
          // Clear the URL parameter after a short delay to ensure modal opens
          setTimeout(() => {
            setSearchParams(prev => {
              const newParams = new URLSearchParams(prev)
              newParams.delete('id')
              return newParams
            })
          }, 100)
          return
        } else {
          console.log('❌ Whisky not found in loaded list, will fetch from database')
        }
      } else {
        console.log('📭 No whiskies loaded yet, will fetch from database')
      }

      // If not found in loaded whiskies, fetch directly from database
      const fetchWhiskyById = async () => {
        try {
          console.log('🔄 Fetching whisky from database with ID:', whiskyIdNum)
          console.log('🌍 Current language:', i18n.language)

          // Use the same query structure as useWhiskiesMultilingual hook
          const { data: whiskyData, error: whiskyError } = await supabase
            .from('whiskies')
            .select(`
              id,
              name,
              image_url,
              alcohol_percentage,
              rating,
              age_years,
              country,
              region,
              type,
              description,
              aroma,
              taste,
              finish,
              color,
              created_at,
              whisky_translations:whisky_translations (
                language_code,
                name,
                description,
                aroma,
                taste,
                finish,
                color,
                region,
                type,
                country,
                translation_status
              )
            `)
            .eq('id', whiskyIdNum)
            .single()

          if (whiskyError || !whiskyData) {
            console.error('❌ Error fetching whisky by ID:', whiskyError)
            return
          }

          console.log('✅ Whisky fetched from database:', whiskyData.name)
          console.log('📝 Available translations:', whiskyData.whisky_translations?.map(t => t.language_code) || [])

          // Apply same translation logic as useWhiskiesMultilingual
          const currentLang = i18n.language as AppLanguage
          let bestTranslation = null

          // For Turkish, prefer original data
          if (currentLang !== 'tr' && whiskyData.whisky_translations) {
            // Try to find translation for current language first
            const fallbackOrder: AppLanguage[] = ['tr', 'en', 'ru', 'bg']
            const pref = [currentLang, ...fallbackOrder.filter(code => code !== currentLang)]
            for (const code of pref) {
              const t = whiskyData.whisky_translations.find(x => x.language_code === code)
              if (t) {
                bestTranslation = t
                console.log(`🎯 Using ${code} translation for ${currentLang}`)
                break
              }
            }
          }

          // Build MultilingualWhisky object with proper localization
          const whisky: MultilingualWhisky = {
            id: whiskyData.id,
            image_url: whiskyData.image_url,
            alcohol_percentage: whiskyData.alcohol_percentage,
            rating: whiskyData.rating,
            age_years: whiskyData.age_years,
            country: bestTranslation?.country || whiskyData.country,
            name: bestTranslation?.name || whiskyData.name,
            description: bestTranslation?.description || whiskyData.description,
            aroma: bestTranslation?.aroma || whiskyData.aroma,
            taste: bestTranslation?.taste || whiskyData.taste,
            finish: bestTranslation?.finish || whiskyData.finish,
            color: bestTranslation?.color || whiskyData.color,
            region: bestTranslation?.region || whiskyData.region,
            type: bestTranslation?.type || whiskyData.type,
            language_code: bestTranslation ? bestTranslation.language_code : currentLang,
            translation_status: bestTranslation?.translation_status || (currentLang === 'tr' ? 'human' : undefined)
          }

          console.log('🎯 Final localized whisky data:', {
            name: whisky.name,
            language_code: whisky.language_code,
            hasDescription: !!whisky.description,
            hasAroma: !!whisky.aroma,
            hasTaste: !!whisky.taste,
            hasFinish: !!whisky.finish
          })

          setViewingWhisky(whisky)
          // Clear the URL parameter after a short delay to ensure modal opens
          setTimeout(() => {
            setSearchParams(prev => {
              const newParams = new URLSearchParams(prev)
              newParams.delete('id')
              return newParams
            })
          }, 100)
        } catch (error) {
          console.error('💥 Error fetching whisky:', error)
        }
      }

      fetchWhiskyById()
    }
  }, [searchParams, whiskies, setSearchParams, i18n.language])

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

      if (!result.error && result.data) {
        await addWhisky()
      }

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

        if (!result.error && result.data) {
          await addWhisky()
        }

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

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="text-center mobile-card-spacing animate-pulse">
          <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto mb-4 w-64"></div>
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto max-w-2xl mb-6"></div>
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
    <div ref={containerRef} className="space-y-8 relative overflow-hidden">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        isVisible={isPulling || isRefreshing}
        isRefreshing={isRefreshing}
        progress={progress}
        pullDistance={pullDistance}
        threshold={80}
      />
      {/* Header */}
      <div className="text-center mobile-card-spacing">
        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
          <h1 className="mobile-heading font-cyber font-bold text-gradient">
            {t('whiskiesPage.title')}
          </h1>
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing || whiskyRefetching || loading}
            className={`p-3 rounded-full transition-all duration-300 touch-friendly mobile-touch-target ${
              isRefreshing || whiskyRefetching || loading
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 hover:text-amber-700 dark:hover:text-amber-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/25'
            }`}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: (isRefreshing || whiskyRefetching) ? 360 : 0 }}
            transition={{
              rotate: { duration: 1, ease: "linear", repeat: (isRefreshing || whiskyRefetching) ? Infinity : 0 }
            }}
            title={isRefreshing || whiskyRefetching ? t('actions.refreshing') : t('actions.refresh')}
          >
            <RefreshCw className={`w-5 h-5 ${(isRefreshing || whiskyRefetching) ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        <p className="mobile-text-size text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t('whiskiesPage.subtitle')}
        </p>
      </div>

      {/* Modern Search and Filter Section */}
      <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        {/* Enhanced Search Bar with Smart Suggestions */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Search className={`w-5 h-5 transition-colors ${
              localSearchTerm.length >= 3 ? 'text-amber-400' : 'text-slate-400'
            }`} />
          </div>
          <input
            type="text"
            placeholder={t('whiskiesPage.searchPlaceholder')}
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="w-full pl-12 pr-20 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
            autoComplete="off"
          />

          {/* Search Status Indicator */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {isSearching ? (
              <div className="animate-spin w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full" />
            ) : localSearchTerm.length >= 3 ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            ) : localSearchTerm.length > 0 ? (
              <div className="text-xs text-amber-400 font-medium">
                {t('whiskiesPage.charactersNeeded', { count: 3 - localSearchTerm.length })}
              </div>
            ) : (
              <div className="text-slate-400">
                <Search className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Search Feedback */}
          {localSearchTerm.length > 0 && localSearchTerm.length < 3 && (
            <div className="absolute left-4 top-full mt-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-400/30 px-3 py-1 rounded-lg backdrop-blur animate-pulse">
              {t('whiskiesPage.searchMinCharsHint', { count: 3 - localSearchTerm.length })}
            </div>
          )}

        </div>


        {/* Controls Row - Mobile Optimized */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500/30 text-amber-200 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                title={t('whiskiesPage.gridView')}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-amber-500/30 text-amber-200 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                title={t('whiskiesPage.listView')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Toggle - Enhanced */}
            <button
              onClick={() => {
                hapticButton()
                setShowFilters(!showFilters)
              }}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 backdrop-blur-md border rounded-xl transition-all duration-300 hover:scale-105 ${
                showFilters
                  ? 'bg-amber-500/30 border-amber-400/50 text-amber-100 shadow-lg shadow-amber-500/25'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-300 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">{t('whiskiesPage.filters')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Clear and Results */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3">
            {(localSearchTerm || selectedCountry || selectedType || selectedLetter) && (
              <button
                onClick={() => {
                  hapticButton()
                  setSelectedCountry('')
                  setSelectedType('')
                  setSelectedLetter('')
                  setLocalSearchTerm('')
                  setDebouncedSearchTerm('')
                  setCurrentPage(1)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-red-200 text-xs md:text-sm font-medium transition-all hover:scale-105"
              >
                <X className="w-4 h-4" />
                <span className="hidden md:inline">{t('whiskiesPage.clear')}</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-2 md:px-3 py-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="font-bold text-amber-300">{totalCount}</span>
              <span className="hidden md:inline">{t('whiskiesPage.whiskiesFound')}</span>
              {(localSearchTerm || selectedCountry || selectedType || selectedLetter) && (
                <div className="ml-2 text-xs bg-blue-500/20 px-2 py-1 rounded-full border border-blue-400/30">
                  {t('whiskiesPage.filtered')}
                </div>
              )}
            </div>
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
                        title={t('whiskiesPage.letterCountTooltip', { count })}
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

            {/*
              TRANSLATION REMINDER:
              - NEVER use static text in UI components
              - ALWAYS use t('key') for all user-facing text
              - Support all 4 languages: tr, en, ru, bg
              - Test in all languages before committing
            */}
            <div className="col-span-full space-y-3">
              {/* Action Buttons - Simple and Clean */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Link
                  to="/nearby"
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-400/30 rounded-xl text-blue-200 text-sm font-medium transition-all duration-300 hover:scale-105 backdrop-blur shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                  onClick={() => hapticButton()}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{t('whiskiesPage.nearbyWhiskyBars')}</span>
                  <div className="ml-auto text-xs bg-blue-400/20 px-2 py-1 rounded-full">{t('whiskiesPage.map')}</div>
                </Link>

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    hapticButton()
                    setSelectedCountry('')
                    setSelectedType('')
                    setSelectedLetter('')
                    setLocalSearchTerm('')
                    setDebouncedSearchTerm('')
                    setCurrentPage(1)
                  }}
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 border border-red-400/30 rounded-xl text-red-200 text-sm font-medium transition-all duration-300 hover:scale-105 backdrop-blur shadow-lg hover:shadow-xl hover:shadow-red-500/25"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('whiskiesPage.resetFilters')}</span>
                  <div className="ml-auto text-xs bg-red-400/20 px-2 py-1 rounded-full">{t('whiskiesPage.clear')}</div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>



      {/* Enhanced Results Count and Grid Settings */}
      <div className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Info Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-slate-300 font-medium flex items-center gap-2">
              <span role="img" aria-hidden="true">📊</span>
              <span className="text-amber-300 font-bold text-lg">{totalCount}</span>
              <span className="hidden md:inline">{t('whiskiesPage.whiskiesFound')}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-1">
                <span className="text-amber-200">{t('whiskiesPage.pageStatus', { current: currentPage, total: totalPages })}</span>
              </div>

              {(localSearchTerm || selectedCountry || selectedType || selectedLetter) && (
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg px-3 py-1">
                  <span className="text-blue-200">
                    {t('whiskiesPage.filtersActive', { count: [localSearchTerm, selectedCountry, selectedType, selectedLetter].filter(Boolean).length })}
                  </span>
                </div>
              )}

              {totalCount > 100 && (
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-1">
                  <span className="text-green-200 text-xs">{t('whiskiesPage.largeCollection')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Settings Panel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {viewMode === 'grid' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-lg px-3 py-2">
                  <Grid3X3 className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300 font-medium">{t('whiskiesPage.columns')}:</span>
                  <select
                    id="gridColumnsSelect"
                    value={gridColumns}
                    onChange={(e) => {
                      hapticButton()
                      setGridColumns(Number(e.target.value) as 2 | 3 | 4 | 5 | 6)
                    }}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
                    aria-label={t('whiskiesPage.columnCount')}
                  >
                    <option value={2} className="bg-slate-800">2</option>
                    <option value={3} className="bg-slate-800">3</option>
                    <option value={4} className="bg-slate-800">4</option>
                    <option value={5} className="bg-slate-800">5</option>
                    <option value={6} className="bg-slate-800">6</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-lg px-3 py-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300 font-medium">{t('whiskiesPage.show')}:</span>
                  <select
                    id="itemsPerPageSelectGrid"
                    value={itemsPerPage}
                    onChange={(e) => {
                      hapticButton()
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
                    aria-label={t('whiskiesPage.itemsPerPage')}
                  >
                    <option value={6} className="bg-slate-800">6</option>
                    <option value={12} className="bg-slate-800">12</option>
                    <option value={18} className="bg-slate-800">18</option>
                    <option value={24} className="bg-slate-800">24</option>
                  </select>
                </div>
              </div>
            )}

            {viewMode === 'list' && (
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-lg px-3 py-2">
                <List className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300 font-medium">{t('whiskiesPage.show')}:</span>
                <select
                  id="itemsPerPageSelectList"
                  value={itemsPerPage}
                  onChange={(e) => {
                    hapticButton()
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
                  aria-label={t('whiskiesPage.listItemsPerPage')}
                >
                  <option value={5} className="bg-slate-800">5</option>
                  <option value={10} className="bg-slate-800">10</option>
                  <option value={15} className="bg-slate-800">15</option>
                  <option value={20} className="bg-slate-800">20</option>
                </select>
              </div>
            )}

            {/* Quick Tips */}
            <div className="text-xs text-slate-400 bg-slate-500/10 border border-slate-400/20 rounded-lg px-3 py-2 max-w-xs">
              <span role="img" aria-hidden="true">💡</span>{' '}
              {viewMode === 'grid' ? t('whiskiesPage.gridViewTip') : t('whiskiesPage.listViewTip')}
            </div>
          </div>
        </div>
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
            className={`relative bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl group hover:scale-[1.02] hover:shadow-3xl transition-all duration-500 hover:shadow-amber-500/30 hover:border-amber-400/40 hover:from-white/25 hover:via-white/15 hover:to-white/10 ${
              viewMode === 'list' ? 'flex items-center gap-6' : 'p-6'
            }`}
          >
            {viewMode === 'grid' ? (
              // Grid View
              <>
                {/* Enhanced Image with Glassmorphism */}
                <div className="relative h-80 md:h-96 lg:h-[420px] mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100/80 to-orange-100/80 dark:from-amber-900/40 dark:to-orange-900/40 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm group-hover:ring-amber-400/40 transition-all duration-500">
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
                  
                  {/* Enhanced Quick Actions */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleViewWhisky(whisky)}
                      className="p-2 rounded-full bg-amber-600/20 hover:bg-amber-500/30 text-amber-100 hover:text-white backdrop-blur-md border border-amber-400/20 hover:border-amber-300/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                      title={t('whiskiesPage.viewDetails')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    
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

                {/* Enhanced Content */}
                <div className="space-y-4 p-2">
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
                    <p className="text-base text-primary-600 dark:text-primary-400 font-semibold bg-gradient-to-r from-primary-50/60 to-primary-100/60 dark:from-primary-900/30 dark:to-primary-800/30 backdrop-blur-sm px-4 py-2 rounded-full inline-block border border-primary-200/30 dark:border-primary-700/30 shadow-lg">
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
                      <span className="font-semibold">
                        {whisky.alcohol_percentage && typeof whisky.alcohol_percentage === 'string' && whisky.alcohol_percentage.includes('%')
                          ? whisky.alcohol_percentage
                          : `${whisky.alcohol_percentage || 0}`}
                      </span>
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
                {/* Enhanced Image */}
                <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100/80 to-orange-100/80 dark:from-amber-900/40 dark:to-orange-900/40 shadow-xl ring-1 ring-white/30 dark:ring-white/20 backdrop-blur-sm group-hover:ring-amber-400/50 transition-all duration-300">
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

                {/* Enhanced Content */}
                <div className="flex-1 space-y-3 p-1">
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
                      <span>
                        {whisky.alcohol_percentage && typeof whisky.alcohol_percentage === 'string' && whisky.alcohol_percentage.includes('%')
                          ? whisky.alcohol_percentage
                          : `${whisky.alcohol_percentage || 0}`}
                      </span>
                    </div>
                  </div>

                  {whisky.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {whisky.description}
                    </p>
                  )}
                </div>

                {/* Enhanced Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handleViewWhisky(whisky)}
                    className="p-2 rounded-lg bg-amber-600/20 hover:bg-amber-500/30 text-amber-100 hover:text-white backdrop-blur-md border border-amber-400/20 hover:border-amber-300/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Detayları Görüntüle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  
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
      {/* Whisky Detail Modal */}
      {viewingWhisky && (() => {
        console.log('🎭 Rendering modal for whisky:', viewingWhisky.name)
        return true
      })() && (
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
