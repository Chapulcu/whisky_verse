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
          
          console.log('useMultilingualWhiskies: Turkish update successful')
          toast.success('Türkçe veriler güncellendi!')
          return { success: true }
        } else {
          // Non-Turkish: Save directly as completed translation
          console.log(`useMultilingualWhiskies: Saving direct translation for ${languageCode}`)
          
          const translatedText = {
            name: translations.name || '',
            type: translations.type || '',
            description: translations.description || '',
            aroma: translations.aroma || '',
            taste: translations.taste || '',
            finish: translations.finish || '',
            color: translations.color || ''
          }

          // Check if translation job exists for this whisky/language
          console.log(`useMultilingualWhiskies: Checking existing translation for ${languageCode}`)
          
          const checkPromise = supabase
            .from('translation_jobs')
            .select('id')
            .eq('whisky_id', whiskyId)
            .eq('target_language', languageCode)
            .maybeSingle()
            
          const checkTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Check timeout')), 15000)
          })

          const { data: existing, error: existingError } = await Promise.race([checkPromise, checkTimeoutPromise]) as any

          console.log(`useMultilingualWhiskies: Check result for ${languageCode}:`, { existing, existingError })

          if (existing) {
            // Update existing translation
            console.log(`useMultilingualWhiskies: Updating existing translation for ${languageCode}`)
            
            const updateJobPromise = supabase
              .from('translation_jobs')
              .update({
                translated_text: translatedText,
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)
              
            const updateJobTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Update job timeout')), 15000)
            })

            const { error } = await Promise.race([updateJobPromise, updateJobTimeoutPromise]) as any

            if (error) {
              console.error(`useMultilingualWhiskies: Update error for ${languageCode}:`, error)
              throw error
            }
            console.log(`useMultilingualWhiskies: Update successful for ${languageCode}`)
          } else {
            // Create new completed translation
            console.log(`useMultilingualWhiskies: Creating new translation for ${languageCode}`)
            
            const insertJobPromise = supabase
              .from('translation_jobs')
              .insert({
                whisky_id: whiskyId,
                source_language: 'tr',
                target_language: languageCode,
                source_text: {}, // Empty since we're directly providing translation
                translated_text: translatedText,
                status: 'completed'
              })
              
            const insertJobTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Insert job timeout')), 15000)
            })

            const { error } = await Promise.race([insertJobPromise, insertJobTimeoutPromise]) as any

            if (error) {
              console.error(`useMultilingualWhiskies: Insert error for ${languageCode}:`, error)
              throw error
            }
            console.log(`useMultilingualWhiskies: Insert successful for ${languageCode}`)
          }
          
          console.log(`useMultilingualWhiskies: Direct translation saved for ${languageCode}`)
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
        // If multilingual structure doesn't exist, get data from whiskies table + translation_jobs
        console.log('Multilingual functions not available, getting data from whiskies + translation_jobs')
        
        const { data: whiskyData, error: whiskyError } = await supabase
          .from('whiskies')
          .select('*')
          .eq('id', whiskyId)
          .single()

        if (whiskyError) throw whiskyError
        if (!whiskyData) return []

        // Get completed translations from translation_jobs
        const { data: translations, error: translationsError } = await supabase
          .from('translation_jobs')
          .select('target_language, translated_text')
          .eq('whisky_id', whiskyId)
          .eq('status', 'completed')

        if (translationsError) {
          console.warn('Error fetching translations:', translationsError)
        }

        const result: WhiskyTranslation[] = []

        // Add Turkish (main data)
        result.push({
          whisky_id: whiskyData.id,
          language_code: 'tr',
          language_name: 'Türkçe',
          name: whiskyData.name,
          type: whiskyData.type,
          description: whiskyData.description,
          aroma: whiskyData.aroma,
          taste: whiskyData.taste,
          finish: whiskyData.finish,
          color: whiskyData.color,
          is_complete: Boolean(whiskyData.name && whiskyData.type)
        })

        // Add other language translations
        if (translations) {
          for (const translation of translations) {
            const translatedText = translation.translated_text as any
            const langName = translation.target_language === 'en' ? 'English' : 
                           translation.target_language === 'ru' ? 'Русский' : translation.target_language

            result.push({
              whisky_id: whiskyData.id,
              language_code: translation.target_language,
              language_name: langName,
              name: translatedText?.name || '',
              type: translatedText?.type || '',
              description: translatedText?.description || '',
              aroma: translatedText?.aroma || '',
              taste: translatedText?.taste || '',
              finish: translatedText?.finish || '',
              color: translatedText?.color || '',
              is_complete: Boolean(translatedText?.name && translatedText?.type)
            })
          }
        }

        // Add empty entries for missing languages
        const languages = ['en', 'ru']
        for (const lang of languages) {
          if (!result.find(r => r.language_code === lang)) {
            const langName = lang === 'en' ? 'English' : 'Русский'
            result.push({
              whisky_id: whiskyData.id,
              language_code: lang,
              language_name: langName,
              name: '',
              type: '',
              description: '',
              aroma: '',
              taste: '',
              finish: '',
              color: '',
              is_complete: false
            })
          }
        }

        return result
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