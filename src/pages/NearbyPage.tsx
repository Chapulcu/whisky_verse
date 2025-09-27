import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Filter, Star, Phone, Clock, ExternalLink, Navigation, Zap, TrendingUp } from 'lucide-react'
import { NearbyWhiskyLocations } from '@/components/mobile/NearbyWhiskyLocations'
import { useAuth } from '@/contexts/AuthContext'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export function NearbyPage() {
  const { user } = useAuth()
  const { hapticButton, hapticSuccess } = useHapticFeedback()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'bar' | 'store' | 'distillery'>('all')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  const features = [
    {
      id: 'bars',
      icon: '🍸',
      title: 'Viski Barları',
      description: 'En yakın viski barlarını keşfedin',
      count: '12+ bar',
      color: 'from-amber-500 to-orange-500',
      action: () => {
        hapticButton()
        setSelectedFilter('bar')
        setShowLocationModal(true)
      }
    },
    {
      id: 'stores',
      icon: '🏪',
      title: 'Mağazalar',
      description: 'Kaliteli viski mağazaları',
      count: '8+ mağaza',
      color: 'from-blue-500 to-cyan-500',
      action: () => {
        hapticButton()
        setSelectedFilter('store')
        setShowLocationModal(true)
      }
    },
    {
      id: 'distilleries',
      icon: '🏭',
      title: 'Distillery\'ler',
      description: 'Üretim tesisleri ve turlar',
      count: '3+ tesis',
      color: 'from-green-500 to-emerald-500',
      action: () => {
        hapticButton()
        setSelectedFilter('distillery')
        setShowLocationModal(true)
      }
    },
    {
      id: 'featured',
      icon: '⭐',
      title: 'Öne Çıkanlar',
      description: 'En yüksek puanlı mekanlar',
      count: '4.5+ puan',
      color: 'from-purple-500 to-pink-500',
      action: () => {
        hapticButton()
        setSelectedFilter('all')
        setShowLocationModal(true)
      }
    }
  ]

  const recentSearches = [
    {
      name: 'The Malt House',
      type: 'bar',
      rating: 4.8,
      distance: '0.8 km',
      isOpen: true
    },
    {
      name: 'Premium Spirits Store',
      type: 'store',
      rating: 4.6,
      distance: '1.2 km',
      isOpen: true
    },
    {
      name: 'Whisky Corner Bar',
      type: 'bar',
      rating: 4.4,
      distance: '2.1 km',
      isOpen: false
    },
    {
      name: 'Scottish Collection',
      type: 'store',
      rating: 4.7,
      distance: '1.8 km',
      isOpen: true
    }
  ]

  // Mock search functionality
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    hapticButton()
    const filtered = recentSearches.filter(place =>
      place.name.toLowerCase().includes(term.toLowerCase()) ||
      place.type.toLowerCase().includes(term.toLowerCase())
    )
    setSearchResults(filtered)
    setShowSearchResults(true)
  }, [hapticButton])

  const handleSearchClick = useCallback((searchItem: any) => {
    hapticSuccess()
    toast.success(`${searchItem.name} konumuna yönlendiriliyor...`)
    setSearchTerm(searchItem.name)
    setShowSearchResults(false)
    setShowLocationModal(true)
  }, [hapticSuccess])

  const handleFilterChange = useCallback((filterId: string) => {
    hapticButton()
    setSelectedFilter(filterId as any)
    if (searchTerm) {
      performSearch(searchTerm)
    }
  }, [hapticButton, searchTerm, performSearch])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto mobile-padding py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Yakınımda Viski
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Çevrenizdeki en iyi viski mekanlarını keşfedin
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Mekan, bölge veya viski ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                performSearch(e.target.value)
              }}
              onFocus={() => searchTerm && setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all shadow-lg"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'all', label: 'Tümü', icon: '📍' },
              { id: 'bar', label: 'Barlar', icon: '🍸' },
              { id: 'store', label: 'Mağazalar', icon: '🏪' },
              { id: 'distillery', label: 'Distillery', icon: '🏭' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-all duration-300 min-w-fit text-xs sm:text-sm mobile-touch-target hover:scale-105 ${
                  selectedFilter === filter.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30'
                    : 'bg-white/80 dark:bg-slate-700/80 backdrop-blur-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-600 border border-gray-200/50 dark:border-gray-600/50 shadow-md'
                }`}
              >
                <span className="text-sm">{filter.icon}</span>
                <span className="font-medium truncate">{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto mobile-padding py-6">
        {/* Location Access Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6 border-2 border-amber-500/30"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Yakınınızdaki Viski Dünyasını Keşfedin
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bulunduğunuz konuma göre en yakın viski barları, mağazaları ve distillery'leri görmek için konum izni verin.
            </p>
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base mobile-touch-target min-h-[44px] flex items-center justify-center"
            >
              <MapPin className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Yakınımdaki Mekanları Gör</span>
            </button>
          </div>
        </motion.div>

        {/* Interactive Features Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          {features.map((feature, index) => (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={feature.action}
              className="group relative bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-center hover:scale-105 transition-all duration-300 min-h-[140px] flex flex-col justify-center shadow-xl hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl" style={{
                backgroundImage: `linear-gradient(135deg, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`
              }} />

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm mb-2 line-clamp-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-tight">
                  {feature.description}
                </p>
                <span className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded-full bg-gradient-to-r ${feature.color} text-white shadow-lg`}>
                  {feature.count}
                </span>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Recent Searches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Popüler Aramalar
          </h3>
          <div className="space-y-3">
            {recentSearches.map((search, index) => (
              <motion.button
                key={search.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSearchClick(search)}
                className="group flex items-center justify-between w-full p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-300 text-left mobile-touch-target border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 bg-gradient-to-r ${search.type === 'bar' ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-cyan-500'} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {search.type === 'bar' ? '🍸' : '🏪'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{search.name}</span>
                      {search.isOpen ? (
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-700">
                          Açık
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-700">
                          Kapalı
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        <span>{search.distance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current text-yellow-400" />
                        <span>{search.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {user ? null : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  Premium Özellikleri Keşfedin
                  <TrendingUp className="w-4 h-4" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Star className="w-4 h-4 fill-current text-yellow-500" />
                    <span>Favori mekanlar</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Search className="w-4 h-4" />
                    <span>Gelişmiş arama</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <MapPin className="w-4 h-4" />
                    <span>Özel indirimler</span>
                  </div>
                </div>
                <Link
                  to="/auth"
                  onClick={() => hapticSuccess()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-300 mobile-touch-target shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <span>Hemen Başla</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showSearchResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-32 left-4 right-4 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl max-h-80 overflow-y-auto"
          >
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Arama Sonuçları ({searchResults.length})
              </h4>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.name}-${index}`}
                    onClick={() => handleSearchClick(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-r ${result.type === 'bar' ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-cyan-500'} rounded-full flex items-center justify-center`}>
                      {result.type === 'bar' ? '🍸' : '🏪'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{result.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{result.distance}</span>
                        <Star className="w-3 h-3 fill-current text-yellow-400" />
                        <span>{result.rating}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background overlay for search results */}
      {showSearchResults && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowSearchResults(false)}
        />
      )}

      {/* Location Modal */}
      <NearbyWhiskyLocations
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  )
}