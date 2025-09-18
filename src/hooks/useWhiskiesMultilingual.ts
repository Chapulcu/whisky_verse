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
  const pref = [lang, 'en', 'tr'] as AppLanguage[]
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
      let query = supabase
        .from('whiskies')
        .select(`
          id,
          image_url,
          alcohol_percentage,
          rating,
          age_years,
          country,
          type,
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
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filters on base table (server-side)
      if (countryFilter) {
        query = query.eq('country', countryFilter)
      }
      if (typeFilter) {
        query = query.eq('type', typeFilter)
      }

      // NOTE: Searching across translated name/type requires foreign table filters.
      // For the first iteration, apply search on base columns only (country/type).
      if (searchTerm && searchTerm.trim().length >= 3) {
        query = query.or(`type.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
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
      const mapped: MultilingualWhisky[] = rows.map(row => {
        const picked = pickBestTranslation(row, lang)
        const t = picked?.t as (MultilingualWhiskyRow['whisky_translations'] extends Array<infer U> ? U : any) | undefined
        return {
          id: row.id,
          image_url: row.image_url,
          alcohol_percentage: row.alcohol_percentage,
          rating: row.rating,
          age_years: row.age_years,
          country: row.country,
          name: t?.name || (row as any).name || '—',
          description: t?.description || (row as any).description || null,
          aroma: t?.aroma || (row as any).aroma || null,
          taste: t?.taste || (row as any).taste || null,
          finish: t?.finish || (row as any).finish || null,
          color: t?.color || (row as any).color || null,
          region: t?.region || (row as any).region || null,
          type: t?.type || row.type,
          language_code: picked?.langUsed || lang,
          translation_status: (t as any)?.translation_status,
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
