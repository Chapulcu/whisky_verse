import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useUserCollection } from '@/hooks/useUserCollection'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Wine, 
  Star, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  Percent,
  StickyNote,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Award,
  BarChart3,
  RefreshCw,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UserWhisky {
  id: number
  whisky_id: number
  tasted: boolean
  rating: number | null
  personal_notes: string | null
  tasted_at: string | null
  created_at: string
  whisky: {
    id: number
    name: string
    type: string
    country: string
    region: string | null
    alcohol_percentage: number
    color: string | null
    aroma: string | null
    taste: string | null
    finish: string | null
    description: string | null
    image_url: string | null
  }
}

export function CollectionPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { 
    collection, 
    loading, 
    error,
    loadCollection, 
    updateCollectionItem, 
    removeFromCollection 
  } = useUserCollection()
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTasted, setFilterTasted] = useState<'all' | 'tasted' | 'not-tasted'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'date'>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3)
  const [editingRating, setEditingRating] = useState<number | null>(null)
  const [editingNotes, setEditingNotes] = useState<number | null>(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [notesValue, setNotesValue] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [whiskyToRemove, setWhiskyToRemove] = useState<UserWhisky | null>(null)

  const loadCollection = async () => {
    if (!user) {
      console.log('No user found, skipping collection load')
      return
    }

    try {
      console.log('Loading collection for user:', user.id)
      
      // First, get the user's whisky collection
      const { data: userWhiskies, error: userError } = await supabase
        .from('user_whiskies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (userError) {
        console.error('Error loading user whiskies:', userError)
        throw userError
      }

      if (!userWhiskies || userWhiskies.length === 0) {
        console.log('No whiskies in user collection')
        setCollection([])
        return
      }

      // Get all whisky IDs from user collection
      const whiskyIds = userWhiskies.map(uw => uw.whisky_id)
      console.log('Whisky IDs in collection:', whiskyIds)

      // Then get the whisky details for those IDs
      const { data: whiskies, error: whiskiesError } = await supabase
        .from('whiskies')
        .select('*')
        .in('id', whiskyIds)

      if (whiskiesError) {
        console.error('Error loading whiskies:', whiskiesError)
        throw whiskiesError
      }

      console.log('Whiskies data loaded:', whiskies)

      // Manually join the data
      const collectionData = userWhiskies.map(userWhisky => {
        const whiskyData = whiskies?.find(w => w.id === userWhisky.whisky_id)
        return {
          id: userWhisky.id,
          whisky_id: userWhisky.whisky_id,
          tasted: userWhisky.tasted,
          rating: userWhisky.rating,
          personal_notes: userWhisky.personal_notes,
          tasted_at: userWhisky.tasted_at,
          created_at: userWhisky.created_at,
          whisky: whiskyData
        }
      }).filter(item => item.whisky) // Filter out any items where whisky data wasn't found

      console.log('Collection data processed successfully:')
      console.log('- Total items:', collectionData.length)
      console.log('- Collection data:', collectionData)
      
      setCollection(collectionData)
    } catch (error) {
      console.error('Error loading collection:', error)
      toast.error('Koleksiyon yüklenemedi')
      setCollection([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // All useEffect hooks must be called before any early returns
  useEffect(() => {
    if (user) {
      loadCollection()
    }
  }, [user])

  // Listen for collection updates from other components
  useEffect(() => {
    const handleCollectionUpdate = (event: CustomEvent) => {
      console.log('Collection update event received:', event.detail)
      if (user) {
        loadCollection()
      }
    }

    window.addEventListener('collectionUpdated', handleCollectionUpdate as EventListener)
    
    return () => {
      window.removeEventListener('collectionUpdated', handleCollectionUpdate as EventListener)
    }
  }, [user])

  // Refresh collection when page becomes visible (user returns from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Page became visible, refreshing collection')
        loadCollection()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      if (user) {
        console.log('Window gained focus, refreshing collection')
        loadCollection()
      }
    }
    
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterTasted, sortBy])

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadCollection()
    setRefreshing(false)
    toast.success('Koleksiyon yenilendi!')
  }

  const updateRating = async (userWhiskyId: number, rating: number) => {
    try {
      const { error } = await supabase
        .from('user_whiskies')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', userWhiskyId)

      if (error) throw error

      setCollection(prev => prev.map(item => 
        item.id === userWhiskyId ? { ...item, rating } : item
      ))
      
      toast.success('Puanlama güncellendi!')
      setEditingRating(null)
    } catch (error) {
      console.error('Error updating rating:', error)
      toast.error('Puanlama güncellenirken hata oluştu')
    }
  }

  const updateNotes = async (userWhiskyId: number, notes: string) => {
    try {
      const { error } = await supabase
        .from('user_whiskies')
        .update({ personal_notes: notes || null, updated_at: new Date().toISOString() })
        .eq('id', userWhiskyId)

      if (error) throw error

      setCollection(prev => prev.map(item => 
        item.id === userWhiskyId ? { ...item, personal_notes: notes || null } : item
      ))
      
      toast.success('Notlar güncellendi!')
      setEditingNotes(null)
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('Notlar güncellenirken hata oluştu')
    }
  }

  const removeFromCollection = async (userWhiskyId: number) => {
    try {
      const { error } = await supabase
        .from('user_whiskies')
        .delete()
        .eq('id', userWhiskyId)

      if (error) throw error

      setCollection(prev => prev.filter(item => item.id !== userWhiskyId))
      toast.success('Viski koleksiyondan çıkarıldı')
      setShowRemoveModal(false)
      setWhiskyToRemove(null)
    } catch (error) {
      console.error('Error removing from collection:', error)
      toast.error('Koleksiyondan çıkarılırken hata oluştu')
    }
  }

  const handleRemoveClick = (whisky: UserWhisky) => {
    setWhiskyToRemove(whisky)
    setShowRemoveModal(true)
  }

  const toggleTasted = async (userWhiskyId: number, currentTasted: boolean) => {
    try {
      const { error } = await supabase
        .from('user_whiskies')
        .update({ 
          tasted: !currentTasted,
          tasted_at: !currentTasted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userWhiskyId)

      if (error) throw error

      setCollection(prev => prev.map(item => 
        item.id === userWhiskyId ? { 
          ...item, 
          tasted: !currentTasted,
          tasted_at: !currentTasted ? new Date().toISOString() : null
        } : item
      ))
      
      toast.success(currentTasted ? 'Tadılmamış olarak işaretlendi' : 'Tadıldı olarak işaretlendi')
    } catch (error) {
      console.error('Error updating tasted status:', error)
      toast.error('Durum güncellenirken hata oluştu')
    }
  }

  // Filter and sort collection
  const filteredCollection = collection
    .filter(item => {
      const matchesSearch = item.whisky.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.whisky.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.whisky.country.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterTasted === 'all' || 
                           (filterTasted === 'tasted' && item.tasted) ||
                           (filterTasted === 'not-tasted' && !item.tasted)
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.whisky.name.localeCompare(b.whisky.name)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  // Pagination calculations
  const totalPages = Math.ceil(filteredCollection.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCollection = filteredCollection.slice(startIndex, endIndex)

  // Grid column classes
  const gridColumnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  // Statistics
  const stats = {
    total: collection.length,
    tasted: collection.filter(item => item.tasted).length,
    rated: collection.filter(item => item.rating).length,
    averageRating: collection.filter(item => item.rating).reduce((sum, item) => sum + (item.rating || 0), 0) / collection.filter(item => item.rating).length || 0,
    countries: [...new Set(collection.map(item => item.whisky.country))].length,
    types: [...new Set(collection.map(item => item.whisky.type))].length
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
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-3xl md:text-4xl font-cyber font-bold text-gradient">
            Viski Koleksiyonum
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            title="Koleksiyonu Yenile"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Kişisel viski koleksiyonunuz, puanlamalarınız ve notlarınız
        </p>
      </div>

      {/* Stats Panel */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Koleksiyon İstatistikleri
          </h3>
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-glass p-2 rounded-lg"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.total}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Toplam</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.tasted}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Tadılan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.rated}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Puanlan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-slash-600 dark:text-slate-400">Ort. Puan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.countries}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Ülke</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.types}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Tip</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Koleksiyonunuzda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass pl-10 pr-24"
          />
          
          {/* View Toggle */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center bg-white/10 dark:bg-slate-800/30 rounded-lg p-1 backdrop-blur-md border border-white/20">
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
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Filtre
              </label>
              <select
                value={filterTasted}
                onChange={(e) => setFilterTasted(e.target.value as any)}
                className="input-glass"
              >
                <option value="all">Tüm Viskiler</option>
                <option value="tasted">Tadılanlar</option>
                <option value="not-tasted">Tadılmayanlar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sıralama
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-glass"
              >
                <option value="name">Ada Göre</option>
                <option value="rating">Puana Göre</option>
                <option value="date">Tarihe Göre</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sayfa başı
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="input-glass"
              >
                {viewMode === 'grid' ? (
                  <>
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={18}>18</option>
                    <option value={24}>24</option>
                  </>
                ) : (
                  <>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </>
                )}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {viewMode === 'grid' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">Sütun:</span>
                <select
                  value={gridColumns}
                  onChange={(e) => setGridColumns(Number(e.target.value) as 2 | 3 | 4)}
                  className="input-glass text-sm px-3 py-1"
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            )}
            
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {filteredCollection.length} sonuç • Sayfa {currentPage} / {totalPages || 1}
            </div>
          </div>
        </div>
      </div>

      {/* Collection Grid/List */}
      <div className={viewMode === 'grid' ? `grid grid-cols-1 ${gridColumnClasses[gridColumns]} gap-6` : 'space-y-4'}>
        {paginatedCollection.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`card group hover:scale-105 transition-all duration-300 ${
              viewMode === 'list' ? 'flex items-center gap-6' : ''
            }`}
          >
            {viewMode === 'grid' ? (
              // Grid View
              <>
                {/* Image */}
                <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20">
                  {item.whisky.image_url ? (
                    <img
                      src={item.whisky.image_url}
                      alt={item.whisky.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Wine className="w-16 h-16 text-amber-400" />
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {item.tasted && (
                      <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                        Tadıldı
                      </span>
                    )}
                    {item.rating && (
                      <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                        {item.rating}/5
                      </span>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => toggleTasted(item.id, item.tasted)}
                      className={`p-2 rounded-full backdrop-blur-md transition-all ${
                        item.tasted
                          ? 'bg-green-500/20 text-green-600'
                          : 'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                      title={item.tasted ? 'Tadılmamış olarak işaretle' : 'Tadıldı olarak işaretle'}
                    >
                      <Star className={`w-4 h-4 ${item.tasted ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={() => handleRemoveClick(item)}
                      className="p-2 rounded-full backdrop-blur-md bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-all"
                      title="Koleksiyondan Çıkar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      {item.whisky.name}
                    </h3>
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                      {item.whisky.type}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{item.whisky.country}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      <span>{item.whisky.alcohol_percentage}%</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Puanlama</span>
                      <button
                        onClick={() => {
                          setEditingRating(item.id)
                          setRatingValue(item.rating || 0)
                        }}
                        className="p-2 rounded-lg bg-amber-600/20 hover:bg-amber-500/30 text-amber-200 hover:text-amber-100 backdrop-blur-md border border-amber-400/20 hover:border-amber-300/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Puanlamayı Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {editingRating === item.id ? (
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRatingValue(star)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md border transition-all duration-300 ${
                                  star <= ratingValue 
                                    ? 'bg-yellow-600/30 hover:bg-yellow-500/40 text-yellow-200 border-yellow-400/30 shadow-yellow-500/25' 
                                    : 'bg-slate-600/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 border-slate-400/20 hover:border-slate-300/30'
                                }`}
                                title={`${star} yıldız`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateRating(item.id, ratingValue)}
                            className="flex-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-200 hover:text-emerald-100 backdrop-blur-md border border-emerald-400/20 hover:border-emerald-300/30 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 text-sm font-medium min-h-[36px] flex items-center justify-center"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingRating(null)}
                            className="flex-1 px-3 py-2 bg-slate-600/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 backdrop-blur-md border border-slate-400/20 hover:border-slate-300/30 rounded-lg transition-all duration-300 shadow-lg text-sm font-medium min-h-[36px] flex items-center justify-center"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${star <= (item.rating || 0) ? 'text-yellow-500 fill-current' : 'text-slate-300'}`}
                          />
                        ))}
                        {!item.rating && <span className="text-sm text-slate-500 ml-2">Puanlanmamış</span>}
                      </div>
                    )}
                  </div>

                  {/* Personal Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kişisel Notlar</span>
                      <button
                        onClick={() => {
                          setEditingNotes(item.id)
                          setNotesValue(item.personal_notes || '')
                        }}
                        className="p-2 rounded-lg bg-orange-600/20 hover:bg-orange-500/30 text-orange-200 hover:text-orange-100 backdrop-blur-md border border-orange-400/20 hover:border-orange-300/30 transition-all duration-300 shadow-lg hover:shadow-orange-500/25 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Notları Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {editingNotes === item.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          className="input-glass min-h-[70px] resize-none text-sm w-full"
                          placeholder="Kişisel notlarınızı ekleyin..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateNotes(item.id, notesValue)}
                            className="flex-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-200 hover:text-emerald-100 backdrop-blur-md border border-emerald-400/20 hover:border-emerald-300/30 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 text-sm font-medium min-h-[36px] flex items-center justify-center"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="flex-1 px-3 py-2 bg-slate-600/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 backdrop-blur-md border border-slate-400/20 hover:border-slate-300/30 rounded-lg transition-all duration-300 shadow-lg text-sm font-medium min-h-[36px] flex items-center justify-center"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {item.personal_notes ? (
                          <p className="line-clamp-3">{item.personal_notes}</p>
                        ) : (
                          <p className="text-slate-500 italic">Henüz not eklenmemiş</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Added Date */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Eklendi: {new Date(item.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </>
            ) : (
              // List View
              <>
                {/* Image */}
                <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20">
                  {item.whisky.image_url ? (
                    <img
                      src={item.whisky.image_url}
                      alt={item.whisky.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Wine className="w-8 h-8 text-amber-400" />
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-1 left-1 flex gap-1">
                    {item.tasted && (
                      <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-1 py-0.5 rounded text-xs font-medium backdrop-blur-md">
                        ✓
                      </span>
                    )}
                    {item.rating && (
                      <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1 py-0.5 rounded text-xs font-medium backdrop-blur-md">
                        {item.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {item.whisky.name}
                    </h3>
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                      {item.whisky.type} • {item.whisky.country} • {item.whisky.alcohol_percentage}%
                    </p>
                  </div>

                  {/* Rating Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Puanlama</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= (item.rating || 0) ? 'text-yellow-500 fill-current' : 'text-slate-300'}`}
                          />
                        ))}
                        {!item.rating && <span className="text-xs text-slate-500 ml-1">Yok</span>}
                      </div>
                    </div>
                    
                    {editingRating === item.id && (
                      <div className="bg-white/10 dark:bg-slate-800/20 rounded-lg p-3 border border-white/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRatingValue(star)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md backdrop-blur-md border transition-all duration-300 min-w-[32px] min-h-[32px] ${
                                  star <= ratingValue 
                                    ? 'bg-yellow-600/30 hover:bg-yellow-500/40 text-yellow-200 border-yellow-400/30 shadow-yellow-500/25' 
                                    : 'bg-slate-600/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 border-slate-400/20 hover:border-slate-300/30'
                                }`}
                                title={`${star} yıldız`}
                              >
                                <Star className="w-3 h-3 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateRating(item.id, ratingValue)}
                            className="flex-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-200 hover:text-emerald-100 backdrop-blur-md border border-emerald-400/20 hover:border-emerald-300/30 rounded-md transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 text-xs font-medium min-h-[32px] flex items-center justify-center"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingRating(null)}
                            className="flex-1 px-3 py-2 bg-slate-600/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 backdrop-blur-md border border-slate-400/20 hover:border-slate-300/30 rounded-md transition-all duration-300 shadow-lg text-xs font-medium min-h-[32px] flex items-center justify-center"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Kişisel Notlar</span>
                    </div>
                    
                    {editingNotes === item.id ? (
                      <div className="bg-white/10 dark:bg-slate-800/20 rounded-lg p-3 border border-white/20">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-xs min-h-[60px] resize-none text-slate-800 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                          placeholder="Kişisel notlarınızı ekleyin..."
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => updateNotes(item.id, notesValue)}
                            className="flex-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-200 hover:text-emerald-100 backdrop-blur-md border border-emerald-400/20 hover:border-emerald-300/30 rounded-md transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 text-xs font-medium min-h-[32px] flex items-center justify-center"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="flex-1 px-3 py-2 bg-slate-600/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 backdrop-blur-md border border-slate-400/20 hover:border-slate-300/30 rounded-md transition-all duration-300 shadow-lg text-xs font-medium min-h-[32px] flex items-center justify-center"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {item.personal_notes ? (
                          <p className="line-clamp-2 bg-white/5 dark:bg-slate-800/10 rounded-md p-2 border border-white/10">
                            {item.personal_notes}
                          </p>
                        ) : (
                          <p className="text-slate-500 italic bg-white/5 dark:bg-slate-800/10 rounded-md p-2 border border-white/10">
                            Henüz not eklenmemiş
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Eklendi: {new Date(item.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingRating(item.id)
                      setRatingValue(item.rating || 0)
                    }}
                    className="p-2 rounded-lg bg-amber-600/20 hover:bg-amber-500/30 text-amber-200 hover:text-amber-100 backdrop-blur-md border border-amber-400/20 hover:border-amber-300/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Puanla"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingNotes(item.id)
                      setNotesValue(item.personal_notes || '')
                    }}
                    className="p-2 rounded-lg bg-orange-600/20 hover:bg-orange-500/30 text-orange-200 hover:text-orange-100 backdrop-blur-md border border-orange-400/20 hover:border-orange-300/30 transition-all duration-300 shadow-lg hover:shadow-orange-500/25 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Not Ekle"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => toggleTasted(item.id, item.tasted)}
                    className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${
                      item.tasted
                        ? 'bg-green-500/20 text-green-600 border-green-400/30'
                        : 'bg-slate-600/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 border-slate-400/20'
                    }`}
                    title={item.tasted ? 'Tadılmamış' : 'Tadıldı'}
                  >
                    <Star className={`w-4 h-4 ${item.tasted ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={() => handleRemoveClick(item)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 backdrop-blur-md border border-red-400/20 transition-all duration-300 shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Çıkar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {startIndex + 1}-{Math.min(endIndex, filteredCollection.length)} / {filteredCollection.length} viski görüntülüyor
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
      )}

      {/* Empty State */}

      {/* Empty State */}
      {collection.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
            {filteredCollection.length === 0 && (searchTerm || filterTasted !== 'all') ? 'Sonuç bulunamadı' : 'Koleksiyonunuz boş'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {filteredCollection.length === 0 && (searchTerm || filterTasted !== 'all') 
              ? 'Arama kriterlerinizi değiştirerek tekrar deneyin'
              : 'Viskiler sayfasından ilk viskinizi koleksiyonunuza ekleyin'
            }
          </p>
          {collection.length === 0 && !searchTerm && filterTasted === 'all' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Koleksiyonunuz boş görünüyorsa:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link 
                  to="/whiskies" 
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Wine className="w-4 h-4" />
                  Viskiler Sayfasına Git
                </Link>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="btn-glass inline-flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Yenileniyor...' : 'Sayfayı Yenile'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveModal && whiskyToRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="text-center space-y-4">
              {/* Warning Icon */}
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Koleksiyondan Çıkar
              </h3>
              
              {/* Message */}
              <div className="space-y-2">
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {whiskyToRemove.whisky.name}
                  </span> adlı viski koleksiyonunuzdan çıkarılacak.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Bu işlem geri alınamaz.
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowRemoveModal(false)
                    setWhiskyToRemove(null)
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-lg transition-all duration-200 border border-white/20"
                >
                  İptal
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeFromCollection(whiskyToRemove.id)
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  Çıkar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}