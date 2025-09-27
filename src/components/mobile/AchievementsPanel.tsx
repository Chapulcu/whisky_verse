import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Award, Star, Lock, X, TrendingUp, Calendar, Camera, MapPin } from 'lucide-react'
import { useDbAchievements } from '@/hooks/useDbAchievements'
import { Achievement, AchievementCategory, AchievementRarity } from '@/types/achievements'

interface AchievementsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const categoriesConfig = [
  { id: 'all', label: 'Tümü', icon: Trophy },
  { id: 'collection', label: 'Koleksiyon', icon: Star },
  { id: 'photography', label: 'Fotoğraf', icon: Camera },
  { id: 'social', label: 'Sosyal', icon: Award },
  { id: 'exploration', label: 'Keşif', icon: MapPin },
  { id: 'expertise', label: 'Uzmanlık', icon: TrendingUp },
  { id: 'milestone', label: 'Kilometre Taşı', icon: Calendar }
] satisfies Array<{ id: AchievementCategory | 'all'; label: string; icon: React.ComponentType<any> }>

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
              <div className="sticky top-0 z-10 border-b border-white/10 bg-white/5 px-5 pt-6 pb-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 opacity-80" />
                      <div className="absolute inset-[2px] flex items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur shadow-[0_12px_25px_-20px_rgba(251,191,36,0.9)]">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold tracking-wide text-white drop-shadow">
                        Başarımlar
                      </h2>
                      <p className="text-sm text-white/70">
                        {unlockedAchievements.length}/{allAchievements.length} rozet tamamlandı
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur transition-all duration-200 hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Seviye', value: level, gradient: 'from-blue-500/70 via-indigo-500/60 to-purple-500/60' },
                    { label: 'Puan', value: totalPoints, gradient: 'from-amber-400/80 via-orange-500/65 to-amber-500/70' },
                    { label: 'Tamamlanan', value: `${completionPercentage.toFixed(0)}%`, gradient: 'from-emerald-400/70 via-teal-500/60 to-green-500/65' }
                  ].map(item => (
                    <div
                      key={item.label}
                      className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-3 shadow-[0_18px_45px_-25px_rgba(15,23,42,0.9)] backdrop-blur"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-40`} />
                      <div className="relative text-center">
                        <div className="text-2xl font-semibold text-white drop-shadow-sm">{item.value}</div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-500/15 to-purple-500/20" />
                  <div className="relative mb-3 flex items-center justify-between text-sm text-white/75">
                    <span className="font-medium tracking-wide">Seviye {level} → {level + 1}</span>
                    <span className="text-white/60">{totalPoints}/{nextLevelPoints}</span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-purple-500 shadow-[0_0_25px_rgba(251,191,36,0.55)] transition-all duration-500"
                      style={{ width: `${Math.min((totalPoints / nextLevelPoints) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                  {categoriesConfig.map(category => {
                    const IconComponent = category.icon
                    const isActive = selectedCategory === category.id

                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium tracking-wide backdrop-blur transition-all duration-200 ${
                          isActive
                            ? 'border-amber-300/60 bg-gradient-to-r from-amber-400/35 via-orange-500/30 to-purple-500/30 text-white shadow-[0_12px_35px_-20px_rgba(251,191,36,0.95)]'
                            : 'border-white/20 bg-white/10 text-white/70 hover:border-amber-300/50 hover:text-white'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        {category.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="relative flex-1 space-y-4 overflow-y-auto px-5 pb-7 pt-5">
                {getFilteredAchievements().map(achievement => {
                  const isUnlocked = isAchievementUnlocked(achievement.id)
                  const progress = getAchievementProgress(achievement.id)

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-200 ${
                        isUnlocked
                          ? 'border-white/20 bg-white/10 shadow-[0_25px_55px_-30px_rgba(251,191,36,0.85)]'
                          : 'border-white/20 bg-white/10 opacity-70'
                      }`}
                    >
                      {isUnlocked && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${rarityGradient(achievement.rarity)} opacity-35`} />
                      )}

                      <div className="relative flex items-start gap-3 p-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                          isUnlocked ? 'border-white/30 bg-white/20 text-2xl shadow-inner shadow-amber-200/25' : 'border-white/20 bg-white/10 text-white/40'
                        }`}>
                          {isUnlocked ? achievement.icon : <Lock className="h-5 w-5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h3 className={`font-semibold tracking-wide ${isUnlocked ? 'text-white' : 'text-white/60'}`}>
                                  {achievement.title}
                                </h3>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${rarityBadgeClasses(achievement.rarity)}`}>
                                  {achievement.rarity.toUpperCase()}
                                </span>
                              </div>
                              <p className={`text-sm leading-relaxed ${isUnlocked ? 'text-white/70' : 'text-white/55'}`}>
                                {achievement.description}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className={`text-lg font-semibold ${isUnlocked ? 'text-amber-300 drop-shadow' : 'text-white/40'}`}>
                                +{achievement.points}
                              </div>
                              <div className="text-[11px] uppercase tracking-[0.28em] text-white/50">puan</div>
                            </div>
                          </div>

                          {!isUnlocked && progress.max > 1 && (
                            <div className="mt-3">
                              <div className="mb-1 flex items-center justify-between text-xs text-white/60">
                                <span>İlerleme</span>
                                <span>
                                  {progress.current}/{progress.max}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-white/10">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-purple-500 shadow-[0_0_14px_rgba(251,191,36,0.55)] transition-all duration-500"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {isUnlocked && achievement.unlockedAt && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                              {new Date(achievement.unlockedAt).toLocaleDateString('tr-TR')} tarihinde kazanıldı
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
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
