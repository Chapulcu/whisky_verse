import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  Plus,
  CalendarX,
  Sparkles
} from 'lucide-react'
import type { UpcomingEvent } from '@/hooks/useUpcomingEvents'

interface UpcomingEventsProps {
  events: UpcomingEvent[]
  loading?: boolean
}

export function UpcomingEvents({ events, loading }: UpcomingEventsProps) {
  const { t } = useTranslation()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    })
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="text-center">
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto mb-4 w-64 animate-pulse"></div>
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto max-w-md animate-pulse"></div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="glass-panel p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center floating">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-cyber font-bold text-gradient mb-4">
          {t('home.events.title')}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t('home.events.subtitle')}
        </p>
      </motion.div>

      {/* Events List or Empty State */}
      {events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
            >
              <Link
                to="/events"
                className="glass-panel block hover:scale-[1.01] hover:shadow-lg transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-300/30 p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Date Circle */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex flex-col items-center justify-center text-white shadow-lg">
                      <span className="text-xs font-medium">
                        {formatShortDate(event.start_date).split(' ')[1]}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {formatShortDate(event.start_date).split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {event.title}
                    </h3>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-purple-500" />
                        <span className="line-clamp-1">
                          {formatDate(event.start_date)}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-purple-500" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span>{event.max_participants} {t('home.events.participants')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/30 transition-colors">
                      <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        // Empty State
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="glass-panel text-center py-12"
        >
          <CalendarX className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {t('home.events.noEvents')}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {t('home.events.noEventsDescription')}
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 btn-secondary"
          >
            <Plus className="w-4 h-4" />
            {t('home.events.createEvent')}
          </Link>
        </motion.div>
      )}

      {/* View All Link */}
      {events && events.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <Link
            to="/events"
            className="inline-flex items-center gap-2 btn-secondary px-6 py-3 group"
          >
            <Calendar className="w-4 h-4" />
            {t('home.events.viewAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      )}
    </section>
  )
}