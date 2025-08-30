import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, fullName: string) => Promise<any>
  signOut: () => Promise<any>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<any>
  updatePassword: (password: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user profile data
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Loading profile for user:', userId)
      
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (existingProfile && !error) {
        console.log('✅ Profile found:', existingProfile)
        setProfile(existingProfile)
        return
      }

      console.log('📝 Creating new profile...')
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) return

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: currentUser.email!,
          full_name: currentUser.user_metadata?.full_name || 'Kullanıcı',
          role: 'user',
          language: 'tr'
        })
        .select()
        .single()

      if (newProfile && !createError) {
        console.log('✅ Profile created:', newProfile)
        setProfile(newProfile)
      }
    } catch (error) {
      console.error('❌ Profile loading error:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...')
        const { data: { user: initialUser } } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        console.log('👤 Initial user:', initialUser?.id)
        setUser(initialUser)
        setLoading(false)
        
        if (initialUser) {
          await loadUserProfile(initialUser.id)
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Set up auth listener - NO async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth event:', event, 'Session exists:', !!session)
        
        if (!mounted) return
        
        const currentUser = session?.user || null
        
        // Only synchronous state updates in callback
        setUser(currentUser)
        setLoading(false)
        
        if (!currentUser) {
          setProfile(null)
        } else if (event !== 'SIGNED_OUT') {
          // Schedule profile loading outside callback
          setTimeout(() => {
            if (mounted && currentUser) {
              loadUserProfile(currentUser.id)
            }
          }, 100)
        }
      }
    )

    return () => {
      console.log('🧹 Cleaning up AuthProvider')
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Auth methods
  const signIn = async (email: string, password: string) => {
    console.log('🔐 SignIn attempt for:', email)
    
    const result = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    
    if (result.error) {
      console.error('❌ SignIn error:', result.error)
    } else {
      console.log('✅ SignIn successful')
    }
    
    return result
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('📝 SignUp attempt for:', email)
    
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (result.error) {
      console.error('❌ SignUp error:', result.error)
    } else {
      console.log('✅ SignUp successful')
    }
    
    return result
  }

  const signOut = async () => {
    console.log('🚪 SignOut attempt')
    
    const result = await supabase.auth.signOut()
    
    // Clear state immediately
    setUser(null)
    setProfile(null)
    
    console.log('✅ SignOut successful')
    return result
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı')
    }

    console.log('📝 Updating profile:', updates)
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      throw error
    }

    setProfile(prev => prev ? { ...prev, ...updates } : null)
    console.log('✅ Profile updated successfully')
  }

  const resetPassword = async (email: string) => {
    console.log('🔐 Password reset request for:', email)
    
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (result.error) {
      console.error('❌ Password reset error:', result.error)
    } else {
      console.log('✅ Password reset email sent successfully')
      console.log('Redirect URL:', `${window.location.origin}/reset-password`)
    }
    
    return result
  }

  const updatePassword = async (password: string) => {
    console.log('🔐 Updating password')
    
    const result = await supabase.auth.updateUser({
      password: password
    })
    
    if (result.error) {
      console.error('❌ Password update error:', result.error)
    } else {
      console.log('✅ Password updated successfully')
    }
    
    return result
  }

  const contextValue: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword
  }

  return (
    <AuthContext.Provider value={contextValue}>
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