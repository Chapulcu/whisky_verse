import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export type AppLanguage = 'tr' | 'en' | 'ru'

export interface MultilingualWhiskyRow {
  id: number
  image_url: string | null
  alcohol_percentage: number | null
  rating: number | null
  age_years: number | null
  country: string
  type: string
  whisky_translations?: Array<{
    language_code: AppLanguage
    name: string
    description: string | null
    aroma: string | null
    taste: string | null
    finish: string | null
    color: string | null
    region: string | null
    type: string | null
    country: string | null
    translation_status?: 'human' | 'machine' | 'pending' | 'failed'
  }>
}

export interface MultilingualWhisky {
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

function pickBestTranslation(row: MultilingualWhiskyRow, lang: AppLanguage): { t: any; langUsed: AppLanguage } | null {
  // For Turkish, always prefer original whiskies table data (base Turkish data)
  if (lang === 'tr') {
    return null // Force fallback to original Turkish data from whiskies table
  }

  // For other languages, prioritize: requested language, then fallback order
  const pref = [lang, 'tr', 'en'] as AppLanguage[]
  const translations = row.whisky_translations || []
  for (const code of pref) {
    const t = translations.find(x => x.language_code === code)
    if (t) return { t, langUsed: code }
  }
  return null
}

export function useWhiskiesMultilingual() {
  const [whiskies, setWhiskies] = useState<MultilingualWhisky[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const loadWhiskies = useCallback(async (
    lang: AppLanguage,
    limit: number = 12,
    offset: number = 0,
    searchTerm?: string,
    countryFilter?: string,
    typeFilter?: string
  ) => {
    const currentRequestId = ++requestIdRef.current
    try {
      if (whiskies.length === 0) {
        setLoading(true)
      } else {
        setIsRefetching(true)
      }
      setError(null)

      // Base query: select base fields + joined translations
      console.log(`🌍 Loading whiskies for language: ${lang}`)

      // Debug: Raw query URL to check what's being requested
      console.log('🔗 Full query will include whisky_translations join')

      let query = supabase
        .from('whiskies')
        .select(`
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
            country,
            translation_status
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filters on base table (server-side)
      if (countryFilter) {
        query = query.eq('country', countryFilter)
      }
      if (typeFilter) {
        query = query.eq('type', typeFilter)
      }

      // NOTE: Searching across translated name/type would require foreign table filters.
      // As a reliable baseline, search on base columns including name/type/country.
      if (searchTerm && searchTerm.trim().length >= 3) {
        query = query.or(`name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
      }

      // Pagination
      if (typeof limit === 'number') {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, count, error: fetchError } = await query

      if (currentRequestId !== requestIdRef.current) return

      if (fetchError) {
        // If translations table does not exist yet (migration not applied), fallback to base-only query
        const msg = String(fetchError.message || '')
        const code = (fetchError as any).code || ''
        const missingRelation = code === '42P01' || msg.includes('relation') && msg.includes('whisky_translations')
        if (missingRelation) {
          // Fallback: query base whiskies only to keep app functional
          let baseQuery = supabase
            .from('whiskies')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
          if (countryFilter) baseQuery = baseQuery.eq('country', countryFilter)
          if (typeFilter) baseQuery = baseQuery.eq('type', typeFilter)
          if (searchTerm && searchTerm.trim().length >= 3) {
            baseQuery = baseQuery.or(`name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
          }
          if (typeof limit === 'number') baseQuery = baseQuery.range(offset, offset + limit - 1)

          const { data: baseData, count: baseCount, error: baseErr } = await baseQuery
          if (currentRequestId !== requestIdRef.current) return
          if (baseErr) {
            console.error('Error loading base whiskies (fallback):', baseErr)
            setError(baseErr.message)
            toast.error('Viskiler yüklenirken hata oluştu')
            return
          }

          const mapped = (baseData || []).map((row: any) => ({
            id: row.id,
            image_url: row.image_url,
            alcohol_percentage: row.alcohol_percentage,
            rating: row.rating,
            age_years: row.age_years,
            country: row.country,
            name: row.name,
            description: row.description,
            aroma: row.aroma,
            taste: row.taste,
            finish: row.finish,
            color: row.color,
            region: row.region,
            type: row.type,
            language_code: lang,
          })) as MultilingualWhisky[]

          setWhiskies(mapped)
          setTotalCount(baseCount || 0)
          return
        } else {
          console.error('Error loading multilingual whiskies:', fetchError)
          setError(fetchError.message)
          toast.error('Viskiler yüklenirken hata oluştu')
          return
        }
      }

      const rows = (data || []) as MultilingualWhiskyRow[]
      console.log(`📊 Received ${rows.length} whiskies from database`)

      // Debug: Check raw data structure
      console.log('🔬 Raw data sample:', rows.slice(0, 2).map(r => ({
        id: r.id,
        name: (r as any).name,
        translations: r.whisky_translations
      })))

      const mapped: MultilingualWhisky[] = rows.map(row => {
        const picked = pickBestTranslation(row, lang)
        const t = picked?.t as (MultilingualWhiskyRow['whisky_translations'] extends Array<infer U> ? U : any) | undefined

        // Debug all whiskies for translation status
        console.log(`🔍 Whisky ${row.id} (${(row as any).name}):`, {
          requestedLang: lang,
          availableTranslations: row.whisky_translations?.map(t => t.language_code) || [],
          translationCount: row.whisky_translations?.length || 0,
          pickedLang: picked?.langUsed,
          usingFallback: !picked,
          finalName: t?.name || (row as any).name,
          hasDescription: !!(t?.description || (row as any).description),
          hasAroma: !!(t?.aroma || (row as any).aroma),
          hasTaste: !!(t?.taste || (row as any).taste),
          hasFinish: !!(t?.finish || (row as any).finish),
        })

        return {
          id: row.id,
          image_url: row.image_url,
          alcohol_percentage: row.alcohol_percentage,
          rating: row.rating,
          age_years: row.age_years,
          country: t?.country || row.country,
          name: t?.name || (row as any).name || '—',
          description: t?.description || (row as any).description || null,
          aroma: t?.aroma || (row as any).aroma || null,
          taste: t?.taste || (row as any).taste || null,
          finish: t?.finish || (row as any).finish || null,
          color: t?.color || (row as any).color || null,
          region: t?.region || (row as any).region || null,
          type: t?.type || row.type,
          language_code: picked?.langUsed || lang,
          translation_status: picked ? (t as any)?.translation_status : (lang === 'tr' ? 'human' : undefined),
        }
      })

      setWhiskies(mapped)
      setTotalCount(count || 0)
    } catch (err: any) {
      if (currentRequestId === requestIdRef.current) {
        console.error('Unexpected error loading multilingual whiskies:', err)
        setError(err?.message || 'Beklenmeyen bir hata oluştu')
        toast.error('Viskiler yüklenirken beklenmeyen hata oluştu')
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
        setIsRefetching(false)
      }
    }
  }, [whiskies.length])

  // Initial load no-op; consumers should call loadWhiskies with lang + params

  return {
    whiskies,
    totalCount,
    loading,
    isRefetching,
    error,
    loadWhiskies,
  }
}
