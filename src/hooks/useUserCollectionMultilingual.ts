import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { requestCache } from '@/utils/requestCache'
import { AppLanguage, MultilingualWhiskyRow } from './useWhiskiesMultilingual'

// Retry configuration
const RETRY_DELAYS = [300, 800, 1500] // Exponential backoff in milliseconds
const MAX_RETRIES = RETRY_DELAYS.length

export interface MultilingualUserWhiskyDB {
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
    image_url: string | null
    alcohol_percentage: number | null
    rating: number | null
    age_years: number | null
    country: string
    // Localized fields
    name: string
    description: string | null
    aroma: string | null
    taste: string | null
    finish: string | null
    color: string | null
    region: string | null
    type: string
    language_code: AppLanguage
    translation_status?: 'human' | 'machine' | 'pending' | 'failed' | undefined
  }
}

function pickBestTranslation(row: MultilingualWhiskyRow, lang: AppLanguage): { t: any; langUsed: AppLanguage } | null {
  const pref = [lang, 'en', 'tr'] as AppLanguage[]
  const translations = row.whisky_translations || []
  for (const code of pref) {
    const t = translations.find(x => x.language_code === code)
    if (t) return { t, langUsed: code }
  }
  return null
}

export function useUserCollectionMultilingual(lang: AppLanguage) {
  const { user } = useAuth()
  const [collection, setCollection] = useState<MultilingualUserWhiskyDB[]>([])
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
      console.log(`Retrying multilingual collection request in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)

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

      console.log(`🌍 Loading user collection for language: ${lang}`)

      // Create cache key for deduplication
      const cacheKey = {
        type: 'user_collection_multilingual',
        userId: user.id,
        language: lang
      }

      // Base query: select base fields + joined translations
      const query = supabase
        .from('user_whiskies')
        .select(`
          *,
          whisky:whiskies (
            id,
            name,
            image_url,
            alcohol_percentage,
            rating,
            age_years,
            country,
            region,
            type,
            description,
            aroma,
            taste,
            finish,
            color,
            created_at,
            whisky_translations:whisky_translations (
              language_code,
              name,
              description,
              aroma,
              taste,
              finish,
              color,
              region,
              type,
              translation_status
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Execute query with retry mechanism and deduplication
      const { data, error: fetchError } = await requestCache.deduplicate(
        cacheKey,
        () => retryWithBackoff(
          async () => {
            const result = await query
            return result
          },
          currentRequestId
        ),
        15000 // 15 second cache for user collection
      )

      // Check if this is still the latest request before updating state
      if (currentRequestId !== requestIdRef.current) {
        console.log(`Multilingual collection request ${currentRequestId} ignored - newer request ${requestIdRef.current} exists`)
        return
      }

      if (fetchError) {
        // If translations table does not exist yet (migration not applied), fallback to base-only query
        const msg = String(fetchError.message || '')
        const code = (fetchError as any).code || ''
        const missingRelation = code === '42P01' || msg.includes('relation') && msg.includes('whisky_translations')
        if (missingRelation) {
          // Fallback: query base collection only to keep app functional
          const baseQuery = supabase
            .from('user_whiskies')
            .select(`
              *,
              whisky:whiskies (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          const { data: baseData, error: baseErr } = await baseQuery
          if (currentRequestId !== requestIdRef.current) return
          if (baseErr) {
            console.error('Error loading base collection (fallback):', baseErr)
            setError(baseErr.message)
            toast.error('Koleksiyon yüklenirken hata oluştu')
            return
          }

          const mapped = (baseData || []).map((row: any) => ({
            ...row,
            whisky: {
              id: row.whisky.id,
              image_url: row.whisky.image_url,
              alcohol_percentage: row.whisky.alcohol_percentage,
              rating: row.whisky.rating,
              age_years: row.whisky.age_years,
              country: row.whisky.country,
              name: row.whisky.name,
              description: row.whisky.description,
              aroma: row.whisky.aroma,
              taste: row.whisky.taste,
              finish: row.whisky.finish,
              color: row.whisky.color,
              region: row.whisky.region,
              type: row.whisky.type,
              language_code: lang,
            }
          })) as MultilingualUserWhiskyDB[]

          setCollection(mapped)
          return
        } else {
          console.error('Error loading multilingual collection:', fetchError)
          setError(fetchError.message)
          toast.error('Koleksiyon yüklenirken hata oluştu')
          return
        }
      }

      const rows = (data || []) as any[]
      console.log(`📊 Received ${rows.length} collection items from database`)

      const mapped: MultilingualUserWhiskyDB[] = rows.map(row => {
        const whiskyRow = row.whisky as MultilingualWhiskyRow
        const picked = pickBestTranslation(whiskyRow, lang)
        const t = picked?.t as (MultilingualWhiskyRow['whisky_translations'] extends Array<infer U> ? U : any) | undefined

        // Debug first few whiskies
        if (whiskyRow.id <= 3) {
          console.log(`🔍 Collection Whisky ${whiskyRow.id}:`, {
            originalName: (whiskyRow as any).name,
            translations: whiskyRow.whisky_translations?.length || 0,
            picked: picked?.langUsed,
            finalName: t?.name || (whiskyRow as any).name
          })
        }

        return {
          ...row,
          whisky: {
            id: whiskyRow.id,
            image_url: whiskyRow.image_url,
            alcohol_percentage: whiskyRow.alcohol_percentage,
            rating: whiskyRow.rating,
            age_years: whiskyRow.age_years,
            country: whiskyRow.country,
            name: t?.name || (whiskyRow as any).name || '—',
            description: t?.description || (whiskyRow as any).description || null,
            aroma: t?.aroma || (whiskyRow as any).aroma || null,
            taste: t?.taste || (whiskyRow as any).taste || null,
            finish: t?.finish || (whiskyRow as any).finish || null,
            color: t?.color || (whiskyRow as any).color || null,
            region: t?.region || (whiskyRow as any).region || null,
            type: t?.type || whiskyRow.type,
            language_code: picked?.langUsed || lang,
            translation_status: (t as any)?.translation_status,
          }
        }
      })

      setCollection(mapped)
    } catch (err: any) {
      // Check if this is still the latest request before updating error state
      if (currentRequestId === requestIdRef.current) {
        console.error('Unexpected error loading multilingual collection:', err)
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
  }, [user, lang])

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
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Refresh collection to get the new item with translations
      await loadCollection()

      // Invalidate user collection cache
      requestCache.invalidate({ type: 'user_collection_multilingual', userId: user.id, language: lang })

      return { data, error: null }
    } catch (err: any) {
      console.error('Error adding to collection:', err)
      return { data: null, error: err }
    }
  }, [user, lang, loadCollection])

  const updateCollectionItem = useCallback(async (id: number, updates: any) => {
    try {
      const { data, error: updateError } = await supabase
        .from('user_whiskies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Refresh collection to get the updated item with translations
      await loadCollection()

      // Invalidate user collection cache
      if (user) {
        requestCache.invalidate({ type: 'user_collection_multilingual', userId: user.id, language: lang })
      }

      return { data, error: null }
    } catch (err: any) {
      console.error('Error updating collection item:', err)
      return { data: null, error: err }
    }
  }, [user, lang, loadCollection])

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
        requestCache.invalidate({ type: 'user_collection_multilingual', userId: user.id, language: lang })
      }

      return { error: null }
    } catch (err: any) {
      console.error('Error removing from collection:', err)
      return { error: err }
    }
  }, [user, lang])

  // Refetch on window focus and online events
  useEffect(() => {
    const handleWindowFocus = () => {
      if (user) {
        console.log('Window focused - refetching multilingual collection')
        loadCollection()
      }
    }

    const handleOnline = () => {
      if (user) {
        console.log('Connection restored - refetching multilingual collection')
        loadCollection()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Page became visible - refetching multilingual collection')
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
  }, [user?.id, lang])

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