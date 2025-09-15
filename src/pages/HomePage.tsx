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

  // CRITICAL FIX: Stable language detection
  const isEnglish = useMemo(() => {
    return i18n.language === 'en' || i18n.language === 'en-US'
  }, [i18n.language])

  // CRITICAL FIX: Memoized features to prevent re-creation
  const features = useMemo(() => [
    {
      icon: Wine,
      title: 'Kapsamlı Viski Koleksiyonu',
      titleEn: 'Comprehensive Whisky Collection',
      description: 'Dünyanın en iyi viskilerini keşfedin, tadın ve koleksiyonunuzu oluşturun.',
      descriptionEn: 'Discover, taste, and build your collection of the world\'s finest whiskies.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: Users,
      title: 'Viski Topluluğu',
      titleEn: 'Whisky Community',
      description: 'Diğer viski severlerle bağlantı kurun ve deneyimlerinizi paylaşın.',
      descriptionEn: 'Connect with fellow whisky enthusiasts and share your experiences.',
      color: 'from-blue-500 to-purple-500'
    },
    {
      icon: Calendar,
      title: 'Tatma Etkinlikleri',
      titleEn: 'Tasting Events',
      description: 'VIP üyeler için özel tatma etkinlikleri ve masterclass\'lar.',
      descriptionEn: 'Exclusive tasting events and masterclasses for VIP members.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Award,
      title: 'Uzman Değerlendirmeleri',
      titleEn: 'Expert Reviews',
      description: 'Profesyonel sommelier\'lerden detaylı tadim notları ve öneriler.',
      descriptionEn: 'Detailed tasting notes and recommendations from professional sommeliers.',
      color: 'from-green-500 to-teal-500'
    }
  ], [])

  // Dynamic stats from database
  const statsDisplay = useMemo(() => [
    { 
      number: statsLoading ? '...' : `${stats.whiskiesCount}+`, 
      label: 'Viski Çeşidi', 
      labelEn: 'Whisky Varieties',
      icon: Wine
    },
    { 
      number: statsLoading ? '...' : `${stats.membersCount}+`, 
      label: 'Aktif Üye', 
      labelEn: 'Active Members',
      icon: Users
    },
    { 
      number: statsLoading ? '...' : `${stats.eventsCount}+`, 
      label: 'Etkinlik', 
      labelEn: 'Events',
      icon: Calendar
    },
    { 
      number: statsLoading ? '...' : `${stats.countriesCount}+`, 
      label: 'Ülke', 
      labelEn: 'Countries',
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
            WhiskyVerse
          </h1>
          
          <p className="mobile-text-size text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            {isEnglish 
              ? "The ultimate platform for whisky enthusiasts. Discover, taste, and connect with the world's finest spirits."
              : "Viski severler için nihai platform. Dünyanın en iyi ruhlarını keşfedin, tadın ve bağlantı kurun."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!userStatus.isLoggedIn ? (
              <>
                <Link to="/auth" className="btn-primary flex items-center gap-2">
                  {t('signUp')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/whiskies" className="btn-glass">
                  {t('whiskies')}
                </Link>
              </>
            ) : (
              <>
                <Link to="/whiskies" className="btn-primary flex items-center gap-2">
                  {isEnglish ? 'Explore Whiskies' : 'Viskiler Keşfedin'}
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
                  {isEnglish ? stat.labelEn : stat.label}
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
            {isEnglish ? 'Discover the Features' : 'Özellikleri Keşfedin'}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {isEnglish 
              ? "Everything you need to become a whisky connoisseur and connect with like-minded enthusiasts."
              : "Bir viski uzmanı olmak ve benzer düşünceli meraklılarla bağlantı kurmak için ihtiyacınız olan her şey."
            }
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
                className="card group hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      {isEnglish ? feature.titleEn : feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      {isEnglish ? feature.descriptionEn : feature.description}
                    </p>
                  </div>
                </div>
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
              {isEnglish ? 'Ready to Start Your Journey?' : 'Yolculuğunuza Başlamaya Hazır mısınız?'}
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              {isEnglish 
                ? "Join thousands of whisky enthusiasts and start building your perfect collection today."
                : "Binlerce viski meraklısına katılın ve bugün mükemmel koleksiyonunuzu oluşturmaya başlayın."
              }
            </p>
            <Link to="/auth" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              {isEnglish ? 'Join WhiskyVerse' : 'WhiskyVerse\'e Katıl'}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </section>
      )}
    </div>
  )
}
