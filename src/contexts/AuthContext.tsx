import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

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

interface AuthContextType {
  user: SupabaseUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: any }>
  updatePassword: (password: string) => Promise<{ error?: any }>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Map Supabase auth errors to user-friendly messages
function mapAuthError(error: any) {
  const code = error?.code || error?.status || ''
  const message = (error?.message || '').toLowerCase()
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return { ...error, message: 'E-posta veya şifre hatalı' }
  }
  if (message.includes('email not confirmed') || message.includes('email not confirmed')) {
    return { ...error, message: 'E-posta doğrulanmamış. Lütfen e-postanızı kontrol edin.' }
  }
  if (message.includes('otp') || message.includes('one-time') || message.includes('magic')) {
    return { ...error, message: 'Tek kullanımlık giriş kodu doğrulanamadı.' }
  }
  if (message.includes('rate') || message.includes('too many')) {
    return { ...error, message: 'Çok fazla deneme yaptınız. Lütfen kısa bir süre sonra tekrar deneyin.' }
  }
  if (typeof error === 'string') {
    return { message: error }
  }
  return error
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Development mode session persistence
  const [isHMRRecovering, setIsHMRRecovering] = useState(false)

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
        
        // No fallback admin access - require proper profile setup
        console.warn('⚠️ Profile creation required. User must be granted admin access through database.')
        setProfile(null)
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
      
      // No hardcoded admin fallbacks - security risk
      console.warn('⚠️ Profile load failed. Admin access requires proper database setup.')
      setProfile(null)
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
          // Small delay to allow Supabase to stabilize after HMR
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error.message)
          // Retry logic for both development and production
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

        // Skip SIGNED_IN events during HMR recovery to avoid double-processing
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
  }, [])

  // Sign in method
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: mapAuthError(error) }
      }

      return { data, error: null }
    } catch (error) {
      return { error }
    }
  }

  // Sign up method
  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
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
        return { error: mapAuthError(error) }
      }

      return { data, error: null }
    } catch (error) {
      return { error }
    }
  }

  // Sign out method
  const signOut = async () => {
    console.log('🔥 AuthContext: signOut called')
    
    // Force clear state immediately, regardless of Supabase response
    console.log('🔥 AuthContext: Force clearing state immediately')
    setUser(null)
    setProfile(null)
    setLoading(false)
    
    // Clear storage immediately
    console.log('🔥 AuthContext: Clearing localStorage and sessionStorage')
    localStorage.clear()
    sessionStorage.clear()
    
    try {
      console.log('🔥 AuthContext: Calling supabase.auth.signOut()')
      // Try to sign out from Supabase but don't wait for it
      supabase.auth.signOut().catch(err => {
        console.warn('🔥 AuthContext: Supabase signOut failed but continuing:', err)
      })
    } catch (error) {
      console.warn('🔥 AuthContext: Supabase signOut error, but continuing:', error)
    }
    
    // Force reload to clear everything
    console.log('🔥 AuthContext: Force reloading page')
    setTimeout(() => {
      window.location.href = '/'
    }, 100)
  }

  // Reset password method
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { error: mapAuthError(error) }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Update password method
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        return { error: mapAuthError(error) }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Update profile method
  const updateProfile = async (updates: Partial<Profile>) => {
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

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}