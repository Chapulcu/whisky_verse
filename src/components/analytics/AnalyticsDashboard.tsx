import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { AnalyticsCard } from './AnalyticsCard'
import { DonutChart } from '../charts/DonutChart'
import { LineChart } from '../charts/LineChart'
import { BarChart } from '../charts/BarChart'
import { supabase } from '@/lib/supabase'
import {
  BarChart3,
  Users,
  TrendingUp,
  Star,
  Clock,
  RotateCcw,
  Download
} from 'lucide-react'

interface DashboardData {
  aggregates: {
    total_collection_items: number
    active_collectors: number
    avg_items_per_user: number
  } | null
  topWhiskies: Array<{
    whisky_id: number
    collection_count: number
    whisky?: {
      name: string
      country: string
      type: string
    } | null
  }>
  trends: Array<{
    day: string
    items_added: number
  }>
  typeDistribution: Array<{
    type: string
    count: number
  }>
  countryDistribution: Array<{
    country: string
    count: number
  }>
  notes: {
    notes_count: number
    notes_ratio: number
    avg_note_length: number | null
  } | null
}

interface AnalyticsDashboardProps {
  refreshInterval?: number
}

export function AnalyticsDashboard({ refreshInterval = 300000 }: AnalyticsDashboardProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<DashboardData>({
    aggregates: null,
    topWhiskies: [],
    trends: [],
    typeDistribution: [],
    countryDistribution: [],
    notes: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setError(null)

      // Aggregates
      const { data: aggData, error: aggErr } = await supabase
        .from('collection_aggregates')
        .select('*')
        .single()
      if (aggErr) throw aggErr

      // Top whiskies
      const { data: topDataRaw, error: topErr } = await supabase
        .from('top_whiskies_by_collection')
        .select('whisky_id, collection_count')
        .order('collection_count', { ascending: false })
        .limit(10)
      if (topErr) throw topErr

      // Get whisky details
      const whiskyIds = (topDataRaw || []).map((r: any) => r.whisky_id)
      const whiskyMap: Record<number, any> = {}
      if (whiskyIds.length > 0) {
        const { data: whiskyRows, error: wErr } = await supabase
          .from('whiskies')
          .select('id, name, country, type')
          .in('id', whiskyIds)
        if (wErr) throw wErr
        for (const w of whiskyRows || []) {
          whiskyMap[w.id as number] = w
        }
      }

      // Trends
      const { data: trendData, error: trendErr } = await supabase
        .from('trends_collection_daily')
        .select('*')
        .order('day', { ascending: true })
        .limit(30)
      if (trendErr) throw trendErr

      // Type distribution
      const { data: typeData, error: typeErr } = await supabase
        .from('whiskies')
        .select('type')
        .not('type', 'is', null)
      if (typeErr) throw typeErr

      // Country distribution
      const { data: countryData, error: countryErr } = await supabase
        .from('whiskies')
        .select('country')
        .not('country', 'is', null)
      if (countryErr) throw countryErr

      // Notes stats
      const { data: notesData, error: notesErr } = await supabase
        .from('notes_basic_stats')
        .select('*')
        .single()
      if (notesErr) throw notesErr

      // Process type distribution
      const typeCount: Record<string, number> = {}
      typeData?.forEach((item: any) => {
        typeCount[item.type] = (typeCount[item.type] || 0) + 1
      })

      // Process country distribution
      const countryCount: Record<string, number> = {}
      countryData?.forEach((item: any) => {
        countryCount[item.country] = (countryCount[item.country] || 0) + 1
      })

      console.log('Country distribution data:', countryCount)

      setData({
        aggregates: aggData,
        topWhiskies: (topDataRaw || []).map((r: any) => ({
          ...r,
          whisky: whiskyMap[r.whisky_id] || null
        })),
        trends: trendData || [],
        typeDistribution: Object.entries(typeCount).map(([type, count]) => ({
          type,
          count
        })),
        countryDistribution: Object.entries(countryCount)
          .map(([country, count]) => ({
            country,
            count
          }))
          .sort((a, b) => b.count - a.count), // Sort by count descending
        notes: notesData
      })

      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e?.message || 'Veriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  const chartData = useMemo(() => {
    const typeColors = [
      '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
      '#f97316', '#84cc16', '#06b6d4', '#a855f7', '#ec4899'
    ]

    const countryColors = [
      '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#a855f7', '#ec4899',
      '#14b8a6', '#f472b6', '#94a3b8', '#fbbf24'
    ]

    return {
      typeChart: data.typeDistribution.map((item, index) => ({
        name: item.type,
        value: item.count,
        color: typeColors[index % typeColors.length]
      })),
      countryChart: data.countryDistribution.slice(0, 12).map((item, index) => ({
        name: item.country,
        value: item.count,
        color: countryColors[index % countryColors.length]
      })),
      topWhiskiesBar: data.topWhiskies.slice(0, 8).map(item => ({
        name: item.whisky?.name?.slice(0, 20) + '...' || `Whisky #${item.whisky_id}`,
        value: item.collection_count
      }))
    }
  }, [data])

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  const exportData = () => {
    const exportObj = {
      timestamp: new Date().toISOString(),
      aggregates: data.aggregates,
      topWhiskies: data.topWhiskies,
      trends: data.trends,
      distributions: {
        types: data.typeDistribution,
        countries: data.countryDistribution
      },
      notes: data.notes
    }

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !data.aggregates) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t('analytics.dashboard.title')}
          </h2>
          {lastUpdated && (
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('analytics.dashboard.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
            aria-label={t('analytics.accessibility.refreshButton')}
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('analytics.dashboard.refresh')}
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md border border-cyan-400/20 rounded-lg transition-all duration-200"
            aria-label={t('analytics.accessibility.exportButton')}
          >
            <Download className="w-4 h-4" />
            {t('analytics.dashboard.export')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/20 rounded-lg p-4 text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title={t('analytics.cards.totalCollection')}
          value={data.aggregates?.total_collection_items?.toLocaleString() || '0'}
          subtitle={t('analytics.cards.items')}
          icon={<BarChart3 className="w-6 h-6" />}
          gradient="from-cyan-400/20 to-blue-500/20"
          delay={0}
        />
        <AnalyticsCard
          title={t('analytics.cards.activeUsers')}
          value={data.aggregates?.active_collectors || 0}
          subtitle={t('analytics.cards.collectors')}
          icon={<Users className="w-6 h-6" />}
          gradient="from-purple-400/20 to-pink-500/20"
          delay={0.1}
        />
        <AnalyticsCard
          title={t('analytics.cards.averageCollection')}
          value={data.aggregates?.avg_items_per_user?.toFixed(1) || '0.0'}
          subtitle={t('analytics.cards.itemsPerUser')}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-emerald-400/20 to-teal-500/20"
          delay={0.2}
        />
        <AnalyticsCard
          title={t('analytics.cards.notesRatio')}
          value={`${((data.notes?.notes_ratio || 0) * 100).toFixed(1)}%`}
          subtitle={`${data.notes?.notes_count || 0} ${t('analytics.cards.notes')}`}
          icon={<Star className="w-6 h-6" />}
          gradient="from-amber-400/20 to-orange-500/20"
          delay={0.3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('analytics.charts.dailyTrend')}
          </h3>
          <div className="h-64" role="img" aria-label={t('analytics.accessibility.lineChart')}>
            <LineChart data={data.trends} showAverage gradient />
          </div>
        </motion.div>

        {/* Type Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('analytics.charts.whiskyTypeDistribution')}
          </h3>
          <div className="h-64" role="img" aria-label={t('analytics.accessibility.donutChart')}>
            <DonutChart data={chartData.typeChart} />
          </div>
        </motion.div>

        {/* Top Whiskies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('analytics.charts.topWhiskies')}
          </h3>
          <div className="h-64" role="img" aria-label={t('analytics.accessibility.barChart')}>
            <BarChart
              data={chartData.topWhiskiesBar}
              showAverage={false}
              gradient
              color="#8b5cf6"
            />
          </div>
        </motion.div>

        {/* Country Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('analytics.charts.countryDistribution')}
          </h3>
          <div className="h-64" role="img" aria-label={t('analytics.accessibility.donutChart')}>
            <DonutChart data={chartData.countryChart} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}