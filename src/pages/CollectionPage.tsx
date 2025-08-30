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
  Info
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

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const filteredCollection = collection.filter(item =>
    item.whisky.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.whisky.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.whisky.country.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const handleRemove = async (itemId: number) => {
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

  const handleShowDetails = (item: any) => {
    setSelectedWhisky(item)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedWhisky(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-lg font-medium">Koleksiyon yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Wine className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-4">Hata Oluştu</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => loadCollection()}
            className="btn btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Yeniden Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        <h1 className="text-4xl font-bold mb-2">Viski Koleksiyonum</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {collection.length} viski koleksiyonunuzda
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Koleksiyonda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Collection Grid */}
      {filteredCollection.length === 0 ? (
        <div className="text-center py-16">
          <Wine className="w-20 h-20 mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-medium mb-2">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Koleksiyonunuz boş'}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm ? 'Farklı terimlerle arama yapmayı deneyin' : 'Whisky sayfasından favorilerinizi ekleyin'}
          </p>
          <Link 
            to="/whiskies" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Whisky Ekle</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollection.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-strong rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{item.whisky.name}</h3>
                  <p className="text-sm text-slate-500">{item.whisky.type}</p>
                  <p className="text-sm text-slate-500">{item.whisky.country}</p>
                </div>
                {item.whisky.image_url && (
                  <img
                    src={item.whisky.image_url}
                    alt={item.whisky.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-600">
                  {item.whisky.alcohol_percentage}% ABV
                </span>
                <span className={`text-sm px-2 py-1 rounded ${
                  item.tasted 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {item.tasted ? 'Tadılmış' : 'Tadılmamış'}
                </span>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Değerlendirme:</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(item.id, star)}
                      className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-200 touch-target-large ${
                        star <= (item.rating || 0) 
                          ? 'text-yellow-500 bg-yellow-500/20 border-yellow-300/30 shadow-md' 
                          : 'text-slate-300 hover:text-yellow-400 bg-white/10 border-white/20 hover:bg-yellow-500/10 hover:border-yellow-300/20'
                      }`}
                    >
                      <Star 
                        className="w-4 h-4" 
                        fill={star <= (item.rating || 0) ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  {item.rating && (
                    <span className="ml-2 text-sm text-slate-600">
                      {item.rating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Tasting Notes */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Tadım Notları:</p>
                  {editingNotes !== item.id && (
                    <button
                      onClick={() => handleNotesEdit(item.id, item.personal_notes || '')}
                      className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-300/30 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-all duration-200 text-xs touch-target-large"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Düzenle</span>
                    </button>
                  )}
                </div>
                
                {editingNotes === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Tadım notlarınızı yazın..."
                      className="w-full p-3 text-sm bg-white/60 backdrop-blur-md border border-white/30 rounded-xl text-slate-700 dark:text-slate-200 dark:bg-slate-800/60 dark:border-slate-700/30 resize-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-200"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleNotesCancel()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-500/20 backdrop-blur-md border border-slate-300/30 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-500/30 transition-all duration-200 text-sm touch-target-large"
                      >
                        <X className="w-3 h-3" />
                        <span>İptal</span>
                      </button>
                      <button
                        onClick={() => handleNotesSave(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 backdrop-blur-md border border-green-300/30 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-500/30 transition-all duration-200 text-sm touch-target-large"
                      >
                        <Save className="w-3 h-3" />
                        <span>Kaydet</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[60px] p-2 text-sm text-slate-600 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    {item.personal_notes ? (
                      <p className="whitespace-pre-wrap">{item.personal_notes}</p>
                    ) : (
                      <p className="text-slate-400 italic">Henüz tadım notu eklenmemiş</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center gap-2">
                <button
                  onClick={() => handleShowDetails(item)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white/30 transition-all duration-200 touch-target-large"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Detay</span>
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-md border border-red-300/30 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-all duration-200 touch-target-large"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Kaldır</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Whisky Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedWhisky && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedWhisky.whisky.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Wine className="w-4 h-4" />
                      {selectedWhisky.whisky.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedWhisky.whisky.country}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="btn-glass p-2 rounded-lg ml-4"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                {selectedWhisky.whisky.image_url && (
                  <div className="space-y-4">
                    <img
                      src={selectedWhisky.whisky.image_url}
                      alt={selectedWhisky.whisky.name}
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">ABV</div>
                      <div className="font-semibold flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        {selectedWhisky.whisky.alcohol_percentage}%
                      </div>
                    </div>
                    {selectedWhisky.whisky.age_years && (
                      <div className="glass rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Yaş</div>
                        <div className="font-semibold flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {selectedWhisky.whisky.age_years} yıl
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Region */}
                  {selectedWhisky.whisky.region && (
                    <div className="glass rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">Bölge</div>
                      <div className="font-semibold">{selectedWhisky.whisky.region}</div>
                    </div>
                  )}

                  {/* My Rating */}
                  {selectedWhisky.rating && (
                    <div className="glass rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-2">Değerlendirmem</div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= selectedWhisky.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-semibold">{selectedWhisky.rating}/5</span>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Durum</div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedWhisky.tasted
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {selectedWhisky.tasted ? 'Tadılmış' : 'Tadılmamış'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasting Notes */}
              {(selectedWhisky.whisky.aroma || selectedWhisky.whisky.taste || selectedWhisky.whisky.finish) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Tadım Notları</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedWhisky.whisky.aroma && (
                      <div className="glass rounded-lg p-3">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Aroma</div>
                        <p className="text-sm">{selectedWhisky.whisky.aroma}</p>
                      </div>
                    )}
                    {selectedWhisky.whisky.taste && (
                      <div className="glass rounded-lg p-3">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Tat</div>
                        <p className="text-sm">{selectedWhisky.whisky.taste}</p>
                      </div>
                    )}
                    {selectedWhisky.whisky.finish && (
                      <div className="glass rounded-lg p-3">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Final</div>
                        <p className="text-sm">{selectedWhisky.whisky.finish}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Personal Notes */}
              {selectedWhisky.personal_notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Kişisel Notlarım</h3>
                  <div className="glass rounded-lg p-4">
                    <p className="whitespace-pre-wrap text-sm">{selectedWhisky.personal_notes}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedWhisky.whisky.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Açıklama</h3>
                  <div className="glass rounded-lg p-4">
                    <p className="text-sm">{selectedWhisky.whisky.description}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}