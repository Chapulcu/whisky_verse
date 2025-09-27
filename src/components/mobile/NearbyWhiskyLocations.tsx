import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, Phone, Clock, ExternalLink, RefreshCw, Share2 } from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { ShareButton } from './ShareButton'
import toast from 'react-hot-toast'

interface WhiskyLocation {
  id: string
  name: string
  address: string
  phone?: string
  website?: string
  type: 'bar' | 'store' | 'distillery'
  rating?: number
  distance?: number
  openingHours?: string
  latitude: number
  longitude: number
}

// Enhanced location data with more comprehensive whisky venues
const whiskyLocations: WhiskyLocation[] = [
  // Istanbul Avrupa Yakası
  {
    id: '1',
    name: 'Peat & Sherry',
    address: 'Kuloğlu Mah, Turnacıbaşı Sk. No:4, 34433 Beyoğlu/İstanbul',
    phone: '+90 212 292 6595',
    website: 'https://www.peatandsherry.com',
    type: 'bar',
    rating: 4.8,
    openingHours: '17:00 - 02:00',
    latitude: 41.032167, // Daha doğru koordinat
    longitude: 28.978056  // Turnacıbaşı Sokak için güncellendi
  },
  {
    id: '2',
    name: 'The Whisky Bar Istanbul',
    address: 'Beyoğlu, İstiklal Cd. No:123, Istanbul',
    phone: '+90 212 123 4567',
    type: 'bar',
    rating: 4.5,
    openingHours: '18:00 - 02:00',
    latitude: 41.0367,
    longitude: 28.9857
  },
  {
    id: '3',
    name: 'Soho House Istanbul',
    address: 'Meşrutiyet Cd. No:56, 34430 Beyoğlu/İstanbul',
    phone: '+90 212 377 7700',
    type: 'bar',
    rating: 4.6,
    openingHours: '07:00 - 02:00',
    latitude: 41.035803, // Meşrutiyet Caddesi için güncellendi
    longitude: 28.978425
  },
  {
    id: '4',
    name: 'Elixir Bar',
    address: 'Tomtom Mah, Yeni Çarşı Cd. No:32, 34433 Beyoğlu/İstanbul',
    phone: '+90 212 292 4040',
    type: 'bar',
    rating: 4.7,
    openingHours: '19:00 - 02:00',
    latitude: 41.031847, // Tomtom Mahallesi için güncellendi
    longitude: 28.974283
  },
  // Istanbul Anadolu Yakası
  {
    id: '5',
    name: 'Whisky Corner Kadıköy',
    address: 'Caferağa Mah, Moda Cd. No:76, 34710 Kadıköy/İstanbul',
    phone: '+90 216 338 7890',
    type: 'store',
    rating: 4.4,
    openingHours: '10:00 - 22:00',
    latitude: 40.9897,
    longitude: 29.0375
  },
  // Ankara
  {
    id: '6',
    name: 'Malt House Ankara',
    address: 'Çankaya, Tunalı Hilmi Cd. No:67, Ankara',
    phone: '+90 312 555 0123',
    type: 'bar',
    rating: 4.3,
    openingHours: '19:00 - 01:00',
    latitude: 39.9208,
    longitude: 32.8541
  },
  {
    id: '7',
    name: 'The Scotch Lounge',
    address: 'Kızılay, Selanik Cd. No:45, 06420 Çankaya/Ankara',
    phone: '+90 312 418 7654',
    type: 'bar',
    rating: 4.2,
    openingHours: '18:00 - 01:00',
    latitude: 39.9199,
    longitude: 32.8543
  },
  // İzmir
  {
    id: '8',
    name: 'Aegean Spirits',
    address: 'Alsancak, Kıbrıs Şehitleri Cd. No:140, 35220 Konak/İzmir',
    phone: '+90 232 464 1234',
    type: 'store',
    rating: 4.5,
    openingHours: '09:00 - 21:00',
    latitude: 38.4384,
    longitude: 27.1431
  },
  {
    id: '9',
    name: 'Bourbon Street İzmir',
    address: 'Alsancak, Gazi Blv. No:12, 35210 Konak/İzmir',
    phone: '+90 232 421 5678',
    type: 'bar',
    rating: 4.4,
    openingHours: '20:00 - 02:00',
    latitude: 38.4378,
    longitude: 27.1447
  },
  // Bodrum
  {
    id: '10',
    name: 'Marina Whisky Club',
    address: 'Neyzen Tevfik Cd. No:5, 48400 Bodrum/Muğla',
    phone: '+90 252 316 7890',
    type: 'bar',
    rating: 4.6,
    openingHours: '19:00 - 03:00',
    latitude: 37.0348,
    longitude: 27.4305
  }
]

interface NearbyWhiskyLocationsProps {
  isOpen: boolean
  onClose: () => void
}

export function NearbyWhiskyLocations({ isOpen, onClose }: NearbyWhiskyLocationsProps) {
  const {
    latitude,
    longitude,
    error,
    loading,
    getCurrentPosition,
    requestPermission,
    calculateDistance,
    isSupported,
    permissionState,
    canRetry
  } = useGeolocation()
  const [locations, setLocations] = useState<WhiskyLocation[]>([])
  const [searchRadius, setSearchRadius] = useState(10) // km
  const [showPermissionGuide, setShowPermissionGuide] = useState(false)

  // Enhanced search algorithm
  const searchLocations = useCallback((userLat: number, userLng: number, radius: number, searchTerm = '') => {
    return whiskyLocations
      .map(location => {
        const distance = calculateDistance(location.latitude, location.longitude)

        // Search relevance scoring
        let relevanceScore = 0
        const searchLower = searchTerm.toLowerCase()

        if (searchTerm) {
          // Exact name match gets highest score
          if (location.name.toLowerCase().includes(searchLower)) {
            relevanceScore += 10
          }
          // Address match gets medium score
          if (location.address.toLowerCase().includes(searchLower)) {
            relevanceScore += 5
          }
          // Type match gets low score
          if (location.type.toLowerCase().includes(searchLower)) {
            relevanceScore += 2
          }
        }

        return {
          ...location,
          distance,
          relevanceScore
        }
      })
      .filter(location => {
        // Must be within radius
        if (!location.distance || location.distance > radius) return false

        // If there's a search term, must have some relevance
        if (searchTerm && location.relevanceScore === 0) return false

        return true
      })
      .sort((a, b) => {
        // If searching, sort by relevance first, then distance
        if (searchTerm) {
          if (a.relevanceScore !== b.relevanceScore) {
            return b.relevanceScore - a.relevanceScore
          }
        }
        // Always sort by distance as secondary criteria
        return (a.distance || 0) - (b.distance || 0)
      })
  }, [calculateDistance])

  useEffect(() => {
    if (latitude && longitude) {
      const results = searchLocations(latitude, longitude, searchRadius)
      setLocations(results)
    }
  }, [latitude, longitude, calculateDistance, searchRadius, searchLocations])

  const handleLocationRequest = async () => {
    if (!isSupported) {
      toast.error('Konum servisi bu tarayıcıda desteklenmiyor')
      return
    }

    if (permissionState === 'denied') {
      setShowPermissionGuide(true)
      return
    }

    try {
      await requestPermission()
    } catch (error) {
      console.error('Location request failed:', error)
    }
  }

  const getPermissionInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        title: 'iPhone/iPad\'de Konum İzni Verme',
        steps: [
          '1. Ayarlar > Gizlilik ve Güvenlik > Konum Servisleri\'ne gidin',
          '2. Konum Servisleri\'nin açık olduğundan emin olun',
          '3. Safari\'yi bulun ve "Uygulama Kullanırken" seçin',
          '4. Bu sayfayı yenileyin ve tekrar deneyin'
        ]
      }
    } else if (userAgent.includes('android')) {
      return {
        title: 'Android\'de Konum İzni Verme',
        steps: [
          '1. Tarayıcınızın adres çubuğundaki konum ikonuna dokunun',
          '2. "İzin Ver" seçeneğini seçin',
          '3. Veya Ayarlar > Uygulamalar > [Tarayıcı] > İzinler > Konum\'u açın',
          '4. Bu sayfayı yenileyin ve tekrar deneyin'
        ]
      }
    } else {
      return {
        title: 'Tarayıcıda Konum İzni Verme',
        steps: [
          '1. Adres çubuğundaki kilit ikonuna tıklayın',
          '2. Konum iznini "İzin Ver" olarak ayarlayın',
          '3. Sayfayı yenileyin ve tekrar deneyin',
          '4. Hala çalışmıyorsa tarayıcı ayarlarından site izinlerini kontrol edin'
        ]
      }
    }
  }

  const openInMaps = (location: WhiskyLocation) => {
    // Kullanıcıya seçenek sun: Koordinat veya Adres bazlı yol tarifi
    const userChoice = window.confirm(
      `Yol tarifi için hangi yöntemi tercih edersiniz?\n\n` +
      `✅ TAMAM: Doğru konuma git (koordinat bazlı)\n` +
      `❌ İPTAL: Adres araması yap\n\n` +
      `Adres: ${location.address}`
    )

    if (userChoice) {
      // Koordinat bazlı - daha doğru konum
      if (latitude && longitude) {
        const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${location.latitude},${location.longitude}?hl=tr`
        window.open(url, '_blank')
      } else {
        // Eğer kullanıcı konumu yoksa koordinata git
        const url = `https://www.google.com/maps/search/${location.latitude},${location.longitude}?hl=tr`
        window.open(url, '_blank')
      }
    } else {
      // Adres bazlı arama - kullanıcının gördüğü adres
      const searchQuery = `${location.name}, ${location.address}`
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}?hl=tr`
      window.open(url, '_blank')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return '🍸'
      case 'store':
        return '🏪'
      case 'distillery':
        return '🏭'
      default:
        return '📍'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bar':
        return 'Bar'
      case 'store':
        return 'Mağaza'
      case 'distillery':
        return 'Distillery'
      default:
        return 'Yer'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Yakındaki Mekanlar
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    🥃 {locations.length} viski mekanı bulundu
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mobile-touch-target shadow-md hover:scale-105 transition-all"
              >
                ×
              </button>
            </div>

            {/* Quick Controls */}
            <div className="flex gap-3">
              <button
                onClick={handleLocationRequest}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium disabled:opacity-50 text-sm mobile-touch-target shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>{loading ? 'Arıyor...' : 'Konum Al'}</span>
              </button>

              <div className="flex items-center gap-2 px-3 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Yarıçap:</span>
                <select
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-amber-600 dark:text-amber-400 border-none outline-none"
                >
                  <option value={1}>1km</option>
                  <option value={5}>5km</option>
                  <option value={10}>10km</option>
                  <option value={25}>25km</option>
                  <option value={50}>50km</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
                {permissionState === 'denied' && (
                  <button
                    onClick={() => setShowPermissionGuide(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline"
                  >
                    Konum iznini nasıl vereceğimi öğren
                  </button>
                )}
                {canRetry && permissionState !== 'denied' && (
                  <button
                    onClick={handleLocationRequest}
                    disabled={loading}
                    className="ml-2 text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    Tekrar Dene
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
            {!latitude && !longitude && !loading && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Konum Gerekli
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Yakınızdaki en iyi viski mekanlarını keşfetmek için konumunuzu paylaşın
                </p>
                <button
                  onClick={handleLocationRequest}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 text-sm mobile-touch-target shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Konumu Paylaş</span>
                </button>
              </div>
            )}

            {locations.length === 0 && latitude && longitude && !loading && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Mekan Bulunamadı
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchRadius} km yarıçapında viski mekanı bulunamadı
                </p>
                <button
                  onClick={() => setSearchRadius(searchRadius < 50 ? searchRadius * 2 : 50)}
                  className="text-amber-600 dark:text-amber-400 font-medium hover:underline"
                >
                  Arama yarıçapını genişlet ({searchRadius * 2}km)
                </button>
              </div>
            )}

            <div className="space-y-3 p-4">
              {locations.map((location, index) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-xl shadow-lg">
                        {getTypeIcon(location.type)}
                      </div>
                      {location.distance && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          {location.distance.toFixed(1)}km
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                            {location.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-lg">
                              {getTypeLabel(location.type)}
                            </span>
                            {location.rating && (
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                  {location.rating}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                        📍 {location.address}
                      </p>

                      {location.openingHours && (
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {location.openingHours}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <div className="relative group">
                          <button
                            onClick={() => openInMaps(location)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl font-medium mobile-touch-target shadow-md hover:shadow-lg transition-all"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Yol Tarifi</span>
                          </button>

                          {/* Quick access buttons - shows on hover/touch */}
                          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-max">
                            <button
                              onClick={() => {
                                if (latitude && longitude) {
                                  const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${location.latitude},${location.longitude}?hl=tr`
                                  window.open(url, '_blank')
                                } else {
                                  const url = `https://www.google.com/maps/search/${location.latitude},${location.longitude}?hl=tr`
                                  window.open(url, '_blank')
                                }
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-xl"
                            >
                              📍 Koordinat ile git
                            </button>
                            <button
                              onClick={() => {
                                const searchQuery = `${location.name}, ${location.address}`
                                const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}?hl=tr`
                                window.open(url, '_blank')
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-xl"
                            >
                              🏠 Adres ile ara
                            </button>
                          </div>
                        </div>

                        {location.phone && (
                          <a
                            href={`tel:${location.phone}`}
                            className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-xl font-medium mobile-touch-target shadow-md hover:shadow-lg transition-all"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Ara</span>
                          </a>
                        )}

                        {location.website && (
                          <a
                            href={location.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-xl font-medium mobile-touch-target shadow-md hover:shadow-lg transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Site</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Permission Guide Modal */}
        {showPermissionGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-10"
            onClick={() => setShowPermissionGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {getPermissionInstructions().title}
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                {getPermissionInstructions().steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowPermissionGuide(false)
                    // Try again after user potentially changed settings
                    setTimeout(handleLocationRequest, 500)
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                >
                  Ayarları Yaptım, Tekrar Dene
                </button>
                <button
                  onClick={() => setShowPermissionGuide(false)}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  )
}