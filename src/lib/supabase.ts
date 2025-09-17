import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

console.log(`🌐 Using Supabase at: ${supabaseUrl}`)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable in production for Docker
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'whiskyverse-supabase-auth',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'whiskyverse-web'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'vip' | 'admin'
          language: 'tr' | 'en'
          bio: string | null
          location: string | null
          website: string | null
          phone: string | null
          birth_date: string | null
          preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'vip' | 'admin'
          language?: 'tr' | 'en'
          bio?: string | null
          location?: string | null
          website?: string | null
          phone?: string | null
          birth_date?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'vip' | 'admin'
          language?: 'tr' | 'en'
          bio?: string | null
          location?: string | null
          website?: string | null
          phone?: string | null
          birth_date?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
      whiskies: {
        Row: {
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
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          type: string
          country: string
          region?: string | null
          alcohol_percentage: number
          rating?: number | null
          age_years?: number | null
          color?: string | null
          aroma?: string | null
          taste?: string | null
          finish?: string | null
          description?: string | null
          image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          type?: string
          country?: string
          region?: string | null
          alcohol_percentage?: number
          rating?: number | null
          age_years?: number | null
          color?: string | null
          aroma?: string | null
          taste?: string | null
          finish?: string | null
          description?: string | null
          image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_whiskies: {
        Row: {
          id: number
          user_id: string
          whisky_id: number
          tasted: boolean
          rating: number | null
          personal_notes: string | null
          tasted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          whisky_id: number
          tasted?: boolean
          rating?: number | null
          personal_notes?: string | null
          tasted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          whisky_id?: number
          tasted?: boolean
          rating?: number | null
          personal_notes?: string | null
          tasted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}