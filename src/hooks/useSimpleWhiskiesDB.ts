import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { requestCache } from '@/utils/requestCache'

// Retry configuration
const RETRY_DELAYS = [300, 800, 1500] // Exponential backoff in milliseconds
const MAX_RETRIES = RETRY_DELAYS.length

export interface SimpleWhiskyDB {
  id: number
  name: string
  type: string
  country: string
  region: string | null
  alcohol_percentage: number
  rating: number | null
  age_years: number | null
  color: string | null
  aroma: string | null
  taste: string | null
  finish: string | null
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export function useSimpleWhiskiesDB() {
  const [whiskies, setWhiskies] = useState<SimpleWhiskyDB[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  // Retry helper function (stable via useCallback)
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>,
    currentRequestId: number,
    retryCount = 0
  ): Promise<any> => {
    try {
      return await operation()
    } catch (error: any) {
      // Check if request is still valid
      if (currentRequestId !== requestIdRef.current) {
        throw new Error('Request cancelled')
      }

      // Check if error is retryable
      const isRetryableError =
        error.code === 'PGRST301' || // Connection error
        error.code === 'PGRST302' || // Too many connections
        error.message?.includes('fetch') || // Network error
        error.message?.includes('timeout') || // Timeout error
        (error.status >= 500 && error.status < 600) // Server errors

      if (!isRetryableError || retryCount >= MAX_RETRIES) {
        throw error
      }

      // Wait before retry
      const delay = RETRY_DELAYS[retryCount]
      console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)

      await new Promise(resolve => setTimeout(resolve, delay))

      // Check again if request is still valid after delay
      if (currentRequestId !== requestIdRef.current) {
        throw new Error('Request cancelled during retry')
      }

      return retryWithBackoff(operation, currentRequestId, retryCount + 1)
    }
  }, [])

  const loadWhiskies = useCallback(async (
    limit?: number,
    offset: number = 0,
    searchTerm?: string,
    countryFilter?: string,
    typeFilter?: string
  ) => {
    // Race condition guard: increment request ID and capture current request
    const currentRequestId = ++requestIdRef.current

    try {
      // Keep previous data if we already have some; avoid full-screen loading flicker
      if (whiskies.length === 0) {
        setLoading(true)
      } else {
        setIsRefetching(true)
      }
      setError(null)

      let query = supabase
        .from('whiskies')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
      }

      if (countryFilter) {
        query = query.eq('country', countryFilter)
      }

      if (typeFilter) {
        query = query.eq('type', typeFilter)
      }

      // Apply pagination
      if (limit) {
        query = query.range(offset, offset + limit - 1)
      }

      // Create cache key for deduplication
      const cacheKey = {
        type: 'whiskies',
        limit,
        offset,
        searchTerm,
        countryFilter,
        typeFilter
      }

      // Execute query with retry mechanism and deduplication
      const { data, error: fetchError } = await requestCache.deduplicate(
        cacheKey,
        () => retryWithBackoff(async () => {
          const result = await query
          return result
        }, currentRequestId),
        10000 // 10 second cache for whiskies
      )

      // Check if this is still the latest request before updating state
      if (currentRequestId !== requestIdRef.current) {
        console.log(`Request ${currentRequestId} ignored - newer request ${requestIdRef.current} exists`)
        return
      }

      if (fetchError) {
        console.error('Error loading whiskies:', fetchError)
        setError(fetchError.message)
        toast.error('Viskiler yüklenirken hata oluştu')
        return
      }

      setWhiskies(data || [])
    } catch (err: any) {
      // Check if this is still the latest request before updating error state
      if (currentRequestId === requestIdRef.current) {
        console.error('Unexpected error loading whiskies:', err)
        const errorMessage = err.message === 'Request cancelled' ?
          'İstek iptal edildi' : 'Beklenmeyen bir hata oluştu'
        setError(errorMessage)

        if (err.message !== 'Request cancelled') {
          toast.error('Viskiler yüklenirken beklenmeyen hata oluştu')
        }
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
        setIsRefetching(false)
      }
    }
  }, [retryWithBackoff, whiskies.length])

  const addWhisky = useCallback(async (whiskyData: Partial<SimpleWhiskyDB>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('whiskies')
        .insert([whiskyData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      setWhiskies(prev => [data, ...prev])

      // Invalidate whiskies cache
      requestCache.invalidate({ type: 'whiskies' })

      return { data, error: null }
    } catch (err: any) {
      console.error('Error adding whisky:', err)
      return { data: null, error: err }
    }
  }, [])

  const updateWhisky = useCallback(async (id: number, updates: Partial<SimpleWhiskyDB>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('whiskies')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      setWhiskies(prev => prev.map(w => w.id === id ? data : w))

      // Invalidate whiskies cache
      requestCache.invalidate({ type: 'whiskies' })

      return { data, error: null }
    } catch (err: any) {
      console.error('Error updating whisky:', err)
      return { data: null, error: err }
    }
  }, [])

  const deleteWhisky = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('whiskies')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      setWhiskies(prev => prev.filter(w => w.id !== id))

      // Invalidate whiskies cache
      requestCache.invalidate({ type: 'whiskies' })

      return { error: null }
    } catch (err: any) {
      console.error('Error deleting whisky:', err)
      return { error: err }
    }
  }, [])

  // Refetch on window focus and online events
  useEffect(() => {
    const handleWindowFocus = () => {
      console.log('Window focused - refetching whiskies')
      loadWhiskies()
    }

    const handleOnline = () => {
      console.log('Connection restored - refetching whiskies')
      loadWhiskies()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible - refetching whiskies')
        loadWhiskies()
      }
    }

    // Add event listeners
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadWhiskies])

  useEffect(() => {
    loadWhiskies()

    // Cleanup on unmount
    return () => {
      // Clear any pending operations
      requestIdRef.current++
    }
  }, [])

  return {
    whiskies,
    loading,
    isRefetching,
    error,
    loadWhiskies,
    addWhisky,
    updateWhisky,
    deleteWhisky
  }
}