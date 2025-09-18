import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { requestCache } from '@/utils/requestCache'

// Retry configuration
const RETRY_DELAYS = [300, 800, 1500] // Exponential backoff in milliseconds
const MAX_RETRIES = RETRY_DELAYS.length

export interface UserWhiskyDB {
  id: number
  user_id: string
  whisky_id: number
  tasted: boolean
  rating: number | null
  personal_notes: string | null
  tasted_at: string | null
  created_at: string
  updated_at: string
  whisky: {
    id: number
    name: string
    type: string
    country: string
    region: string | null
    alcohol_percentage: number
    color: string | null
    aroma: string | null
    taste: string | null
    finish: string | null
    description: string | null
    image_url: string | null
    age_years: number | null
    rating: number | null
  }
}

export function useUserCollection() {
  const { user } = useAuth()
  const [collection, setCollection] = useState<UserWhiskyDB[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  // Retry helper function
  const retryWithBackoff = async (
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
      console.log(`Retrying collection request in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)

      await new Promise(resolve => setTimeout(resolve, delay))

      // Check again if request is still valid after delay
      if (currentRequestId !== requestIdRef.current) {
        throw new Error('Request cancelled during retry')
      }

      return retryWithBackoff(operation, currentRequestId, retryCount + 1)
    }
  }

  const loadCollection = useCallback(async () => {
    if (!user) {
      setCollection([])
      setLoading(false)
      return
    }

    // Race condition guard: increment request ID and capture current request
    const currentRequestId = ++requestIdRef.current

    try {
      setLoading(true)
      setError(null)

      // Create cache key for deduplication
      const cacheKey = {
        type: 'user_collection',
        userId: user.id
      }

      // Execute query with retry mechanism and deduplication
      const { data, error: fetchError } = await requestCache.deduplicate(
        cacheKey,
        () => retryWithBackoff(
          async () => {
            const result = await supabase
              .from('user_whiskies')
              .select(`
                *,
                whisky:whiskies (
                  id, name, type, country, region, alcohol_percentage,
                  color, aroma, taste, finish, description, image_url,
                  age_years, rating
                )
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
            return result
          },
          currentRequestId
        ),
        15000 // 15 second cache for user collection
      )

      // Check if this is still the latest request before updating state
      if (currentRequestId !== requestIdRef.current) {
        console.log(`Collection request ${currentRequestId} ignored - newer request ${requestIdRef.current} exists`)
        return
      }

      if (fetchError) {
        console.error('Error loading collection:', fetchError)
        setError(fetchError.message)
        toast.error('Koleksiyon yüklenirken hata oluştu')
        return
      }

      setCollection(data || [])
    } catch (err: any) {
      // Check if this is still the latest request before updating error state
      if (currentRequestId === requestIdRef.current) {
        console.error('Unexpected error loading collection:', err)
        const errorMessage = err.message === 'Request cancelled' ?
          'İstek iptal edildi' : 'Beklenmeyen bir hata oluştu'
        setError(errorMessage)

        if (err.message !== 'Request cancelled') {
          toast.error('Koleksiyon yüklenirken beklenmeyen hata oluştu')
        }
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [user])

  const addToCollection = useCallback(async (whiskyId: number) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { data, error: insertError } = await supabase
        .from('user_whiskies')
        .insert([{
          user_id: user.id,
          whisky_id: whiskyId,
          tasted: false
        }])
        .select(`
          *,
          whisky:whiskies (
            id, name, type, country, region, alcohol_percentage,
            color, aroma, taste, finish, description, image_url,
            age_years, rating
          )
        `)
        .single()

      if (insertError) {
        throw insertError
      }

      setCollection(prev => [data, ...prev])

      // Invalidate user collection cache
      requestCache.invalidate({ type: 'user_collection', userId: user.id })

      return { data, error: null }
    } catch (err: any) {
      console.error('Error adding to collection:', err)
      return { data: null, error: err }
    }
  }, [user])

  const updateCollectionItem = useCallback(async (id: number, updates: Partial<UserWhiskyDB>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('user_whiskies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          whisky:whiskies (
            id, name, type, country, region, alcohol_percentage,
            color, aroma, taste, finish, description, image_url,
            age_years, rating
          )
        `)
        .single()

      if (updateError) {
        throw updateError
      }

      setCollection(prev => prev.map(item => item.id === id ? data : item))

      // Invalidate user collection cache
      if (user) {
        requestCache.invalidate({ type: 'user_collection', userId: user.id })
      }

      return { data, error: null }
    } catch (err: any) {
      console.error('Error updating collection item:', err)
      return { data: null, error: err }
    }
  }, [])

  const removeFromCollection = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_whiskies')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      setCollection(prev => prev.filter(item => item.id !== id))

      // Invalidate user collection cache
      if (user) {
        requestCache.invalidate({ type: 'user_collection', userId: user.id })
      }

      return { error: null }
    } catch (err: any) {
      console.error('Error removing from collection:', err)
      return { error: err }
    }
  }, [])

  // Refetch on window focus and online events
  useEffect(() => {
    const handleWindowFocus = () => {
      if (user) {
        console.log('Window focused - refetching collection')
        loadCollection()
      }
    }

    const handleOnline = () => {
      if (user) {
        console.log('Connection restored - refetching collection')
        loadCollection()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Page became visible - refetching collection')
        loadCollection()
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
  }, [loadCollection, user])

  useEffect(() => {
    loadCollection()

    // Cleanup on unmount or user change
    return () => {
      // Clear any pending operations
      requestIdRef.current++
    }
  }, [user?.id])

  return {
    collection,
    loading,
    error,
    loadCollection,
    addToCollection,
    updateCollectionItem,
    removeFromCollection
  }
}