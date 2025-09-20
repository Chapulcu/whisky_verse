import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useHomeStats } from '@/hooks/useHomeStats'
import { motion } from 'framer-motion'
import { 
  Wine, 
  Users, 
  Calendar, 
  Crown, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuth()
  const { stats, loading: statsLoading } = useHomeStats()


  // CRITICAL FIX: Memoized features to prevent re-creation
  const features = useMemo(() => [
    {
      icon: Wine,
      titleKey: 'home.features.collection.title',
      descriptionKey: 'home.features.collection.description',
      color: 'from-amber-500 to-orange-500',
      link: '/whiskies'
    },
    {
      icon: Users,
      titleKey: 'home.features.community.title',
      descriptionKey: 'home.features.community.description',
      color: 'from-blue-500 to-purple-500',
      link: '/groups'
    },
    {
      icon: Calendar,
      titleKey: 'home.features.events.title',
      descriptionKey: 'home.features.events.description',
      color: 'from-purple-500 to-pink-500',
      link: '/events'
    },
    {
      icon: Award,
      titleKey: 'home.features.reviews.title',
      descriptionKey: 'home.features.reviews.description',
      color: 'from-green-500 to-teal-500',
      link: '/whiskies'
    }
  ], [])

  // Dynamic stats from database
  const statsDisplay = useMemo(() => [
    { 
      number: statsLoading ? '...' : `${stats.whiskiesCount}+`, 
      labelKey: 'home.stats.whiskies',
      icon: Wine
    },
    { 
      number: statsLoading ? '...' : `${stats.membersCount}+`, 
      labelKey: 'home.stats.members',
      icon: Users
    },
    { 
      number: statsLoading ? '...' : `${stats.eventsCount}+`, 
      labelKey: 'home.stats.events',
      icon: Calendar
    },
    { 
      number: statsLoading ? '...' : `${stats.countriesCount}+`, 
      labelKey: 'home.stats.countries',
      icon: Globe
    }
  ], [stats, statsLoading])

  // CRITICAL FIX: Memoized user status checks
  const userStatus = useMemo(() => {
    return {
      isLoggedIn: !!user,
      isVip: profile?.role === 'vip' || profile?.role === 'admin',
      shouldShowUpgrade: user && profile?.role !== 'vip' && profile?.role !== 'admin'
    }
  }, [user, profile?.role])

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-secondary-600/20 to-accent-600/20 rounded-3xl" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative card-strong text-center mobile-card-spacing py-12 sm:py-16"
        >
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center floating">
                <Wine className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="mobile-heading font-cyber font-bold text-gradient mb-6">
            {t('home.heroTitle')}
          </h1>
          
          <p className="mobile-text-size text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            {t('home.heroDescription')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!userStatus.isLoggedIn ? (
              <>
                <Link to="/auth" className="btn-primary flex items-center gap-2">
                  {t('signUp')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/whiskies" className="btn-secondary flex items-center gap-2 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-300 px-6 py-3 text-slate-800 dark:text-white font-medium">
                  <Wine className="w-4 h-4" />
                  {t('whiskies')}
                </Link>
              </>
            ) : (
              <>
                <Link to="/whiskies" className="btn-primary flex items-center gap-2">
                  {t('home.exploreWhiskies')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {userStatus.shouldShowUpgrade && (
                  <Link to="/upgrade" className="btn-secondary flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    {t('upgradeToVip')}
                  </Link>
                )}
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {statsDisplay.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card text-center group hover:scale-105 transition-transform">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-cyber font-bold text-gradient mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {t(stat.labelKey)}
                </div>
              </div>
            )
          })}
        </motion.div>
      </section>

      {/* Features Section */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-cyber font-bold text-gradient mb-4">
            {t('home.features.title')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {t('home.features.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <Link
                  to={feature.link}
                  className="card group hover:scale-105 block transition-transform duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-primary-600 transition-colors">
                        {t(feature.titleKey)}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                        {t(feature.descriptionKey)}
                      </p>
                    </div>
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-primary-500" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      {!userStatus.isLoggedIn && (
        <section>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="card-strong text-center py-12"
          >
            <TrendingUp className="w-16 h-16 text-primary-500 mx-auto mb-6" />
            <h3 className="text-2xl md:text-3xl font-cyber font-bold text-gradient mb-4">
              {t('home.cta.title')}
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              {t('home.cta.description')}
            </p>
            <Link to="/auth" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              {t('home.joinWhiskyVerse')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </section>
      )}
    </div>
  )
}
