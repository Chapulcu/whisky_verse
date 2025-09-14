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

  const checkAdminPermission = () => {
    // First check if user exists
    if (!user) {
      throw new Error('Bu işlem için giriş yapmanız gereklidir')
    }

    // Admin check: either email is admin@whiskyverse.com OR profile role is admin
    const isEmailAdmin = user.email === 'admin@whiskyverse.com'
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
      // Update profile data
      const profileUpdate: any = {}
      
      if (userData.full_name) profileUpdate.full_name = userData.full_name
      if (userData.role) profileUpdate.role = userData.role
      if (userData.language) profileUpdate.language = userData.language
      
      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId)

        if (profileError) throw profileError
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
      console.error('Update user error:', error)
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
      // Use Supabase auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password || 'Admin123!',
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

      toast.success('Admin kullanıcı başarıyla oluşturuldu')
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
      // Use Supabase auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'DefaultPassword123!',
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
      toast.success(`${roleText} başarıyla oluşturuldu`)
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