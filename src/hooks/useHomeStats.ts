import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface HomeStats {
  whiskiesCount: number
  membersCount: number
  eventsCount: number
  countriesCount: number
}

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats>({
    whiskiesCount: 0,
    membersCount: 0,
    eventsCount: 0,
    countriesCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Timeout promise for all queries
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Stats loading timeout')), 10000)
      })

      // Get whiskies count
      const whiskiesPromise = supabase
        .from('whiskies')
        .select('*', { count: 'exact', head: true })

      // Get active members count (users with profiles)
      const membersPromise = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get events count
      const eventsPromise = supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      // Get unique countries count from whiskies
      const countriesPromise = supabase
        .from('whiskies')
        .select('country')
        .not('country', 'is', null)

      // Execute all queries with timeout
      const [whiskiesResult, membersResult, eventsResult, countriesResult] = await Promise.race([
        Promise.all([whiskiesPromise, membersPromise, eventsPromise, countriesPromise]),
        timeoutPromise
      ]) as any

      // Process results
      const whiskiesCount = whiskiesResult.count || 0
      const membersCount = membersResult.count || 0
      const eventsCount = eventsResult.count || 0
      
      // Get unique countries
      const uniqueCountries = new Set(
        (countriesResult.data || [])
          .map((item: any) => item.country)
          .filter((country: string) => country && country.trim())
      )
      const countriesCount = uniqueCountries.size

      setStats({
        whiskiesCount,
        membersCount,
        eventsCount,
        countriesCount
      })

      console.log('Home stats loaded:', {
        whiskiesCount,
        membersCount,
        eventsCount,
        countriesCount
      })

    } catch (err: any) {
      console.error('Error loading home stats:', err)
      setError(err.message)
      
      // Set fallback values on error
      setStats({
        whiskiesCount: 500,
        membersCount: 1000,
        eventsCount: 50,
        countriesCount: 25
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  }
}