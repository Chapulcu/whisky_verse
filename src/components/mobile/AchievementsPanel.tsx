/**
 * CRITICAL TRANSLATION REMINDER:
 * 🚨 NEVER USE STATIC TEXT IN UI COMPONENTS!
 * ✅ ALWAYS use: t('translationKey')
 * ❌ NEVER use: "Static text"
 * 🌍 Support all 4 languages: tr, en, ru, bg
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Award, Star, Lock, X, TrendingUp, Calendar, Camera, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDbAchievements } from '@/hooks/useDbAchievements'
import { Achievement, AchievementCategory, AchievementRarity } from '@/types/achievements'

interface AchievementsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const categoriesConfig = [
  { id: 'all', labelKey: 'achievements.categories.all', icon: Trophy },
  { id: 'collection', labelKey: 'achievements.categories.collection', icon: Star },
  { id: 'photography', labelKey: 'achievements.categories.photography', icon: Camera },
  { id: 'social', labelKey: 'achievements.categories.social', icon: Award },
  { id: 'exploration', labelKey: 'achievements.categories.exploration', icon: MapPin },
  { id: 'expertise', labelKey: 'achievements.categories.expertise', icon: TrendingUp },
  { id: 'milestone', labelKey: 'achievements.categories.milestone', icon: Calendar }
] satisfies Array<{ id: AchievementCategory | 'all'; labelKey: string; icon: React.ComponentType<any> }>

const rarityGradient = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case 'common':
      return 'from-slate-400/50 via-slate-500/35 to-slate-600/45'
    case 'uncommon':
      return 'from-emerald-400/55 via-teal-500/35 to-green-500/45'
    case 'rare':
      return 'from-sky-400/55 via-indigo-500/35 to-blue-600/45'
    case 'epic':
      return 'from-violet-500/60 via-purple-500/35 to-fuchsia-500/45'
    case 'legendary':
      return 'from-amber-400/65 via-orange-500/35 to-yellow-400/45'
    default:
      return 'from-slate-400/50 via-slate-500/35 to-slate-600/45'
  }
}

const rarityBadgeClasses = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case 'common':
      return 'bg-white/10 border border-white/20 text-white/80'
    case 'uncommon':
      return 'bg-gradient-to-r from-emerald-400/40 to-teal-500/40 text-white shadow-[0_8px_25px_-15px_rgba(16,185,129,0.75)]'
    case 'rare':
      return 'bg-gradient-to-r from-sky-400/40 to-indigo-500/40 text-white shadow-[0_8px_25px_-15px_rgba(59,130,246,0.75)]'
    case 'epic':
      return 'bg-gradient-to-r from-violet-500/40 to-fuchsia-500/40 text-white shadow-[0_8px_25px_-15px_rgba(139,92,246,0.75)]'
    case 'legendary':
      return 'bg-gradient-to-r from-amber-400/50 to-orange-500/50 text-white shadow-[0_8px_25px_-12px_rgba(251,191,36,0.9)]'
    default:
      return 'bg-white/10 border border-white/20 text-white/80'
  }
}

export function AchievementsPanel({ isOpen, onClose }: AchievementsPanelProps) {
  const { t } = useTranslation()
  const {
    unlockedAchievements,
    totalPoints,
    level,
    nextLevelPoints,
    getAchievementProgress,
    getAchievementsByCategory,
    allAchievements
  } = useDbAchievements()

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')

  const getFilteredAchievements = (): Achievement[] => {
    if (selectedCategory === 'all') return allAchievements
    return getAchievementsByCategory(selectedCategory)
  }

  const isAchievementUnlocked = (achievementId: string): boolean =>
    unlockedAchievements.some(achievement => achievement.id === achievementId)

  const completionPercentage = (unlockedAchievements.length / allAchievements.length) * 100

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 24, stiffness: 360 }}
          className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-hidden"
        >
          <div className="relative mx-auto max-w-lg rounded-t-3xl border border-white/10 bg-gradient-to-br from-slate-950/85 via-slate-900/82 to-slate-950/92 shadow-[0_-25px_80px_-40px_rgba(8,15,52,0.9)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-28 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/55 via-orange-500/45 to-rose-500/45 blur-3xl" />
              <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-gradient-to-br from-sky-500/35 via-purple-500/30 to-emerald-500/30 blur-3xl" />
            </div>

            <div className="relative flex h-full flex-col">
              <div className="sticky top-0 z-10 border-b border-white/10 bg-white/6 px-4 pt-4 pb-3 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-10 w-10">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 opacity-75" />
                      <div className="absolute inset-[2px] flex items-center justify-center rounded-full border border-white/35 bg-white/15 backdrop-blur shadow-[0_12px_22px_-18px_rgba(251,191,36,0.85)]">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="leading-tight">
                      <h2 className="text-xl font-semibold text-white">{t('achievements.title')}</h2>
                      <p className="text-sm font-medium tracking-wide text-white/70">
                        {unlockedAchievements.length}/{allAchievements.length} {t('achievements.badges')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white"
                    aria-label="Kapat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { labelKey: 'achievements.level', value: level, gradient: 'from-blue-500/70 via-indigo-500/60 to-purple-500/60' },
                    { labelKey: 'achievements.points', value: totalPoints, gradient: 'from-amber-400/80 via-orange-500/65 to-amber-500/70' },
                    { labelKey: 'achievements.completed', value: `${completionPercentage.toFixed(0)}%`, gradient: 'from-emerald-400/70 via-teal-500/60 to-green-500/65' }
                  ].map(item => (
                    <div
                      key={item.labelKey}
                      className="relative min-w-[120px] flex-1 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-3 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.85)] backdrop-blur"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-40`} />
                      <div className="relative text-center">
                        <div className="text-2xl font-bold text-white drop-shadow-sm">{item.value}</div>
                        <div className="text-xs font-medium uppercase tracking-wide text-white/75">{t(item.labelKey)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-500/15 to-purple-500/20" />
                  <div className="relative mb-3 flex items-center justify-between text-base text-white/80">
                    <span className="font-semibold tracking-wide">{t('achievements.levelProgress', { current: level, next: level + 1 })}</span>
                    <span className="font-medium text-white/70">{totalPoints}/{nextLevelPoints}</span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-purple-500 shadow-[0_0_25px_rgba(251,191,36,0.55)] transition-all duration-500"
                      style={{ width: `${Math.min((totalPoints / nextLevelPoints) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categoriesConfig.map(category => {
                      const IconComponent = category.icon
                      const isActive = selectedCategory === category.id

                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur transition-all duration-200 ${
                            isActive
                              ? 'border-amber-300/70 bg-gradient-to-br from-amber-400/35 via-orange-500/30 to-purple-500/30 text-white shadow-[0_10px_30px_-18px_rgba(251,191,36,0.95)]'
                              : 'border-white/15 bg-white/8 text-white/70 hover:border-amber-300/50 hover:text-white'
                          }`}
                          title={t(category.labelKey)}
                          aria-label={t(category.labelKey)}
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="sr-only">{t(category.labelKey)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none z-10" />
                <div className="space-y-4 overflow-y-auto px-5 pb-8 pt-5 h-full" style={{ maxHeight: 'calc(90vh - 280px)' }}>
                  {getFilteredAchievements().map(achievement => {
                  const isUnlocked = isAchievementUnlocked(achievement.id)
                  const progress = getAchievementProgress(achievement.id)

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-200 min-h-[120px] ${
                        isUnlocked
                          ? 'border-white/20 bg-white/10 shadow-[0_25px_55px_-30px_rgba(251,191,36,0.85)]'
                          : 'border-white/20 bg-white/10 opacity-70'
                      }`}
                    >
                      {isUnlocked && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${rarityGradient(achievement.rarity)} opacity-35`} />
                      )}

                      <div className="relative flex items-start gap-4 p-5">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                          isUnlocked ? 'border-white/30 bg-white/20 text-2xl shadow-inner shadow-amber-200/25' : 'border-white/20 bg-white/10 text-white/40'
                        }`}>
                          {isUnlocked ? achievement.icon : <Lock className="h-6 w-6" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="mb-2 flex flex-wrap items-center gap-3">
                                <h3 className={`text-lg font-bold tracking-wide ${isUnlocked ? 'text-white' : 'text-white/60'}`}>
                                  {achievement.title}
                                </h3>
                                <span className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide ${rarityBadgeClasses(achievement.rarity)} backdrop-blur border border-white/20`}>
                                  {t(`achievements.rarity.${achievement.rarity}`)}
                                </span>
                              </div>
                              <p className={`text-base leading-relaxed ${isUnlocked ? 'text-white/75' : 'text-white/60'}`}>
                                {achievement.description}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className={`flex items-center gap-2 text-xl font-bold ${isUnlocked ? 'text-amber-300 drop-shadow' : 'text-white/40'}`}>
                                <Trophy className="h-5 w-5" />
                                +{achievement.points}
                              </div>
                              <div className="text-sm font-semibold uppercase tracking-wide text-white/70">{t('achievements.points')}</div>
                            </div>
                          </div>

                          {!isUnlocked && progress.max > 1 && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between text-sm text-white/75">
                                <span className="font-semibold">{t('achievements.progress')}</span>
                                <span className="font-medium text-white/85">
                                  {progress.current}/{progress.max}
                                </span>
                              </div>
                              <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
                                <div
                                  className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-purple-500 shadow-[0_0_14px_rgba(251,191,36,0.55)] transition-all duration-500"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {isUnlocked && achievement.unlockedAt && (
                            <div className="mt-3">
                              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {t('achievements.unlockedAt', { date: new Date(achievement.unlockedAt).toLocaleDateString() })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
