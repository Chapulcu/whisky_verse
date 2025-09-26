import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ChevronDown } from 'lucide-react'

interface PullToRefreshIndicatorProps {
  isVisible: boolean
  isRefreshing: boolean
  progress: number
  pullDistance: number
  threshold?: number
}

export function PullToRefreshIndicator({
  isVisible,
  isRefreshing,
  progress,
  pullDistance,
  threshold = 60
}: PullToRefreshIndicatorProps) {
  const iconSize = Math.min(24 + progress * 8, 32)
  const opacity = Math.min(progress * 2, 1)
  const isReady = progress >= 1

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        >
          <div
            className="flex flex-col items-center justify-center py-4 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent"
            style={{
              transform: `translateY(${Math.max(pullDistance * 0.5 - 40, -40)}px)`,
              opacity: opacity
            }}
          >
            {/* Icon */}
            <div className={`mb-2 transition-all duration-200 ${
              isReady
                ? 'text-green-500'
                : 'text-blue-500'
            }`}>
              {isRefreshing ? (
                <RefreshCw
                  size={iconSize}
                  className="animate-spin"
                />
              ) : isReady ? (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={iconSize} />
                </motion.div>
              ) : (
                <ChevronDown
                  size={iconSize}
                  style={{
                    transform: `rotate(${progress * 180}deg)`
                  }}
                />
              )}
            </div>

            {/* Progress Ring */}
            <div className="relative w-8 h-8 mb-1">
              <svg
                className="w-8 h-8 transform -rotate-90"
                viewBox="0 0 32 32"
              >
                {/* Background Circle */}
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress Circle */}
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="87.96"
                  strokeDashoffset={87.96 - (87.96 * progress)}
                  className={`transition-all duration-200 ${
                    isReady
                      ? 'text-green-500'
                      : 'text-blue-500'
                  }`}
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Status Text */}
            <motion.p
              className={`text-sm font-medium transition-colors duration-200 ${
                isRefreshing
                  ? 'text-blue-600 dark:text-blue-400'
                  : isReady
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              animate={{
                scale: isReady ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {isRefreshing
                ? 'Yenileniyor...'
                : isReady
                ? 'Bırakın ve Yenileyin'
                : 'Yenilemek için çekin'
              }
            </motion.p>

            {/* Pull Distance Debug (Development only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mt-2">
                {Math.round(pullDistance)}px / {threshold}px ({Math.round(progress * 100)}%)
              </div>
            )}
          </div>

          {/* Animated Dots */}
          {isRefreshing && (
            <div className="flex justify-center space-x-1 pb-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                  animate={{
                    y: [-4, 4, -4],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}