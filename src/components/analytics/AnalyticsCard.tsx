import React from 'react'
import { motion } from 'framer-motion'

interface AnalyticsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  gradient?: string
  delay?: number
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = "from-cyan-400/20 to-purple-500/20",
  delay = 0
}: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 100
      }}
      className="relative group"
    >
      {/* Background with glassmorphism */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl`} />
      <div className="absolute inset-0 bg-white/10 dark:bg-black/10 rounded-2xl backdrop-blur-md border border-white/20 dark:border-white/10" />

      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              {title}
            </h3>
            <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className="text-cyan-400 opacity-70">
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-1">
            <span className={`text-xs px-2 py-1 rounded-full ${
              trend.isPositive
                ? 'text-emerald-400 bg-emerald-400/20'
                : 'text-red-400 bg-red-400/20'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              vs geçen dönem
            </span>
          </div>
        )}
      </div>

      {/* Hover animation */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-transparent"
        whileHover={{
          borderColor: "rgba(6, 182, 212, 0.3)",
          scale: 1.02,
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}