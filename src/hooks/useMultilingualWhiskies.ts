import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

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
  const [error, setError] = useState<string | null>(null)

  const loadWhiskies = useCallback(async (
    limit?: number,
    offset: number = 0,
    searchTerm?: string,
    languageCode: string = i18n.language
  ) => {
    try {
      setLoading(true)
      setError(null)
      
      // Use original whiskies table (multilingual system not set up yet)
      console.log('Using original whiskies table')
        
      let query = supabase
        .from('whiskies')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
      }

      if (limit) {
        query = query.range(offset, offset + limit - 1)
        const { data, error } = await query
        if (error) throw error
        
        // Convert to MultilingualWhisky format
        const convertedWhiskies: MultilingualWhisky[] = (data || []).map(whisky => ({
          id: whisky.id,
          alcohol_percentage: whisky.alcohol_percentage,
          rating: null, // Not available in current schema
          age_years: null, // Not available in current schema
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
        // No limit specified - load all whiskies using chunked approach
        console.log('useMultilingualWhiskies: Loading all whiskies with chunked approach...')
        
        // Get total count first
        const { count, error: countError } = await supabase
          .from('whiskies')
          .select('*', { count: 'exact', head: true })

        if (countError) throw countError
        
        const totalRecords = count || 0
        console.log(`useMultilingualWhiskies: Database has ${totalRecords} total whiskies`)
        
        if (totalRecords === 0) {
          setWhiskies([])
          return
        }

        // Load in chunks
        const chunkSize = 1000
        const chunks = Math.ceil(totalRecords / chunkSize)
        let allWhiskies: any[] = []

        for (let i = 0; i < chunks; i++) {
          const start = i * chunkSize
          const end = start + chunkSize - 1
          
          let chunkQuery = supabase
            .from('whiskies')
            .select('*')
            .range(start, end)
            .order('created_at', { ascending: false })

          if (searchTerm) {
            chunkQuery = chunkQuery.or(`name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
          }

          const { data, error } = await chunkQuery
          if (error) throw error

          if (data) {
            allWhiskies = [...allWhiskies, ...data]
          }
        }
        
        console.log(`useMultilingualWhiskies: Loaded ${allWhiskies.length} whiskies total`)
        
        // Convert to MultilingualWhisky format
        const convertedWhiskies: MultilingualWhisky[] = allWhiskies.map(whisky => ({
          id: whisky.id,
          alcohol_percentage: whisky.alcohol_percentage,
          rating: null, // Not available in current schema
          age_years: null, // Not available in current schema
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
      console.error('Error loading whiskies:', err)
      setError(err.message)
      toast.error('Viskiler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [i18n.language])

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
  }, [i18n.language]) // Only reload when language changes, not when loadWhiskies function changes

  return {
    whiskies,
    loading,
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
    try {
      setLoading(true)

      // Check if multilingual structure exists
      try {
        const { data, error } = await supabase.rpc(
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

        if (error) throw error
        
        toast.success('Çeviri güncellendi!')
        return { success: true }
      } catch (rpcError: any) {
        // If multilingual structure doesn't exist, update original table if it's Turkish
        if (languageCode === 'tr') {
          const { error } = await supabase
            .from('whiskies')
            .update({
              name: translations.name,
              type: translations.type || null,
              description: translations.description || null,
              aroma: translations.aroma || null,
              taste: translations.taste || null,
              finish: translations.finish || null,
              color: translations.color || null
            })
            .eq('id', whiskyId)

          if (error) throw error
          
          toast.success('Viski güncellendi!')
          return { success: true }
        } else {
          toast.error('Çoklu dil yapısı henüz kurulmamış. Sadece Türkçe düzenlenebilir.')
          return { success: false, error: 'Multilingual structure not available' }
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
      // Check if multilingual structure exists
      try {
        const { data, error } = await supabase.rpc(
          'get_whisky_all_translations',
          { p_whisky_id: whiskyId }
        )

        if (error) throw error
        
        // If we have translations, return them
        if (data && data.length > 0) {
          return data
        }
        
        // If no translations exist, fall back to original whisky data
        throw new Error('No translations found, falling back to original data')
      } catch (rpcError: any) {
        // If multilingual structure doesn't exist, return current data as Turkish translation
        console.log('Multilingual functions not available, providing current data as Turkish')
        
        const { data, error } = await supabase
          .from('whiskies')
          .select('*')
          .eq('id', whiskyId)
          .single()

        if (error) throw error
        if (!data) return []
        
        // Return current data as Turkish translation
        return [{
          whisky_id: data.id,
          language_code: 'tr',
          language_name: 'Türkçe',
          name: data.name,
          type: data.type,
          description: data.description,
          aroma: data.aroma,
          taste: data.taste,
          finish: data.finish,
          color: data.color,
          is_complete: Boolean(data.name && data.type)
        }]
      }
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