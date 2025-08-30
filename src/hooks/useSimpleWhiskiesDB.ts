import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
  const [error, setError] = useState<string | null>(null)

  const loadWhiskies = useCallback(async (
    limit?: number,
    offset: number = 0,
    searchTerm?: string,
    countryFilter?: string,
    typeFilter?: string
  ) => {
    try {
      setLoading(true)
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

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('Error loading whiskies:', fetchError)
        setError(fetchError.message)
        return
      }

      setWhiskies(data || [])
    } catch (err) {
      console.error('Unexpected error loading whiskies:', err)
      setError('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

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
      return { error: null }
    } catch (err: any) {
      console.error('Error deleting whisky:', err)
      return { error: err }
    }
  }, [])

  useEffect(() => {
    loadWhiskies()
  }, [])

  return {
    whiskies,
    loading,
    error,
    loadWhiskies,
    addWhisky,
    updateWhisky,
    deleteWhisky
  }
}