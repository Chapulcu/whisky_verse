import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Award, Star, Lock, X, TrendingUp, Calendar, Camera, MapPin } from 'lucide-react'
import { useAchievements } from '@/hooks/useAchievements'
import { Achievement, AchievementCategory, AchievementRarity } from '@/types/achievements'

interface AchievementsPanelProps {
  isOpen: boolean
  onClose: () => void
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
  } = useAchievements()

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')

  const categories = [
    { id: 'all', label: 'Tümü', icon: Trophy },
    { id: 'collection', label: 'Koleksiyon', icon: Star },
    { id: 'photography', label: 'Fotoğraf', icon: Camera },
    { id: 'social', label: 'Sosyal', icon: Award },
    { id: 'exploration', label: 'Keşif', icon: MapPin },
    { id: 'expertise', label: 'Uzmanlık', icon: TrendingUp },
    { id: 'milestone', label: 'Kilometre Taşı', icon: Calendar }
  ]

  const getRarityColor = (rarity: AchievementRarity): string => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
      case 'uncommon':
        return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
      case 'rare':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
      case 'epic':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
      case 'legendary':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600'
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
    }
  }

  const getRarityBadgeColor = (rarity: AchievementRarity): string => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-500 text-white'
      case 'uncommon':
        return 'bg-green-500 text-white'
      case 'rare':
        return 'bg-blue-500 text-white'
      case 'epic':
        return 'bg-purple-500 text-white'
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getFilteredAchievements = (): Achievement[] => {
    if (selectedCategory === 'all') {
      return allAchievements
    }
    return getAchievementsByCategory(selectedCategory)
  }

  const isAchievementUnlocked = (achievementId: string): boolean => {
    return unlockedAchievements.some(ach => ach.id === achievementId)
  }

  const completionPercentage = (unlockedAchievements.length / allAchievements.length) * 100

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Başarımlar
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unlockedAchievements.length}/{allAchievements.length} kazanıldı
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {level}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Seviye
                </div>
              </div>

              <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {totalPoints}
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                  Puan
                </div>
              </div>

              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {completionPercentage.toFixed(0)}%
                </div>
                <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                  Tamamlanan
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seviye {level} → {level + 1}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {totalPoints}/{nextLevelPoints}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalPoints / nextLevelPoints) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
              {categories.map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as AchievementCategory | 'all')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Achievements List */}
          <div className="overflow-y-auto max-h-[calc(90vh-300px)] p-4 space-y-3">
            {getFilteredAchievements().map((achievement) => {
              const isUnlocked = isAchievementUnlocked(achievement.id)
              const progress = getAchievementProgress(achievement.id)

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    isUnlocked
                      ? getRarityColor(achievement.rarity)
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-3xl ${!isUnlocked ? 'filter grayscale' : ''}`}>
                      {isUnlocked ? achievement.icon : <Lock className="w-8 h-8 text-gray-400" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${
                              isUnlocked
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {achievement.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityBadgeColor(achievement.rarity)}`}>
                              {achievement.rarity.toUpperCase()}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            isUnlocked
                              ? 'text-gray-600 dark:text-gray-400'
                              : 'text-gray-500 dark:text-gray-500'
                          }`}>
                            {achievement.description}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            isUnlocked
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            +{achievement.points}
                          </div>
                          <div className="text-xs text-gray-500">puan</div>
                        </div>
                      </div>

                      {/* Progress Bar (for locked achievements) */}
                      {!isUnlocked && progress.max > 1 && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">İlerleme</span>
                            <span className="text-xs text-gray-500">
                              {progress.current}/{progress.max}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Unlocked Date */}
                      {isUnlocked && achievement.unlockedAt && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(achievement.unlockedAt).toLocaleDateString('tr-TR')} tarihinde kazanıldı
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}