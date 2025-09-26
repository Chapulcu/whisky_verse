import React, { useState, useEffect } from 'react'
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

// Mock data - in real app this would come from an API
const mockLocations: WhiskyLocation[] = [
  {
    id: '1',
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
    id: '2',
    name: 'Premium Spirits Store',
    address: 'Nişantaşı, Teşvikiye Cd. No:45, Istanbul',
    phone: '+90 212 987 6543',
    type: 'store',
    rating: 4.8,
    openingHours: '10:00 - 22:00',
    latitude: 41.0475,
    longitude: 28.9936
  },
  {
    id: '3',
    name: 'Malt House Ankara',
    address: 'Çankaya, Tunalı Hilmi Cd. No:67, Ankara',
    phone: '+90 312 555 0123',
    type: 'bar',
    rating: 4.3,
    openingHours: '19:00 - 01:00',
    latitude: 39.9208,
    longitude: 32.8541
  }
]

interface NearbyWhiskyLocationsProps {
  isOpen: boolean
  onClose: () => void
}

export function NearbyWhiskyLocations({ isOpen, onClose }: NearbyWhiskyLocationsProps) {
  const { latitude, longitude, error, loading, getCurrentPosition, calculateDistance, isSupported } = useGeolocation()
  const [locations, setLocations] = useState<WhiskyLocation[]>([])
  const [searchRadius, setSearchRadius] = useState(10) // km

  useEffect(() => {
    if (latitude && longitude) {
      // Calculate distances and filter by radius
      const locationsWithDistance = mockLocations
        .map(location => ({
          ...location,
          distance: calculateDistance(location.latitude, location.longitude)
        }))
        .filter(location => location.distance !== null && location.distance <= searchRadius)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))

      setLocations(locationsWithDistance)
    }
  }, [latitude, longitude, calculateDistance, searchRadius])

  const handleLocationRequest = () => {
    if (!isSupported) {
      toast.error('Konum servisi bu tarayıcıda desteklenmiyor')
      return
    }
    getCurrentPosition()
  }

  const openInMaps = (location: WhiskyLocation) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${location.latitude},${location.longitude}`
      window.open(url, '_blank')
    } else {
      const url = `https://www.google.com/maps/search/${encodeURIComponent(location.address)}`
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
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Yakındaki Viski Mekanları
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {locations.length} mekan bulundu
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Controls */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleLocationRequest}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Konumumu Al
              </button>

              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
            {!latitude && !longitude && !loading && (
              <div className="p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Konumunuza İhtiyacımız Var
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Yakınızda viski mekanlarını göstermek için konum izni verin
                </p>
                <button
                  onClick={handleLocationRequest}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600"
                >
                  Konum İzni Ver
                </button>
              </div>
            )}

            {locations.length === 0 && latitude && longitude && (
              <div className="p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Yakında Mekan Bulunamadı
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchRadius} km çapında viski mekanı bulunamadı
                </p>
              </div>
            )}

            <div className="space-y-3 p-4">
              {locations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 hover:border-amber-500/50 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getTypeIcon(location.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {location.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                              {getTypeLabel(location.type)}
                            </span>
                            {location.rating && (
                              <span className="text-sm text-yellow-500">
                                ⭐ {location.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        {location.distance && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                              {location.distance.toFixed(1)} km
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {location.address}
                      </p>

                      {location.openingHours && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          {location.openingHours}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => openInMaps(location)}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                        >
                          <Navigation className="w-4 h-4" />
                          Yol Tarifi
                        </button>

                        <ShareButton
                          data={{
                            title: `${location.name} - WhiskyVerse`,
                            text: `${location.address} adresinde harika bir ${getTypeLabel(location.type).toLowerCase()}! WhiskyVerse'te keşfedin.`,
                            url: window.location.href
                          }}
                          variant="icon"
                          size="sm"
                          className="!w-8 !h-8 !bg-amber-500 hover:!bg-amber-600 !text-white"
                        />

                        {location.phone && (
                          <a
                            href={`tel:${location.phone}`}
                            className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg"
                          >
                            <Phone className="w-4 h-4" />
                            Ara
                          </a>
                        )}

                        {location.website && (
                          <a
                            href={location.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Site
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
      </div>
    </AnimatePresence>
  )
}