import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface BackgroundSettings {
  id?: number
  light_background_url?: string
  dark_background_url?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export function useBackgroundManagement() {
  const [settings, setSettings] = useState<BackgroundSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Check if table exists and create if needed
  const ensureTableExists = async (): Promise<boolean> => {
    try {
      // Try a simple select to check if table exists
      const { error } = await supabase
        .from('site_background_settings')
        .select('id')
        .limit(1)

      if (error && error.message?.includes('does not exist')) {
        console.warn('site_background_settings table does not exist')
        toast.error('Database tablosu mevcut değil. Lütfen BACKGROUND_SETUP.md dosyasındaki SQL kodlarını çalıştırın.')
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking table:', error)
      return false
    }
  }

  // Load current background settings
  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // Ensure table exists
      const tableExists = await ensureTableExists()
      if (!tableExists) {
        setSettings({ is_active: false })
        return
      }
      
      // Get current active background settings
      const { data, error } = await supabase
        .from('site_background_settings')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Database error:', error)
        if (error.message?.includes('does not exist')) {
          toast.error('Database tablosu mevcut değil. Lütfen BACKGROUND_SETUP.md dosyasındaki adımları takip edin.')
        }
        setSettings({ is_active: false })
        return
      }

      setSettings(data || { is_active: false })
    } catch (error: any) {
      console.error('Error loading background settings:', error)
      setSettings({ is_active: false })
    } finally {
      setLoading(false)
    }
  }

  // Create bucket if it doesn't exist
  const ensureBucketExists = async (): Promise<boolean> => {
    try {
      // Try to list objects in bucket (this will fail if bucket doesn't exist)
      const { error } = await supabase.storage
        .from('site-assets')
        .list('', { limit: 1 })

      if (error && error.message?.includes('Bucket not found')) {
        // Try to create bucket
        console.log('Creating site-assets bucket...')
        const { error: createError } = await supabase.storage
          .createBucket('site-assets', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 50 * 1024 * 1024 // 50MB
          })

        if (createError) {
          console.error('Could not create bucket:', createError)
          toast.error('Bucket oluşturulamadı. Lütfen Supabase Storage\'da "site-assets" bucket\'ını manuel oluşturun.')
          return false
        }

        toast.success('Storage bucket oluşturuldu!')
        return true
      }

      return true
    } catch (error) {
      console.error('Error checking bucket:', error)
      return false
    }
  }

  // Upload background image to Supabase Storage
  const uploadBackgroundImage = async (file: File, theme: 'light' | 'dark'): Promise<string | null> => {
    try {
      setUploading(true)
      console.log('Starting background upload:', { fileName: file.name, size: file.size, theme })

      // Ensure bucket exists
      const bucketExists = await ensureBucketExists()
      if (!bucketExists) {
        throw new Error('Storage bucket mevcut değil')
      }
      console.log('Bucket exists, proceeding with upload')

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${theme}-background-${Date.now()}.${fileExt}`
      const filePath = `backgrounds/${fileName}`
      console.log('Upload path:', filePath)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      console.log('Upload result:', { uploadData, uploadError })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)

      // Update database settings
      const updateData = {
        [theme === 'light' ? 'light_background_url' : 'dark_background_url']: publicUrl,
        is_active: true
      }
      console.log('Updating database with:', updateData)

      await updateBackgroundSettings(updateData)

      toast.success(`${theme === 'light' ? 'Açık' : 'Koyu'} tema arka planı yüklendi`)
      return publicUrl

    } catch (error: any) {
      console.error('Error uploading background:', error)
      
      if (error.message?.includes('Bucket not found')) {
        toast.error('Storage bucket bulunamadı. Lütfen BACKGROUND_SETUP.md dosyasındaki adımları takip edin.')
      } else {
        toast.error('Arka plan yüklenirken hata oluştu: ' + error.message)
      }
      return null
    } finally {
      setUploading(false)
    }
  }

  // Update background settings in database
  const updateBackgroundSettings = async (newSettings: Partial<BackgroundSettings>) => {
    try {
      setLoading(true)

      if (settings?.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from('site_background_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)
          .select()
          .single()

        if (error) throw error
        setSettings(data)
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('site_background_settings')
          .insert({
            ...newSettings,
            is_active: true
          })
          .select()
          .single()

        if (error) throw error
        setSettings(data)
      }

      toast.success('Arka plan ayarları güncellendi')
    } catch (error: any) {
      console.error('Error updating background settings:', error)
      toast.error('Arka plan ayarları güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  // Remove background image
  const removeBackgroundImage = async (theme: 'light' | 'dark') => {
    try {
      const currentUrl = theme === 'light' ? settings?.light_background_url : settings?.dark_background_url
      
      if (currentUrl) {
        // Extract filename from URL and delete from storage
        const fileName = currentUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('site-assets')
            .remove([`backgrounds/${fileName}`])
        }
      }

      // Update settings
      const updatedSettings = {
        ...settings,
        [theme === 'light' ? 'light_background_url' : 'dark_background_url']: null
      }

      await updateBackgroundSettings(updatedSettings)
      toast.success(`${theme === 'light' ? 'Açık' : 'Koyu'} tema arka planı kaldırıldı`)

    } catch (error: any) {
      console.error('Error removing background:', error)
      toast.error('Arka plan kaldırılırken hata oluştu')
    }
  }

  // Get current background URL based on theme
  const getCurrentBackgroundUrl = (isDark: boolean): string | null => {
    if (!settings) return null
    return isDark ? settings.dark_background_url || null : settings.light_background_url || null
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return {
    settings,
    loading,
    uploading,
    uploadBackgroundImage,
    updateBackgroundSettings,
    removeBackgroundImage,
    getCurrentBackgroundUrl,
    refetch: loadSettings
  }
}