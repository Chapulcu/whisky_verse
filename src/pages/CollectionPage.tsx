import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { useUserCollection } from '@/hooks/useUserCollection'
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
  Heart,
  StickyNote,
  Save,
  X,
  Calendar,
  MapPin,
  Percent,
  Info,
  StarIcon,
  Award,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

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

  const [searchTerm, setSearchTerm] = useState('')
  const [editingRating, setEditingRating] = useState<number | null>(null)
  const [editingNotes, setEditingNotes] = useState<number | null>(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [notesValue, setNotesValue] = useState('')
  const [selectedWhisky, setSelectedWhisky] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'tasted' | 'untasted'>('all')

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const filteredCollection = collection.filter(item => {
    const matchesSearch = item.whisky.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.whisky.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.whisky.country.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'tasted' && item.tasted) ||
      (filterType === 'untasted' && !item.tasted)
    
    return matchesSearch && matchesFilter
  })

  const handleRating = async (itemId: number, rating: number) => {
    try {
      await updateCollectionItem(itemId, { 
        rating, 
        tasted: true,
        tasted_at: new Date().toISOString()
      })
      setEditingRating(null)
      toast.success('Değerlendirme güncellendi')
    } catch (error) {
      toast.error('Değerlendirme güncellenemedi')
    }
  }

  const handleRemove = async (itemId: number, whiskyName: string) => {
    if (!confirm(`"${whiskyName}" whisky'sini koleksiyondan kaldırmak istediğinizden emin misiniz?`)) {
      return
    }
    
    try {
      await removeFromCollection(itemId)
      toast.success('Whisky koleksiyondan kaldırıldı')
    } catch (error) {
      toast.error('Whisky kaldırılamadı')
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
      toast.success('Tadım notu güncellendi')
    } catch (error) {
      toast.error('Tadım notu güncellenemedi')
    }
  }

  const handleNotesCancel = () => {
    setEditingNotes(null)
    setNotesValue('')
  }

  const handleWhiskyDetail = (whisky: any) => {
    setSelectedWhisky(whisky)
    setIsModalOpen(true)
  }

  const renderStars = (rating: number, itemId: number, editable: boolean = false) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => editable && handleRating(itemId, i)}
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
          <p className="mt-4 text-lg font-medium">Koleksiyon yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Wine className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-4">Hata Oluştu</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => loadCollection()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Yeniden Dene
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
            Viski Koleksiyonum
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {collection.length} viski koleksiyonunuzda
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.total}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Toplam Whisky</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.tasted}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Tadılmış</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.untasted}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Tadılmamış</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Ort. Puan</div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Koleksiyonda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass w-full pl-10 pr-4 py-3"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-glass pl-10 pr-8 py-3 appearance-none bg-white dark:bg-slate-800"
            >
              <option value="all">Tümü</option>
              <option value="tasted">Tadılmış</option>
              <option value="untasted">Tadılmamış</option>
            </select>
          </div>
        </motion.div>

        {/* Collection Grid */}
        {filteredCollection.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center">
              <Wine className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-slate-800 dark:text-white">
              {searchTerm || filterType !== 'all' ? 'Sonuç bulunamadı' : 'Koleksiyonunuz boş'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Farklı terimlerle arama yapmayı deneyin' 
                : 'Whisky sayfasından favorilerinizi ekleyin'
              }
            </p>
            <Link 
              to="/whiskies" 
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Whisky Ekle</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredCollection.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
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
                        Tadılmış
                      </div>
                    ) : (
                      <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Tadılmamış
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleWhiskyDetail(item.whisky)}
                        className="w-8 h-8 bg-white/90 dark:bg-slate-800/90 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.id, item.whisky.name)}
                        className="w-8 h-8 bg-red-500/90 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
                        Değerlendirme
                      </span>
                      {!item.tasted && (
                        <button
                          onClick={() => setEditingRating(item.id)}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Puanla
                        </button>
                      )}
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
                            className="ml-2 text-green-600 hover:text-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRating(null)
                              setRatingValue(0)
                            }}
                            className="text-slate-500 hover:text-slate-600"
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
                        Tadım Notu
                      </span>
                      <button
                        onClick={() => handleNotesEdit(item.id, item.personal_notes || '')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {item.personal_notes ? 'Düzenle' : 'Ekle'}
                      </button>
                    </div>
                    
                    {editingNotes === item.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Tadım notlarınızı yazın..."
                          className="w-full p-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleNotesSave(item.id)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-xs font-medium"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={handleNotesCancel}
                            className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-1 px-3 rounded text-xs font-medium"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400 min-h-[2.5rem]">
                        {item.personal_notes || 'Henüz not eklenmemiş'}
                      </p>
                    )}
                  </div>

                  {/* Added Date */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Eklenme: {new Date(item.added_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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
                className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
                      <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Detaylar</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Tür:</strong> {selectedWhisky.type}</div>
                        <div><strong>Ülke:</strong> {selectedWhisky.country}</div>
                        {selectedWhisky.region && <div><strong>Bölge:</strong> {selectedWhisky.region}</div>}
                        {selectedWhisky.alcohol_percentage && <div><strong>ABV:</strong> {selectedWhisky.alcohol_percentage}%</div>}
                        {selectedWhisky.age_years && <div><strong>Yaş:</strong> {selectedWhisky.age_years} yıl</div>}
                      </div>
                    </div>
                    
                    {selectedWhisky.description && (
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Açıklama</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedWhisky.description}
                        </p>
                      </div>
                    )}
                    
                    {selectedWhisky.aroma && (
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Aroma</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedWhisky.aroma}
                        </p>
                      </div>
                    )}
                    
                    {selectedWhisky.taste && (
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Tat</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedWhisky.taste}
                        </p>
                      </div>
                    )}
                    
                    {selectedWhisky.finish && (
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Final</h3>
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