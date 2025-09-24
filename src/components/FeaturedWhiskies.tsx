import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wine,
  Star,
  MapPin,
  Percent,
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export interface FeaturedWhisky {
  id: number
  name: string
  type: string
  country: string
  region?: string | null
  alcohol_percentage: number
  rating?: number | null
  image_url?: string | null
  is_featured?: boolean
}

interface FeaturedWhiskiesProps {
  whiskies: FeaturedWhisky[]
  loading?: boolean
}

export function FeaturedWhiskies({ whiskies, loading }: FeaturedWhiskiesProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="text-center">
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto mb-4 w-64 animate-pulse"></div>
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto max-w-md animate-pulse"></div>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-panel p-3 animate-pulse flex-shrink-0 w-44 sm:w-48">
              <div className="aspect-[3/4] bg-slate-300 dark:bg-slate-700 rounded-lg mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!whiskies || whiskies.length === 0) {
    return null
  }

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center floating">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-cyber font-bold text-gradient mb-4">
          {t('home.featured.title')}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t('home.featured.subtitle')}
        </p>
      </motion.div>

      {/* Featured Whiskies Scroll Container */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {whiskies.slice(0, 6).map((whisky, index) => (
            <motion.div
              key={whisky.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="group flex-shrink-0 w-44 sm:w-48 snap-start"
            >
              <Link
                to={`/whiskies?id=${whisky.id}`}
                className="glass-panel block overflow-hidden hover:scale-[1.01] hover:shadow-lg transition-all duration-300 hover:shadow-amber-500/20 hover:border-amber-300/30 p-3 h-full"
              >
                {/* Whisky Image */}
                <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 shadow-lg ring-1 ring-amber-200/30 dark:ring-amber-500/20">
                  {whisky.image_url ? (
                    <img
                      src={whisky.image_url}
                      alt={whisky.name}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Wine className="w-12 h-12 text-amber-400" />
                    </div>
                  )}

                  {/* Featured Badge */}
                  <div className="absolute top-2 left-2">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span className="text-xs">{t('home.featured.badge')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  {whisky.rating && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-black/40 backdrop-blur-sm rounded px-2 py-0.5">
                        <div className="flex items-center gap-1 text-white font-medium text-xs">
                          <Star className="w-2.5 h-2.5 fill-current text-yellow-400" />
                          {whisky.rating}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Whisky Info */}
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight">
                      {whisky.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {whisky.country}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Scroll Indicator */}
        {whiskies && whiskies.length > 2 && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
              </div>
              <span className="ml-2">{t('home.featured.swipeToView')}</span>
            </div>
          </div>
        )}
      </div>

      {/* View All Link */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-center"
      >
        <Link
          to="/whiskies"
          className="inline-flex items-center gap-2 btn-secondary px-6 py-3 group"
        >
          <Wine className="w-4 h-4" />
          {t('home.featured.viewAll')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </section>
  )
}