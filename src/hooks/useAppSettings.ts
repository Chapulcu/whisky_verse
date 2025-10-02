import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type SupportedAppLanguage = 'tr' | 'en' | 'ru' | 'bg'

export interface AppSettings {
  id: number
  default_language: SupportedAppLanguage
  updated_by: string | null
  updated_at: string
}

export const SUPPORTED_APP_LANGUAGES: readonly { code: SupportedAppLanguage; label: string }[] = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'bg', label: 'Български' }
]

const APP_SETTINGS_QUERY_KEY = ['app-settings'] as const

export function useAppSettings() {
  return useQuery<AppSettings>({
    queryKey: APP_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('id, default_language, updated_by, updated_at')
        .eq('id', 1)
        .maybeSingle()

      if (error && !isNoRowError(error)) {
        throw error
      }

      if (!data) {
        return {
          id: 1,
          default_language: 'tr',
          updated_by: null,
          updated_at: new Date(0).toISOString()
        }
      }

      return data
    },
    staleTime: 5 * 60 * 1000
  })
}

interface UpdateDefaultLanguagePayload {
  language: SupportedAppLanguage
  userId?: string | null
}

export function useUpdateDefaultLanguage() {
  const queryClient = useQueryClient()

  return useMutation<AppSettings, PostgrestError, UpdateDefaultLanguagePayload>({
    mutationFn: async ({ language, userId }) => {
      const { data, error } = await supabase
        .from('app_settings')
        .update({
          default_language: language,
          updated_by: userId ?? null
        })
        .eq('id', 1)
        .select('id, default_language, updated_by, updated_at')
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(APP_SETTINGS_QUERY_KEY, data)
    }
  })
}

function isNoRowError(error: PostgrestError | null): boolean {
  if (!error) return false
  // Supabase returns PGRST116 when maybeSingle() finds no row
  return error.code === 'PGRST116'
}
