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
  description?: string | null
  aroma?: string | null
  taste?: string | null
  finish?: string | null
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-panel p-6 animate-pulse">
              <div className="aspect-[3/4] bg-slate-300 dark:bg-slate-700 rounded-xl mb-6"></div>
              <div className="space-y-3">
                <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-2/3"></div>
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

      {/* Featured Whiskies Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {whiskies.slice(0, 3).map((whisky, index) => (
          <motion.div
            key={whisky.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
            className="group"
          >
            <Link
              to={`/whiskies`}
              className="glass-panel block overflow-hidden hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 hover:shadow-amber-500/20 hover:border-amber-300/30"
            >
              {/* Whisky Image */}
              <div className="relative aspect-[3/4] mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 shadow-2xl ring-2 ring-amber-200/30 dark:ring-amber-500/20">
                {whisky.image_url ? (
                  <img
                    src={whisky.image_url}
                    alt={whisky.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-125"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Wine className="w-16 h-16 text-amber-400 drop-shadow-lg" />
                  </div>
                )}

                {/* Featured Badge */}
                <div className="absolute top-3 left-3">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-lg">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {t('home.featured.badge')}
                    </div>
                  </div>
                </div>

                {/* Rating Badge */}
                {whisky.rating && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1">
                      <div className="flex items-center gap-1 text-white font-medium text-sm">
                        <Star className="w-3 h-3 fill-current text-yellow-400" />
                        {whisky.rating}/100
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between text-white">
                      <span className="text-sm font-medium">{t('home.featured.viewDetails')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Whisky Info */}
              <div className="space-y-4">
                {/* Name and Type */}
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                    {whisky.name}
                  </h3>
                  <p className="text-base text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/50 dark:bg-primary-900/20 px-3 py-1 rounded-full inline-block">
                    {whisky.type}
                  </p>
                </div>

                {/* Location and ABV */}
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">{whisky.country}</span>
                    {whisky.region && <span className="text-slate-500 dark:text-slate-400">/ {whisky.region}</span>}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-100/70 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">{whisky.alcohol_percentage}%</span>
                  </div>
                </div>

                {/* Description Preview */}
                {whisky.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {whisky.description}
                  </p>
                )}

                {/* Tasting Notes Preview */}
                {(whisky.aroma || whisky.taste) && (
                  <div className="space-y-2">
                    {whisky.aroma && (
                      <div className="text-sm">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {t('whisky.aroma')}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2 line-clamp-1">
                          {whisky.aroma}
                        </span>
                      </div>
                    )}
                    {whisky.taste && (
                      <div className="text-sm">
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {t('whisky.taste')}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2 line-clamp-1">
                          {whisky.taste}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* View All Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-center"
      >
        <Link
          to="/whiskies"
          className="inline-flex items-center gap-2 btn-secondary text-lg px-8 py-4 group"
        >
          <Wine className="w-5 h-5" />
          {t('home.featured.viewAll')}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </section>
  )
}