import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name: string
  role: 'user' | 'vip' | 'admin'
  language: 'tr' | 'en'
  avatar_url?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  phone?: string | null
  birth_date?: string | null
  preferences?: any
  created_at: string
  updated_at: string
}

// Split context into multiple contexts for better performance
interface AuthState {
  user: SupabaseUser | null
  profile: Profile | null
  loading: boolean
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: any }>
  updatePassword: (password: string) => Promise<{ error?: any }>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthStateContext = createContext<AuthState | undefined>(undefined)
const AuthActionsContext = createContext<AuthActions | undefined>(undefined)

export function OptimizedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHMRRecovering, setIsHMRRecovering] = useState(false)

  // Memoize the auth state to prevent unnecessary re-renders
  const authState = useMemo<AuthState>(() => ({
    user,
    profile,
    loading
  }), [user, profile, loading])

  // Load user profile from database
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('📝 Loading profile for user ID:', userId)

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('📝 Profile query result:', { profileData, error })

      if (error) {
        console.error('❌ Error loading profile:', error.message)

        // Check current user email for fallback logic
        const currentUser = await supabase.auth.getUser()
        const userEmail = currentUser.data.user?.email
        console.log('📧 Current user email:', userEmail)

        // Special handling for admin users
        if (userEmail === 'admin@whiskyverse.com' || userEmail === 'akhantalip@gmail.com') {
          console.log('🔑 Creating temporary admin profile for:', userEmail)
          const tempProfile: Profile = {
            id: userId,
            email: userEmail,
            full_name: userEmail === 'admin@whiskyverse.com' ? 'System Administrator' : 'Admin User',
            role: 'admin',
            language: 'tr',
            avatar_url: null,
            bio: null,
            location: null,
            website: null,
            phone: null,
            birth_date: null,
            preferences: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          console.log('✅ Setting temporary profile:', tempProfile)
          setProfile(tempProfile)
          return
        }
        return
      }

      if (profileData) {
        console.log('✅ Profile loaded successfully:', profileData)
        setProfile(profileData)
      } else {
        console.log('⚠️ No profile data returned')
      }
    } catch (error) {
      console.error('❌ Exception loading profile:', error)

      // Fallback for admin users
      const currentUser = await supabase.auth.getUser()
      const userEmail = currentUser.data.user?.email
      console.log('📧 Fallback: Current user email:', userEmail)

      if (userEmail === 'admin@whiskyverse.com' || userEmail === 'akhantalip@gmail.com') {
        console.log('🔑 Creating fallback admin profile for:', userEmail)
        const tempProfile: Profile = {
          id: userId,
          email: userEmail,
          full_name: userEmail === 'admin@whiskyverse.com' ? 'System Administrator' : 'Admin User',
          role: 'admin',
          language: 'tr',
          avatar_url: null,
          bio: null,
          location: null,
          website: null,
          phone: null,
          birth_date: null,
          preferences: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('✅ Setting fallback profile:', tempProfile)
        setProfile(tempProfile)
      }
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    let sessionCheckTimeout: NodeJS.Timeout

    // Get initial session with retry logic for HMR
    const getInitialSession = async (isRetry = false) => {
      try {
        if (isRetry) {
          setIsHMRRecovering(true)
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error.message)
          if (!isRetry) {
            console.log('🔄 Retrying session recovery...')
            sessionCheckTimeout = setTimeout(() => getInitialSession(true), import.meta.env.DEV ? 500 : 2000)
            return
          }
          setLoading(false)
          setIsHMRRecovering(false)
          return
        }

        if (session?.user) {
          console.log('✅ Session recovered:', session.user.id)
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else if (isRetry) {
          console.log('⚠️ No session after retry - user may be logged out')
        }

        setLoading(false)
        setIsHMRRecovering(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
          setIsHMRRecovering(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.id)

        if (!mounted) return

        // Skip SIGNED_IN events during HMR recovery
        if (event === 'SIGNED_IN' && isHMRRecovering) {
          console.log('🔄 Skipping SIGNED_IN during HMR recovery')
          return
        }

        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      if (sessionCheckTimeout) {
        clearTimeout(sessionCheckTimeout)
      }
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  // Memoize auth actions to prevent re-renders
  const authActions = useMemo<AuthActions>(() => ({
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          return { error }
        }

        return { data, error: null }
      } catch (error) {
        return { error }
      }
    },

    signUp: async (email: string, password: string, metadata?: { full_name?: string }) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: metadata?.full_name || email
            }
          }
        })

        if (error) {
          return { error }
        }

        return { data, error: null }
      } catch (error) {
        return { error }
      }
    },

    signOut: async () => {
      console.log('🔥 OptimizedAuthContext: signOut called')

      // Force clear state immediately
      console.log('🔥 OptimizedAuthContext: Force clearing state immediately')
      setUser(null)
      setProfile(null)
      setLoading(false)

      // Clear storage immediately
      console.log('🔥 OptimizedAuthContext: Clearing localStorage and sessionStorage')
      localStorage.clear()
      sessionStorage.clear()

      try {
        console.log('🔥 OptimizedAuthContext: Calling supabase.auth.signOut()')
        supabase.auth.signOut().catch(err => {
          console.warn('🔥 OptimizedAuthContext: Supabase signOut failed but continuing:', err)
        })
      } catch (error) {
        console.warn('🔥 OptimizedAuthContext: Supabase signOut error, but continuing:', error)
      }

      // Force reload to clear everything
      console.log('🔥 OptimizedAuthContext: Force reloading page')
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    },

    resetPassword: async (email: string) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        })

        if (error) {
          return { error }
        }

        return { error: null }
      } catch (error) {
        return { error }
      }
    },

    updatePassword: async (password: string) => {
      try {
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
          return { error }
        }

        return { error: null }
      } catch (error) {
        return { error }
      }
    },

    updateProfile: async (updates: Partial<Profile>) => {
      if (!user) {
        throw new Error('No user logged in')
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', user.id)

        if (error) {
          console.error('Profile update error:', error)

          // For admin user, update local state even if DB update fails
          if (user.email === 'admin@whiskyverse.com') {
            console.log('Admin user - updating local profile state only')
            setProfile(prev => prev ? { ...prev, ...updates } : null)
            return
          }

          throw error
        }

        // Update local state
        setProfile(prev => prev ? { ...prev, ...updates } : null)
      } catch (error) {
        // For admin user, still update local state
        if (user.email === 'admin@whiskyverse.com') {
          console.log('Admin user - fallback to local update only')
          setProfile(prev => prev ? { ...prev, ...updates } : null)
          return
        }
        throw error
      }
    }
  }), [user])

  return (
    <AuthStateContext.Provider value={authState}>
      <AuthActionsContext.Provider value={authActions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  )
}

// Separate hooks for state and actions to prevent unnecessary re-renders
export function useAuthState() {
  const context = useContext(AuthStateContext)
  if (context === undefined) {
    throw new Error('useAuthState must be used within an OptimizedAuthProvider')
  }
  return context
}

export function useAuthActions() {
  const context = useContext(AuthActionsContext)
  if (context === undefined) {
    throw new Error('useAuthActions must be used within an OptimizedAuthProvider')
  }
  return context
}

// Convenience hook that combines both (use sparingly)
export function useAuth() {
  const state = useAuthState()
  const actions = useAuthActions()
  return { ...state, ...actions }
}