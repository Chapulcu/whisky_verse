import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { requestCache } from '@/utils/requestCache'

// Retry configuration at module scope to avoid re-creating on each render
const RETRY_DELAYS = [300, 800, 1500] // ms

export interface MultilingualWhisky {
  id: number
  alcohol_percentage: number
  rating: number | null
  age_years: number | null
  image_url: string | null
  country: string
  region: string | null
  created_at: string
  name: string
  type: string
  description: string | null
  aroma: string | null
  taste: string | null
  finish: string | null
  color: string | null
  language_code: string
}

export interface WhiskyTranslation {
  whisky_id: number
  language_code: string
  language_name: string
  name: string
  type: string | null
  description: string | null
  aroma: string | null
  taste: string | null
  finish: string | null
  color: string | null
  is_complete: boolean
}

export function useMultilingualWhiskies() {
  const { i18n } = useTranslation()
  const [whiskies, setWhiskies] = useState<MultilingualWhisky[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  // Generic retry with backoff helper
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>,
    currentRequestId: number,
    retryCount = 0
  ): Promise<any> => {
    try {
      return await operation()
    } catch (err: any) {
      // If another request started, cancel
      if (currentRequestId !== requestIdRef.current) {
        throw new Error('Request cancelled')
      }

      const isRetryable =
        err?.code === 'PGRST301' ||
        err?.code === 'PGRST302' ||
        err?.message?.includes('fetch') ||
        err?.message?.includes('timeout') ||
        (typeof err?.status === 'number' && err.status >= 500 && err.status < 600)

      if (!isRetryable || retryCount >= RETRY_DELAYS.length) {
        throw err
      }

      const delay = RETRY_DELAYS[retryCount]
      await new Promise(r => setTimeout(r, delay))

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
    languageCode: string = i18n.language
  ) => {
    // Race condition guard: capture request ID
    const currentRequestId = ++requestIdRef.current

    try {
      // Keep previous data if exists; reduce flicker
      if (whiskies.length === 0) {
        setLoading(true)
      } else {
        setIsRefetching(true)
      }
      setError(null)

      // Use original whiskies table (multilingual system not set up yet)
      console.log('Using original whiskies table')

      // Build base query factory to ensure fresh builder per attempt
      const buildBaseQuery = () => {
        let q = supabase
          .from('whiskies')
          .select('*')
          .order('created_at', { ascending: false })
        if (searchTerm) {
          q = q.or(`name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
        }
        return q
      }

      // Default pagination: if limit is undefined, use 24
      const effectiveLimit = (typeof limit === 'number' && limit >= 0) ? limit : 24

      if (effectiveLimit >= 0) {
        const cacheKey = {
          type: 'multilingual_whiskies',
          limit: effectiveLimit,
          offset,
          searchTerm,
          languageCode
        }

        const { data, error } = await requestCache.deduplicate(
          cacheKey,
          () => retryWithBackoff(async () => {
            const result = await buildBaseQuery().range(offset, offset + effectiveLimit - 1)
            return result
          }, currentRequestId),
          10000
        )

        if (currentRequestId !== requestIdRef.current) {
          return
        }

        if (error) throw error

        const convertedWhiskies: MultilingualWhisky[] = (data || []).map(whisky => ({
          id: whisky.id,
          alcohol_percentage: whisky.alcohol_percentage,
          rating: null,
          age_years: null,
          image_url: whisky.image_url,
          country: whisky.country,
          region: whisky.region,
          created_at: whisky.created_at,
          name: whisky.name,
          type: whisky.type,
          description: whisky.description,
          aroma: whisky.aroma,
          taste: whisky.taste,
          finish: whisky.finish,
          color: whisky.color,
          language_code: languageCode
        }))

        setWhiskies(convertedWhiskies)
      } else {
        console.log('useMultilingualWhiskies: Loading all whiskies with chunked approach...')

        const { count, error: countError } = await requestCache.deduplicate(
          { type: 'multilingual_whiskies_count', searchTerm },
          () => retryWithBackoff(async () => {
            const res = await supabase
              .from('whiskies')
              .select('*', { count: 'exact', head: true })
            return res
          }, currentRequestId),
          10000
        ) as any

        if (currentRequestId !== requestIdRef.current) {
          return
        }

        if (countError) throw countError

        const totalRecords = count || 0
        console.log(`useMultilingualWhiskies: Database has ${totalRecords} total whiskies`)

        if (totalRecords === 0) {
          setWhiskies([])
          return
        }

        const chunkSize = 1000
        const chunks = Math.ceil(totalRecords / chunkSize)
        let allWhiskies: any[] = []

        for (let i = 0; i < chunks; i++) {
          if (currentRequestId !== requestIdRef.current) {
            throw new Error('Request cancelled')
          }

          const start = i * chunkSize
          const end = start + chunkSize - 1

          const cacheKey = {
            type: 'multilingual_whiskies_chunk',
            start,
            end,
            searchTerm
          }

          const { data: chunkData, error } = await requestCache.deduplicate(
            cacheKey,
            () => retryWithBackoff(async () => {
              const chunkQuery = buildBaseQuery().range(start, end)
              const res = await chunkQuery
              return res
            }, currentRequestId),
            10000
          ) as any

          if (currentRequestId !== requestIdRef.current) {
            throw new Error('Request cancelled')
          }

          if (error) throw error
          if (chunkData) {
            allWhiskies = [...allWhiskies, ...chunkData]
          }
        }

        console.log(`useMultilingualWhiskies: Loaded ${allWhiskies.length} whiskies total`)

        const convertedWhiskies: MultilingualWhisky[] = allWhiskies.map(whisky => ({
          id: whisky.id,
          alcohol_percentage: whisky.alcohol_percentage,
          rating: null,
          age_years: null,
          image_url: whisky.image_url,
          country: whisky.country,
          region: whisky.region,
          created_at: whisky.created_at,
          name: whisky.name,
          type: whisky.type,
          description: whisky.description,
          aroma: whisky.aroma,
          taste: whisky.taste,
          finish: whisky.finish,
          color: whisky.color,
          language_code: languageCode
        }))

        setWhiskies(convertedWhiskies)
      }
    } catch (err: any) {
      if (currentRequestId === requestIdRef.current) {
        console.error('Error loading whiskies:', err)
        const message = err?.message === 'Request cancelled' ? 'İstek iptal edildi' : err?.message
        setError(message)
        if (err?.message !== 'Request cancelled') {
          toast.error('Viskiler yüklenemedi')
        }
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
        setIsRefetching(false)
      }
    }
  }, [i18n.language, retryWithBackoff, whiskies.length])

  const loadWhiskyById = useCallback(async (
    whiskyId: number,
    languageCode: string = i18n.language
  ): Promise<MultilingualWhisky | null> => {
    try {
      // First try the new multilingual structure
      try {
        const { data, error } = await supabase.rpc(
          'get_whisky_with_translations',
          {
            p_whisky_id: whiskyId,
            p_language_code: languageCode
          }
        )

        if (error) throw error
        return data?.[0] || null
      } catch (rpcError: any) {
        // If the function doesn't exist, fall back to the original table
        console.log('Multilingual functions not available, falling back to original whiskies table')
        
        const { data, error } = await supabase
          .from('whiskies')
          .select('*')
          .eq('id', whiskyId)
          .single()

        if (error) throw error
        if (!data) return null
        
        // Convert to MultilingualWhisky format
        return {
          id: data.id,
          alcohol_percentage: data.alcohol_percentage,
          rating: data.rating,
          age_years: data.age_years,
          image_url: data.image_url,
          country: data.country,
          region: data.region,
          created_at: data.created_at,
          name: data.name,
          type: data.type,
          description: data.description,
          aroma: data.aroma,
          taste: data.taste,
          finish: data.finish,
          color: data.color,
          language_code: languageCode
        }
      }
    } catch (err: any) {
      console.error('Error loading whisky:', err)
      toast.error('Viski yüklenemedi')
      return null
    }
  }, [i18n.language])

  useEffect(() => {
    loadWhiskies()
  }, [loadWhiskies, i18n.language]) // Reload when language or loader changes

  // Optional: refetch on window focus/online/visibility
  useEffect(() => {
    const handleFocus = () => {
      loadWhiskies()
    }
    const handleOnline = () => {
      loadWhiskies()
    }
    const handleVisibility = () => {
      if (!document.hidden) {
        loadWhiskies()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadWhiskies])

  return {
    whiskies,
    loading,
    isRefetching,
    error,
    loadWhiskies,
    loadWhiskyById,
    refetch: useCallback(() => loadWhiskies(), [loadWhiskies])
  }
}

export function useWhiskyTranslations() {
  const [loading, setLoading] = useState(false)

  const updateTranslation = async (
    whiskyId: number,
    languageCode: string,
    translations: {
      name: string
      type?: string
      description?: string
      aroma?: string
      taste?: string
      finish?: string
      color?: string
    }
  ) => {
    console.log('useMultilingualWhiskies: updateTranslation called with:', { whiskyId, languageCode, translations })
    try {
      setLoading(true)

      // Check if multilingual structure exists
      try {
        console.log('useMultilingualWhiskies: Trying RPC call...')
        
        // Add timeout to RPC call
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('RPC timeout')), 15000) // 15 second timeout
        })

        const rpcPromise = supabase.rpc(
          'upsert_whisky_translation',
          {
            p_whisky_id: whiskyId,
            p_language_code: languageCode,
            p_name: translations.name,
            p_type: translations.type || null,
            p_description: translations.description || null,
            p_aroma: translations.aroma || null,
            p_taste: translations.taste || null,
            p_finish: translations.finish || null,
            p_color: translations.color || null
          }
        )

        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any

        if (error) throw error
        
        console.log('useMultilingualWhiskies: RPC call successful')
        toast.success('Çeviri güncellendi!')
        return { success: true }
      } catch (rpcError: any) {
        console.log('useMultilingualWhiskies: RPC failed, using fallback method')
        
        if (languageCode === 'tr') {
          // Turkish: Update main whiskies table directly
          console.log(`useMultilingualWhiskies: Fetching current whisky data for TR update`)
          
          const fetchPromise = supabase
            .from('whiskies')
            .select('*')
            .eq('id', whiskyId)
            .single()
            
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Fetch timeout')), 15000)
          })

          const { data: currentWhisky, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any

          if (fetchError) {
            console.error('useMultilingualWhiskies: Fetch error:', fetchError)
            throw fetchError
          }
          if (!currentWhisky) throw new Error('Whisky not found')

          // Only update fields that have values, preserve existing ones
          const updateData: any = {}
          
          if (translations.name?.trim()) {
            updateData.name = translations.name
          }
          if (translations.type?.trim()) {
            updateData.type = translations.type
          }
          if (translations.description?.trim()) {
            updateData.description = translations.description
          }
          if (translations.aroma?.trim()) {
            updateData.aroma = translations.aroma
          }
          if (translations.taste?.trim()) {
            updateData.taste = translations.taste
          }
          if (translations.finish?.trim()) {
            updateData.finish = translations.finish
          }
          if (translations.color?.trim()) {
            updateData.color = translations.color
          }

          // Only update if there are actual changes
          if (Object.keys(updateData).length === 0) {
            toast.error('Güncellenecek veri bulunamadı')
            return { success: false, error: 'No data to update' }
          }

          console.log('useMultilingualWhiskies: Updating whisky data:', updateData)
          
          const updatePromise = supabase
            .from('whiskies')
            .update(updateData)
            .eq('id', whiskyId)
            
          const updateTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Update timeout')), 15000)
          })

          const { error } = await Promise.race([updatePromise, updateTimeoutPromise]) as any

          if (error) {
            console.error('useMultilingualWhiskies: Update error:', error)
            throw error
          }

          // Also upsert into whisky_translations for TR to keep multilingual table in sync
          try {
            await supabase
              .from('whisky_translations')
              .upsert({
                whisky_id: whiskyId,
                language_code: 'tr',
                source_language_code: 'tr',
                translation_status: 'human',
                name: translations.name || currentWhisky.name || '',
                type: translations.type ?? currentWhisky.type ?? '',
                description: translations.description ?? currentWhisky.description ?? '',
                aroma: translations.aroma ?? currentWhisky.aroma ?? '',
                taste: translations.taste ?? currentWhisky.taste ?? '',
                finish: translations.finish ?? currentWhisky.finish ?? '',
                color: translations.color ?? currentWhisky.color ?? ''
              }, { onConflict: 'whisky_id,language_code' })
          } catch (e) {
            console.warn('useMultilingualWhiskies: TR upsert to whisky_translations failed (non-fatal):', e)
          }

          console.log('useMultilingualWhiskies: Turkish update successful')
          toast.success('Türkçe veriler güncellendi!')
          return { success: true }
        } else {
          // Non-Turkish: Upsert directly into whisky_translations as human translation
          console.log(`useMultilingualWhiskies: Upserting translation into whisky_translations for ${languageCode}`)

          const upsertPromise = supabase
            .from('whisky_translations')
            .upsert({
              whisky_id: whiskyId,
              language_code: languageCode,
              source_language_code: 'tr',
              translation_status: 'human',
              name: translations.name || '',
              type: translations.type || '',
              description: translations.description || '',
              aroma: translations.aroma || '',
              taste: translations.taste || '',
              finish: translations.finish || '',
              color: translations.color || ''
            }, { onConflict: 'whisky_id,language_code' })

          const upsertTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upsert timeout')), 15000)
          })

          const { error } = await Promise.race([upsertPromise, upsertTimeoutPromise]) as any

          if (error) {
            console.error(`useMultilingualWhiskies: Upsert error for ${languageCode}:`, error)
            throw error
          }

          console.log(`useMultilingualWhiskies: Translation saved for ${languageCode}`)
          toast.success(`${languageCode.toUpperCase()} çevirisi kaydedildi!`)
          return { success: true }
        }
      }
    } catch (error: any) {
      console.error('Error updating translation:', error)
      toast.error('Güncelleme sırasında hata oluştu')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const getAllTranslations = async (whiskyId: number): Promise<WhiskyTranslation[]> => {
    try {
      // 1) Prefer direct read from whisky_translations (fast path)
      try {
        const wtTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Translations table timeout')), 8000))
        const wtFetch = supabase
          .from('whisky_translations')
          .select('language_code, name, type, description, aroma, taste, finish, color')
          .eq('whisky_id', whiskyId)

        const { data: wtRows, error: wtErr } = await Promise.race([wtFetch, wtTimeout]) as any
        if (wtErr) throw wtErr

        if (wtRows && wtRows.length > 0) {
          const languageNames: Record<string, string> = {
            tr: 'Türkçe',
            en: 'English',
            ru: 'Русский',
            bg: 'Български'
          }
          const mapped: WhiskyTranslation[] = wtRows.map((r: any) => ({
            whisky_id: whiskyId,
            language_code: r.language_code,
            language_name: languageNames[r.language_code] || r.language_code,
            name: r.name || '',
            type: r.type || '',
            description: r.description || '',
            aroma: r.aroma || '',
            taste: r.taste || '',
            finish: r.finish || '',
            color: r.color || '',
            is_complete: Boolean((r.name || '').trim() && (r.type || '').trim())
          }))

          // Ensure entries for missing languages exist in UI (empty placeholders)
          for (const lang of ['tr','en','ru','bg']) {
            if (!mapped.find(m => m.language_code === lang)) {
              mapped.push({
                whisky_id: whiskyId,
                language_code: lang,
                language_name: languageNames[lang] || lang,
                name: '', type: '', description: '', aroma: '', taste: '', finish: '', color: '', is_complete: false
              })
            }
          }

          return mapped.sort((a, b) => ['tr','en','ru','bg'].indexOf(a.language_code) - ['tr','en','ru','bg'].indexOf(b.language_code))
        }
      } catch (wtPathErr: any) {
        const msg = String(wtPathErr?.message || '')
        const code = (wtPathErr as any)?.code || ''
        const missing = code === '42P01' || msg.includes('relation') && msg.includes('whisky_translations')
        if (!missing) {
          console.warn('whisky_translations read failed, falling back:', wtPathErr)
        }
      }

      // 2) Fallback: return placeholders only (no base fetch) to avoid timeouts entirely
      const languageNames: Record<string, string> = {
        tr: 'Türkçe',
        en: 'English',
        ru: 'Русский',
        bg: 'Български'
      }
      const placeholders: WhiskyTranslation[] = ['tr','en','ru','bg'].map((lang) => ({
        whisky_id: whiskyId,
        language_code: lang,
        language_name: languageNames[lang] || lang,
        name: '', type: '', description: '', aroma: '', taste: '', finish: '', color: '', is_complete: false
      }))
      return placeholders
    } catch (error: any) {
      console.error('Error loading translations:', error)
      toast.error('Çeviriler yüklenemedi')
      return []
    }
  }

  const createWhiskyWithTranslations = async (
    whiskyData: {
      alcohol_percentage: number
      image_url?: string
      country?: string
      region?: string
    },
    translations: {
      [languageCode: string]: {
        name: string
        type?: string
        description?: string
        aroma?: string
        taste?: string
        finish?: string
        color?: string
      }
    }
  ) => {
    try {
      setLoading(true)

      // First create the whisky record
      const { data: whiskyResult, error: whiskyError } = await supabase
        .from('whiskies_new')
        .insert({
          alcohol_percentage: whiskyData.alcohol_percentage,
          image_url: whiskyData.image_url || null,
          country: whiskyData.country || null,
          region: whiskyData.region || null
        })
        .select()
        .single()

      if (whiskyError) throw whiskyError

      const whiskyId = whiskyResult.id

      // Then create translations for each language
      const translationPromises = Object.entries(translations).map(
        ([languageCode, translation]) =>
          updateTranslation(whiskyId, languageCode, translation)
      )

      await Promise.all(translationPromises)

      toast.success('Viski ve çevirileri oluşturuldu!')
      return { success: true, whiskyId }
    } catch (error: any) {
      console.error('Error creating whisky with translations:', error)
      toast.error('Viski oluşturulurken hata oluştu')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    updateTranslation,
    getAllTranslations,
    createWhiskyWithTranslations,
    loading
  }
}
