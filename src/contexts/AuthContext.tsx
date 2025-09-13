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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user profile from database
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error.message)
        
        // Special handling for admin@whiskyverse.com - create temp profile
        const currentUser = await supabase.auth.getUser()
        if (currentUser.data.user?.email === 'admin@whiskyverse.com') {
          console.log('Creating temporary admin profile for admin@whiskyverse.com')
          const tempProfile: Profile = {
            id: userId,
            email: 'admin@whiskyverse.com',
            full_name: 'System Administrator',
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
          setProfile(tempProfile)
          return
        }
        return
      }

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      
      // Fallback for admin user
      const currentUser = await supabase.auth.getUser()
      if (currentUser.data.user?.email === 'admin@whiskyverse.com') {
        const tempProfile: Profile = {
          id: userId,
          email: 'admin@whiskyverse.com',
          full_name: 'System Administrator', 
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
        setProfile(tempProfile)
      }
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error.message)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (!mounted) return

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
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  // Sign in method
  const signIn = async (email: string, password: string) => {
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
        return { error }
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
        return { error }
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
        return { error }
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