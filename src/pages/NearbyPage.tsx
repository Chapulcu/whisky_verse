import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Search, Filter, Star } from 'lucide-react'
import { NearbyWhiskyLocations } from '@/components/mobile/NearbyWhiskyLocations'
import { useAuth } from '@/contexts/AuthContext'

export function NearbyPage() {
  const { user } = useAuth()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'bar' | 'store' | 'distillery'>('all')

  const features = [
    {
      icon: '🍸',
      title: 'Viski Barları',
      description: 'En yakın viski barlarını keşfedin',
      count: '12+ bar'
    },
    {
      icon: '🏪',
      title: 'Mağazalar',
      description: 'Kaliteli viski mağazaları',
      count: '8+ mağaza'
    },
    {
      icon: '🏭',
      title: 'Distillery\'ler',
      description: 'Üretim tesisleri ve turlar',
      count: '3+ tesis'
    },
    {
      icon: '⭐',
      title: 'Öne Çıkanlar',
      description: 'En yüksek puanlı mekanlar',
      count: '4.5+ puan'
    }
  ]

  const recentSearches = [
    'The Malt House',
    'Premium Spirits Store',
    'Whisky Corner Bar',
    'Scottish Collection'
  ]

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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
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
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-all duration-200 min-w-fit text-xs sm:text-sm mobile-touch-target ${
                  selectedFilter === filter.id
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
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

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-3 sm:p-4 text-center hover:border-amber-500/50 transition-all duration-200 min-h-[120px] flex flex-col justify-center"
            >
              <div className="text-2xl sm:text-3xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm mb-1 line-clamp-2">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 leading-tight">
                {feature.description}
              </p>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                {feature.count}
              </span>
            </motion.div>
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
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <button
                key={search}
                className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left mobile-touch-target"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{search}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 ml-2">
                  <Star className="w-3 h-3 fill-current text-yellow-400" />
                  <span>4.{5 - index}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {user ? null : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Daha Fazla Özellik İçin Üye Olun
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              • Favori mekanlarınızı kaydedin<br />
              • Mekan değerlendirmeleri yapın<br />
              • Özel indirimlerden yararlanın
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors mobile-touch-target min-h-[44px] flex items-center justify-center">
              Üye Ol
            </button>
          </motion.div>
        )}
      </div>

      {/* Location Modal */}
      <NearbyWhiskyLocations
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  )
}