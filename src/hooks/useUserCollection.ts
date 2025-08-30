import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

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

  const loadCollection = useCallback(async () => {
    if (!user) {
      setCollection([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
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

      if (fetchError) {
        console.error('Error loading collection:', fetchError)
        setError(fetchError.message)
        return
      }

      setCollection(data || [])
    } catch (err) {
      console.error('Unexpected error loading collection:', err)
      setError('Unexpected error occurred')
    } finally {
      setLoading(false)
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
      return { error: null }
    } catch (err: any) {
      console.error('Error removing from collection:', err)
      return { error: err }
    }
  }, [])

  useEffect(() => {
    loadCollection()
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