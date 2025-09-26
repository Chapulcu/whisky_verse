import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface CreateAdminData {
  email: string
  password?: string
  full_name?: string
}

export interface CreateUserData {
  email: string
  password?: string
  full_name?: string
  role?: 'user' | 'vip' | 'admin'
  language?: 'tr' | 'en'
}

export function useAdminOperations() {
  const { user, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Generate secure random password
  const generateSecurePassword = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const checkAdminPermission = () => {
    // First check if user exists
    if (!user) {
      throw new Error('Bu işlem için giriş yapmanız gereklidir')
    }

    // Admin check: either email is example@whiskyverse.com OR profile role is admin
    const isEmailAdmin = user.email === 'example@whiskyverse.com'
    const isProfileAdmin = profile && profile.role === 'admin'
    
    console.log('🔐 Admin permission check:', {
      userEmail: user.email,
      isEmailAdmin,
      profileRole: profile?.role,
      isProfileAdmin,
      hasProfile: !!profile
    })

    if (!isEmailAdmin && !isProfileAdmin) {
      throw new Error('Bu işlem için admin yetkisi gereklidir')
    }
  }

  const getAllUsers = async () => {
    checkAdminPermission()
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data
    } catch (error: any) {
      console.error('Get all users error:', error)
      const errorMessage = error.message || 'Kullanıcılar alınamadı'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (userId: string, userData: any) => {
    checkAdminPermission()
    setIsLoading(true)

    try {
      console.log('🔄 Updating user:', userId)

      // Update profile data
      const profileUpdate: any = {}

      if (userData.full_name) profileUpdate.full_name = userData.full_name
      if (userData.role) profileUpdate.role = userData.role
      if (userData.language) profileUpdate.language = userData.language

      if (Object.keys(profileUpdate).length > 0) {
        profileUpdate.updated_at = new Date().toISOString()

<<<<<<< HEAD
        // Use regular Supabase client with user session for security
        const { data, error } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId)
          .select()
          .single()
=======
        // Use fetch API to bypass session issues
        const updateResponse = await fetch(`https://example.supabase.co/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': '' 
            'apikey': ''   
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(profileUpdate)
        })
>>>>>>> 8f1943bbb6cc9d099f9098ebca4193ba08ee5f55

        if (error) {
          throw error
        }

        console.log('✅ User profile updated successfully:', data)
      }

      // For password updates, we need to use a different approach
      // Since we don't have admin privileges to update passwords directly,
      // we'll skip password updates for now and show a message
      if (userData.password) {
        toast.error('Şifre güncellemesi şu anda desteklenmiyor. Kullanıcı kendi şifresini değiştirmelidir.')
      }

      toast.success('Kullanıcı başarıyla güncellendi')
      return { success: true }
    } catch (error: any) {
      console.error('❌ Update user error:', error)
      const errorMessage = error.message || 'Kullanıcı güncellenemedi'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    checkAdminPermission()
    setIsLoading(true)
    
    try {
      // Only delete from profiles table
      // We cannot delete from auth.users without admin privileges
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      toast.success('Kullanıcı profili silindi')
      return { success: true }
    } catch (error: any) {
      console.error('Delete user error:', error)
      const errorMessage = error.message || 'Kullanıcı silinemedi'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createAdmin = async (adminData: CreateAdminData) => {
    checkAdminPermission()
    setIsLoading(true)
    
    try {
      // Generate secure password if not provided
      const securePassword = adminData.password || generateSecurePassword()

      // Use Supabase auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: securePassword,
        options: {
          data: {
            full_name: adminData.full_name || adminData.email
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Kullanıcı oluşturulamadı')

      // Create admin profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: adminData.email,
          full_name: adminData.full_name || adminData.email,
          role: 'admin',
          language: 'tr'
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Profile will be created automatically by trigger, so this might be expected
      }

      // Show generated password to admin if none was provided
      if (!adminData.password) {
        toast.success(`Admin kullanıcı oluşturuldu. Geçici şifre: ${securePassword}`, {
          duration: 10000,
          position: 'top-center'
        })
        console.warn('⚠️ Generated password for admin:', adminData.email, securePassword)
      } else {
        toast.success('Admin kullanıcı başarıyla oluşturuldu')
      }
      return authData
    } catch (error: any) {
      console.error('Create admin error:', error)
      const errorMessage = error.message || 'Admin kullanıcı oluşturulamadı'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createUser = async (userData: CreateUserData) => {
    checkAdminPermission()
    setIsLoading(true)
    
    try {
      // Generate secure password if not provided
      const securePassword = userData.password || generateSecurePassword()

      // Use Supabase auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: securePassword,
        options: {
          data: {
            full_name: userData.full_name || userData.email
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Kullanıcı oluşturulamadı')

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name || userData.email,
          role: userData.role || 'user',
          language: userData.language || 'tr'
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Profile will be created automatically by trigger, so this might be expected
      }

      const roleText = userData.role === 'admin' ? 'Admin' : userData.role === 'vip' ? 'VIP' : 'Kullanıcı'

      // Show generated password to admin if none was provided
      if (!userData.password) {
        toast.success(`${roleText} oluşturuldu. Geçici şifre: ${securePassword}`, {
          duration: 10000,
          position: 'top-center'
        })
        console.warn('⚠️ Generated password for user:', userData.email, securePassword)
      } else {
        toast.success(`${roleText} başarıyla oluşturuldu`)
      }
      return authData
    } catch (error: any) {
      console.error('Create user error:', error)
      const errorMessage = error.message || 'Kullanıcı oluşturulamadı'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    getAllUsers,
    updateUser,
    deleteUser,
    createAdmin,
    createUser,
    isLoading,
    isAdmin: profile?.role === 'admin'
  }
}
