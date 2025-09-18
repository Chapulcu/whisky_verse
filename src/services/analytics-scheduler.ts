import { supabase } from '@/lib/supabase'

export interface AnalyticsScheduler {
  start(): void
  stop(): void
  refresh(): Promise<void>
  getStatus(): {
    isRunning: boolean
    lastUpdate: Date | null
    nextUpdate: Date | null
  }
}

class AnalyticsSchedulerImpl implements AnalyticsScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private refreshInterval: number = 5 * 60 * 1000 // 5 dakika
  private lastUpdate: Date | null = null
  private isRunning = false

  constructor(refreshInterval?: number) {
    if (refreshInterval) {
      this.refreshInterval = refreshInterval
    }
  }

  start(): void {
    if (this.isRunning) {
      console.warn('Analytics scheduler is already running')
      return
    }

    this.isRunning = true
    this.refresh() // İlk güncelleme

    this.intervalId = setInterval(() => {
      this.refresh()
    }, this.refreshInterval)

    console.log(`Analytics scheduler started with ${this.refreshInterval / 1000}s interval`)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Analytics scheduler stopped')
  }

  async refresh(): Promise<void> {
    try {
      console.log('Refreshing analytics data...')

      // Materialized view'ları yenile
      const viewsToRefresh = [
        'collection_aggregates',
        'top_whiskies_by_collection',
        'trends_collection_daily',
        'taste_and_rating_stats_by_segment',
        'notes_basic_stats'
      ]

      // Her view için REFRESH MATERIALIZED VIEW çağırma
      for (const viewName of viewsToRefresh) {
        try {
          const { error } = await supabase.rpc('refresh_materialized_view', {
            view_name: viewName
          })

          if (error) {
            console.warn(`Failed to refresh ${viewName}:`, error.message)
          } else {
            console.log(`✓ Refreshed ${viewName}`)
          }
        } catch (e) {
          console.warn(`Error refreshing ${viewName}:`, e)
        }
      }

      // Cache'i temizle
      if (typeof window !== 'undefined' && window.caches) {
        try {
          const cacheNames = await window.caches.keys()
          const analyticsCaches = cacheNames.filter(name => name.includes('analytics'))

          for (const cacheName of analyticsCaches) {
            await window.caches.delete(cacheName)
          }
          console.log('Analytics cache cleared')
        } catch (e) {
          console.warn('Failed to clear analytics cache:', e)
        }
      }

      this.lastUpdate = new Date()
      console.log('Analytics data refresh completed at:', this.lastUpdate.toISOString())

      // Custom event gönder
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('analytics-refreshed', {
          detail: {
            timestamp: this.lastUpdate,
            views: viewsToRefresh
          }
        }))
      }

    } catch (error) {
      console.error('Analytics refresh failed:', error)
      throw error
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      nextUpdate: this.isRunning && this.lastUpdate
        ? new Date(this.lastUpdate.getTime() + this.refreshInterval)
        : null
    }
  }
}

// Global scheduler instance
let schedulerInstance: AnalyticsScheduler | null = null

export function getAnalyticsScheduler(refreshInterval?: number): AnalyticsScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AnalyticsSchedulerImpl(refreshInterval)
  }
  return schedulerInstance
}

// Supabase function için helper
export async function refreshMaterializedViews() {
  const scheduler = getAnalyticsScheduler()
  await scheduler.refresh()
}

// React hook için
export function useAnalyticsRefresh() {
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  React.useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      setLastUpdate(event.detail.timestamp)
      setIsRefreshing(false)
    }

    window.addEventListener('analytics-refreshed', handleRefresh as EventListener)

    return () => {
      window.removeEventListener('analytics-refreshed', handleRefresh as EventListener)
    }
  }, [])

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const scheduler = getAnalyticsScheduler()
      await scheduler.refresh()
    } catch (error) {
      console.error('Manual refresh failed:', error)
      setIsRefreshing(false)
    }
  }, [])

  return {
    lastUpdate,
    isRefreshing,
    refresh
  }
}

// React import fix
import React from 'react'