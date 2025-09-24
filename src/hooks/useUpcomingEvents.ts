import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

export interface UpcomingEvent {
  id: number
  group_id: number
  title: string
  description: string | null
  start_date: string
  location: string | null
  max_participants: number
  created_by: string
  is_active: boolean
  created_at: string
  group_name?: string
  creator_name?: string
  participant_count?: number
  is_registered?: boolean
  can_register?: boolean
}

export function useUpcomingEvents() {
  const { i18n } = useTranslation()
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUpcomingEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get upcoming events (future events only)
      const now = new Date().toISOString()

      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          id,
          group_id,
          title,
          description,
          start_date,
          location,
          max_participants,
          created_by,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .gte('start_date', now) // Only future events
        .order('start_date', { ascending: true }) // Nearest first
        .limit(3) // Show max 3 upcoming events

      if (fetchError) {
        throw fetchError
      }

      setEvents(data || [])
    } catch (err: any) {
      console.error('Error loading upcoming events:', err)
      setError(err.message || 'Yaklaşan etkinlikler yüklenirken hata oluştu')
      // Set empty array to show empty state instead of error
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load events on mount and language change
  useEffect(() => {
    loadUpcomingEvents()
  }, [loadUpcomingEvents, i18n.language])

  return {
    events,
    loading,
    error,
    refetch: loadUpcomingEvents
  }
}