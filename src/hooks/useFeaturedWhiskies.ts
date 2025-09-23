import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import type { FeaturedWhisky } from '@/components/FeaturedWhiskies'

export function useFeaturedWhiskies() {
  const { i18n } = useTranslation()
  const [whiskies, setWhiskies] = useState<FeaturedWhisky[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeaturedWhiskies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Query for featured whiskies with high ratings and good data
      const { data, error: fetchError } = await supabase
        .from('whiskies')
        .select(`
          id,
          name,
          type,
          country,
          region,
          alcohol_percentage,
          rating,
          image_url,
          created_at
        `)
        .not('image_url', 'is', null) // Only whiskies with images
        .order('rating', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .limit(6)

      if (fetchError) {
        throw fetchError
      }

      // Transform data and mark as featured
      const featuredWhiskies: FeaturedWhisky[] = (data || []).map(whisky => ({
        ...whisky,
        is_featured: true
      }))

      setWhiskies(featuredWhiskies)
    } catch (err: any) {
      console.error('Error loading featured whiskies:', err)
      setError(err.message || 'Öne çıkan viskiler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load featured whiskies on mount and language change
  useEffect(() => {
    loadFeaturedWhiskies()
  }, [loadFeaturedWhiskies, i18n.language])

  return {
    whiskies,
    loading,
    error,
    refetch: loadFeaturedWhiskies
  }
}