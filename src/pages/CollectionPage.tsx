import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { useUserCollectionMultilingual, MultilingualUserWhiskyDB } from '@/hooks/useUserCollectionMultilingual'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Wine,
  Star,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  X,
  Calendar,
  MapPin,
  Percent,
  Award,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  SlidersHorizontal,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

export function CollectionPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const {
    collection,
    loading,
    error,
    loadCollection,
    updateCollectionItem,
    removeFromCollection
  } = useUserCollectionMultilingual(i18n.language as any)

  const [searchTerm, setSearchTerm] = useState('')
  const [editingRating, setEditingRating] = useState<number | null>(null)
  const [editingNotes, setEditingNotes] = useState<number | null>(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [notesValue, setNotesValue] = useState('')
  const [selectedWhisky, setSelectedWhisky] = useState<MultilingualUserWhiskyDB['whisky'] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'tasted' | 'untasted'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'added_date' | 'country' | 'type'>('added_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [ratingFilter, setRatingFilter] = useState<number>(0)
  const [selectedLetter, setSelectedLetter] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)

  const filteredAndSortedCollection = useMemo(() => {
    const filtered = collection.filter(item => {
      const matchesSearch = item.whisky.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.whisky.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.whisky.country.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterType === 'all' ||
        (filterType === 'tasted' && item.tasted) ||
        (filterType === 'untasted' && !item.tasted)

      const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(item.whisky.country)
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.whisky.type)
      const matchesRating = ratingFilter === 0 || (item.rating || 0) >= ratingFilter
      const matchesLetter = !selectedLetter || item.whisky.name.toLowerCase().startsWith(selectedLetter.toLowerCase())

      return matchesSearch && matchesFilter && matchesCountry && matchesType && matchesRating && matchesLetter
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'name':
          aValue = a.whisky.name.toLowerCase()
          bValue = b.whisky.name.toLowerCase()
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'added_date':
          aValue = new Date(a.created_at || '').getTime()
          bValue = new Date(b.created_at || '').getTime()
          break
        case 'country':
          aValue = a.whisky.country.toLowerCase()
          bValue = b.whisky.country.toLowerCase()
          break
        case 'type':
          aValue = a.whisky.type.toLowerCase()
          bValue = b.whisky.type.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [collection, searchTerm, filterType, selectedCountries, selectedTypes, ratingFilter, selectedLetter, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCollection.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCollection = filteredAndSortedCollection.slice(startIndex, endIndex)

  // Get unique countries and types for filters
  const uniqueCountries = [...new Set(collection.map(item => item.whisky.country))].sort()
  const uniqueTypes = [...new Set(collection.map(item => item.whisky.type))].sort()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const handleRating = async (itemId: number, rating: number) => {
    try {
      await updateCollectionItem(itemId, { 
        rating, 
        tasted: true,
        tasted_at: new Date().toISOString()
      })
      setEditingRating(null)
      toast.success(t('collectionPage.toasts.ratingUpdated'))
    } catch (error) {
      toast.error(t('collectionPage.toasts.ratingUpdateError'))
    }
  }

  const handleRemove = async (itemId: number, whiskyName: string) => {
    if (!confirm(`"${whiskyName}" ${t('collectionPage.whiskyCard.confirmRemove')}`)) {
      return
    }
    
    try {
      await removeFromCollection(itemId)
      toast.success(t('collectionPage.toasts.whiskyRemoved'))
    } catch (error) {
      toast.error(t('collectionPage.toasts.whiskyRemoveError'))
    }
  }

  const handleNotesEdit = (itemId: number, currentNotes: string) => {
    setEditingNotes(itemId)
    setNotesValue(currentNotes || '')
  }

  const handleNotesSave = async (itemId: number) => {
    try {
      await updateCollectionItem(itemId, { 
        personal_notes: notesValue.trim() || null,
        updated_at: new Date().toISOString()
      })
      setEditingNotes(null)
      setNotesValue('')
      toast.success(t('collectionPage.toasts.noteUpdated'))
    } catch (error) {
      toast.error(t('collectionPage.toasts.noteUpdateError'))
    }
  }

  const handleNotesCancel = () => {
    setEditingNotes(null)
    setNotesValue('')
  }

  const handleWhiskyDetail = (whisky: MultilingualUserWhiskyDB['whisky']) => {
    setSelectedWhisky(whisky)
    setIsModalOpen(true)
  }

  const renderStars = (rating: number, itemId: number, editable: boolean = false) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => editable && setRatingValue(i)}
          disabled={!editable}
          className={`${
            i <= rating 
              ? 'text-amber-400' 
              : 'text-slate-300 dark:text-slate-600'
          } ${editable ? 'hover:text-amber-400 cursor-pointer' : 'cursor-default'} transition-colors`}
        >
          <Star className={`w-4 h-4 ${i <= rating ? 'fill-current' : ''}`} />
        </button>
      )
    }
    return stars
  }

  const getStats = () => {
    const total = collection.length
    const tasted = collection.filter(item => item.tasted).length
    const avgRating = collection.filter(item => item.rating > 0)
      .reduce((acc, item) => acc + (item.rating || 0), 0) / 
      collection.filter(item => item.rating > 0).length || 0
    
    return { total, tasted, untasted: total - tasted, avgRating }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-lg font-medium">{t('collectionPage.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Wine className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-4">{t('collectionPage.error')}</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => loadCollection()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('collectionPage.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
            {t('collectionPage.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {collection.length} {t('collectionPage.subtitle')}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.total}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('collectionPage.stats.totalWhisky')}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.tasted}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('collectionPage.stats.tasted')}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.untasted}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('collectionPage.stats.untasted')}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('collectionPage.stats.avgRating')}</div>
          </div>
        </motion.div>

        {/* Basic Search and Quick Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t('collectionPage.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass w-full pl-10 pr-4 py-3"
              />
            </div>

            {/* Quick Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Basic Filter */}
              <div className="relative flex-1 sm:flex-none sm:min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="input-glass w-full pl-9 pr-8 py-2.5 text-sm appearance-none"
                >
                  <option value="all">{t('collectionPage.search.filters.all')}</option>
                  <option value="tasted">{t('collectionPage.search.filters.tasted')}</option>
                  <option value="untasted">{t('collectionPage.search.filters.untasted')}</option>
                </select>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                className="glass-button-secondary px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 min-h-[42px]"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">{t('collectionPage.advancedFilters.title')}</span>
                {isAdvancedFiltersOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Advanced Filters - Collapsible */}
        <AnimatePresence>
          {isAdvancedFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="glass-card p-4 mb-6 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="font-medium text-slate-800 dark:text-white">{t('collectionPage.advancedFilters.detailedFilters')}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedCountries([])
                    setSelectedTypes([])
                    setRatingFilter(0)
                    setSelectedLetter('')
                    setSortBy('added_date')
                    setSortOrder('desc')
                    setCurrentPage(1)
                  }}
                  className="glass-button-danger px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <X className="w-4 h-4 mr-1" />
                  {t('collectionPage.advancedFilters.clearAll')}
                </button>
              </div>

              {/* Mobile-Optimized Filter Grid */}
              <div className="space-y-4">
                {/* Sort By - Full Width on Mobile */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('collectionPage.advancedFilters.sortBy')}
                  </label>
                  <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [sort, order] = e.target.value.split('-')
                        setSortBy(sort as any)
                        setSortOrder(order as any)
                        setCurrentPage(1)
                      }}
                      className="input-glass pl-10 pr-8 py-3 text-sm w-full rounded-xl"
                    >
                      <option value="added_date-desc">{t('collectionPage.advancedFilters.newestFirst')}</option>
                      <option value="added_date-asc">{t('collectionPage.advancedFilters.oldestFirst')}</option>
                      <option value="name-asc">{t('collectionPage.advancedFilters.nameAZ')}</option>
                      <option value="name-desc">{t('collectionPage.advancedFilters.nameZA')}</option>
                      <option value="rating-desc">{t('collectionPage.advancedFilters.highestRated')}</option>
                      <option value="rating-asc">{t('collectionPage.advancedFilters.lowestRated')}</option>
                      <option value="country-asc">{t('collectionPage.advancedFilters.countryAZ')}</option>
                      <option value="type-asc">{t('collectionPage.advancedFilters.typeAZ')}</option>
                    </select>
                  </div>
                </div>

                {/* Countries and Types - Side by Side on Tablet+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Country Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('collectionPage.advancedFilters.countries')} ({selectedCountries.length})
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto glass rounded-lg p-2">
                      {uniqueCountries.map(country => (
                        <label key={country} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCountries.includes(country)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCountries([...selectedCountries, country])
                              } else {
                                setSelectedCountries(selectedCountries.filter(c => c !== country))
                              }
                              setCurrentPage(1)
                            }}
                            className="w-4 h-4 text-amber-500 bg-transparent border-2 border-amber-400 rounded focus:ring-amber-500 focus:ring-2"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{country}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('collectionPage.advancedFilters.types')} ({selectedTypes.length})
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto glass rounded-lg p-2">
                      {uniqueTypes.map(type => (
                        <label key={type} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTypes([...selectedTypes, type])
                              } else {
                                setSelectedTypes(selectedTypes.filter(t => t !== type))
                              }
                              setCurrentPage(1)
                            }}
                            className="w-4 h-4 text-blue-500 bg-transparent border-2 border-blue-400 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('collectionPage.advancedFilters.minRating')}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => {
                          setRatingFilter(rating)
                          setCurrentPage(1)
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1 ${
                          ratingFilter === rating
                            ? 'glass-button-primary'
                            : 'glass-button'
                        }`}
                      >
                        {rating === 0 ? (
                          t('collectionPage.advancedFilters.allRatings')
                        ) : (
                          <>
                            {rating}+ <Star className={`w-4 h-4 ${rating <= 5 ? 'text-amber-400 fill-current' : 'text-slate-400'}`} />
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alphabetical Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t('adminPage.whiskyManagement.filters.alphabetical')}
                  </label>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedLetter('')
                          setCurrentPage(1)
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                          selectedLetter === ''
                            ? 'bg-amber-500 text-white shadow-lg'
                            : 'bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {t('adminPage.whiskyManagement.filters.all')}
                      </button>
                      {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
                        const count = collection.filter(item => item.whisky.name.toLowerCase().startsWith(letter.toLowerCase())).length
                        return (
                          <button
                            key={letter}
                            onClick={() => {
                              setSelectedLetter(letter)
                              setCurrentPage(1)
                            }}
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Info and View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
        >
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {filteredAndSortedCollection.length} {t('collectionPage.results')} •
            {t('collectionPage.page')} {currentPage} / {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="input-glass px-3 py-1.5 text-sm"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
            <span className="text-sm text-slate-600 dark:text-slate-400">{t('collectionPage.perPage')}</span>
          </div>
        </motion.div>

        {/* Collection Grid */}
        {filteredAndSortedCollection.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center">
              <Wine className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-slate-800 dark:text-white">
              {searchTerm || filterType !== 'all' ? t('collectionPage.empty.noResults') : t('collectionPage.empty.emptyCollection')}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || filterType !== 'all' 
                ? t('collectionPage.empty.tryDifferentTerms')
                : t('collectionPage.empty.addFromWhiskies')
              }
            </p>
            <Link 
              to="/whiskies" 
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>{t('collectionPage.empty.addWhisky')}</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {paginatedCollection.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/5] bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-700 dark:to-slate-800">
                  {item.whisky.image_url ? (
                    <img
                      src={item.whisky.image_url}
                      alt={item.whisky.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Wine className="w-16 h-16 text-amber-300 dark:text-slate-500" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {item.tasted ? (
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {t('collectionPage.whiskyCard.tasted')}
                      </div>
                    ) : (
                      <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {t('collectionPage.whiskyCard.untasted')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleWhiskyDetail(item.whisky)}
                        className="glass-button w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                        title={t('collectionPage.whiskyCard.viewDetails')}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.id, item.whisky.name)}
                        className="glass-button-danger w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                        title={t('collectionPage.whiskyCard.removeFromCollection')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-3">
                  {/* Title and Info */}
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white leading-tight mb-1">
                      {item.whisky.name}
                    </h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Wine className="w-3 h-3" />
                        <span>{item.whisky.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{item.whisky.country}</span>
                      </div>
                      {item.whisky.alcohol_percentage && (
                        <div className="flex items-center gap-2">
                          <Percent className="w-3 h-3" />
                          <span>{item.whisky.alcohol_percentage}% ABV</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('collectionPage.whiskyCard.rating')}
                      </span>
                      <button
                        onClick={() => {
                          setEditingRating(item.id)
                          setRatingValue(item.rating || 0)
                        }}
                        className="glass-button-primary px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        title={item.rating > 0 ? t('collectionPage.whiskyCard.editRating') : t('collectionPage.whiskyCard.addRating')}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {editingRating === item.id ? (
                        <div className="flex items-center gap-1">
                          {renderStars(ratingValue, item.id, true)}
                          <button
                            onClick={() => {
                              handleRating(item.id, ratingValue)
                              setRatingValue(0)
                            }}
                            className="glass-button-success ml-2 p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title={t('collectionPage.whiskyCard.save')}
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRating(null)
                              setRatingValue(0)
                            }}
                            className="glass-button-danger p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title={t('collectionPage.whiskyCard.cancel')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {renderStars(item.rating || 0, item.id, false)}
                          {item.rating > 0 && (
                            <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                              ({item.rating}/5)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('collectionPage.whiskyCard.tastingNote')}
                      </span>
                      <button
                        onClick={() => handleNotesEdit(item.id, item.personal_notes || '')}
                        className="glass-button-secondary px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        title={item.personal_notes ? t('collectionPage.whiskyCard.editNotes') : t('collectionPage.whiskyCard.addNotes')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {editingNotes === item.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder={t('collectionPage.whiskyCard.notesPlaceholder')}
                          className="w-full p-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleNotesSave(item.id)}
                            className="glass-button-success flex-1 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                            title={t('collectionPage.whiskyCard.save')}
                          >
                            <Save className="w-4 h-4 mx-auto" />
                          </button>
                          <button
                            onClick={handleNotesCancel}
                            className="glass-button-danger flex-1 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                            title={t('collectionPage.whiskyCard.cancel')}
                          >
                            <X className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400 min-h-[2.5rem]">
                        {item.personal_notes || t('collectionPage.whiskyCard.noNotes')}
                      </p>
                    )}
                  </div>

                  {/* Added Date */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {t('collectionPage.whiskyCard.addedOn')}: {
                          item.created_at && !isNaN(Date.parse(item.created_at))
                            ? new Date(item.created_at).toLocaleDateString('tr-TR')
                            : t('collectionPage.whiskyCard.dateUnknown')
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center items-center gap-2 mt-8"
          >
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="glass-button p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    currentPage === pageNum
                      ? 'glass-button-primary'
                      : 'glass-button'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="glass-button p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Whisky Detail Modal */}
        <AnimatePresence>
          {isModalOpen && selectedWhisky && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {selectedWhisky.name}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-700 dark:to-slate-800 rounded-xl overflow-hidden">
                    {selectedWhisky.image_url ? (
                      <img
                        src={selectedWhisky.image_url}
                        alt={selectedWhisky.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wine className="w-16 h-16 text-amber-300 dark:text-slate-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('collectionPage.modal.details')}</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>{t('collectionPage.modal.type')}:</strong> {selectedWhisky.type}</div>
                        <div><strong>{t('collectionPage.modal.country')}:</strong> {selectedWhisky.country}</div>
                        {selectedWhisky.region && <div><strong>{t('collectionPage.modal.region')}:</strong> {selectedWhisky.region}</div>}
                        {selectedWhisky.alcohol_percentage && <div><strong>ABV:</strong> {selectedWhisky.alcohol_percentage}%</div>}
                        {selectedWhisky.age_years && <div><strong>{t('collectionPage.modal.age')}:</strong> {selectedWhisky.age_years} {t('collectionPage.modal.years')}</div>}
                      </div>
                    </div>
                    
                    {selectedWhisky.description && (
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('collectionPage.modal.description')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedWhisky.description}
                        </p>
                      </div>
                    )}
                    
                    {selectedWhisky.aroma && (
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('collectionPage.modal.aroma')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedWhisky.aroma}
                        </p>
                      </div>
                    )}
                    
                    {selectedWhisky.taste && (
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('collectionPage.modal.taste')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedWhisky.taste}
                        </p>
                      </div>
                    )}
                    
                    {selectedWhisky.finish && (
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('collectionPage.modal.finish')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedWhisky.finish}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}