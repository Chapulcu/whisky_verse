import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Star, Sparkles } from 'lucide-react'
import { Achievement } from '@/types/achievements'

interface AchievementModalProps {
  achievement: Achievement | null
  isOpen: boolean
  onClose: () => void
}

export function AchievementModal({ achievement, isOpen, onClose }: AchievementModalProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen && achievement) {
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isOpen, achievement])

  if (!achievement) return null

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600'
      case 'uncommon': return 'from-green-400 to-green-600'
      case 'rare': return 'from-blue-400 to-blue-600'
      case 'epic': return 'from-purple-400 to-purple-600'
      case 'legendary': return 'from-yellow-400 to-yellow-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-gray-500/50'
      case 'uncommon': return 'shadow-green-500/50'
      case 'rare': return 'shadow-blue-500/50'
      case 'epic': return 'shadow-purple-500/50'
      case 'legendary': return 'shadow-yellow-500/50'
      default: return 'shadow-gray-500/50'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glassmorphism Container */}
            <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(achievement.rarity)} opacity-20`} />

              {/* Sparkle Effects */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    style={{
                      left: `${10 + (i % 4) * 25}%`,
                      top: `${10 + Math.floor(i / 4) * 30}%`,
                    }}
                  />
                ))}
              </div>

              {/* Header */}
              <div className="relative p-6 text-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-black/30 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Achievement Unlocked Text */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : -20 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span className="text-white/90 font-medium text-sm uppercase tracking-wider">
                      Başarım Kazandın!
                    </span>
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </motion.div>

                {/* Achievement Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: showContent ? 1 : 0, rotate: showContent ? 0 : -180 }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.5 }}
                  className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} ${getRarityGlow(achievement.rarity)} shadow-2xl mb-4`}
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm" />
                  <span className="relative text-3xl z-10">{achievement.icon}</span>

                  {/* Pulse Ring */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute inset-0 rounded-full border-2 border-current opacity-50`}
                  />
                </motion.div>

                {/* Achievement Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-3"
                >
                  <h3 className="text-xl font-bold text-white">{achievement.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed px-2">
                    {achievement.description}
                  </p>

                  {/* Rarity Badge */}
                  <div className="flex items-center justify-center gap-2">
                    <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} bg-opacity-20 backdrop-blur-sm border border-white/20`}>
                      <span className="text-white text-xs font-medium uppercase tracking-wider">
                        {achievement.rarity}
                      </span>
                    </div>

                    {/* Points */}
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-300/30">
                      <Trophy className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-amber-300 text-xs font-bold">
                        +{achievement.points}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ delay: 0.9 }}
                className="relative p-4 border-t border-white/10"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-300/30 text-white font-medium transition-all duration-200 hover:from-amber-500/30 hover:to-orange-500/30"
                >
                  Harika! 🎉
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}