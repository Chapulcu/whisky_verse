import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface BackgroundSettings {
  id?: number
  light_background_url?: string
  dark_background_url?: string
  light_background_video_url?: string
  dark_background_video_url?: string
  background_type?: 'image' | 'video'
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
            allowedMimeTypes: [
              'image/*',
              'video/*', 
              'video/mp4',
              'video/webm',
              'video/quicktime',
              'video/avi'
            ],
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

  // Upload background video to Supabase Storage
  const uploadBackgroundVideo = async (file: File, theme: 'light' | 'dark'): Promise<string | null> => {
    try {
      setUploading(true)
      console.log('🎬 Starting background video upload:', { 
        fileName: file.name, 
        sizeMB: Math.round(file.size / (1024 * 1024) * 100) / 100,
        theme 
      })

      // Validate file type
      if (!file.type.startsWith('video/')) {
        throw new Error('Sadece video dosyaları kabul edilir')
      }

      // Validate file size (max 50MB for videos)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Video dosyası 50MB\'dan küçük olmalıdır')
      }

      // Show progress toast
      const progressToast = toast.loading('Video yükleniyor... Bu işlem birkaç dakika sürebilir')

      // Ensure bucket exists
      console.log('🪣 Checking bucket existence...')
      const bucketExists = await ensureBucketExists()
      if (!bucketExists) {
        throw new Error('Storage bucket mevcut değil')
      }
      console.log('✅ Bucket exists, proceeding with video upload')

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${theme}-background-video-${Date.now()}.${fileExt}`
      const filePath = `backgrounds/videos/${fileName}`
      console.log('📁 Video upload path:', filePath)

      // Upload to Supabase Storage with timeout
      console.log('⬆️ Starting Supabase upload...')
      const uploadPromise = supabase.storage
        .from('site-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      // Add timeout for large uploads
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout - video dosyası çok büyük olabilir')), 300000) // 5 minutes
      })

      const uploadResult = await Promise.race([uploadPromise, timeoutPromise])
      const { data: uploadData, error: uploadError } = uploadResult as any

      console.log('📤 Video upload completed:', { uploadData, uploadError })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      console.log('🔗 Getting public URL...')
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath)

      console.log('✅ Video Public URL:', publicUrl)

      // Update database settings
      const updateData = {
        [theme === 'light' ? 'light_background_video_url' : 'dark_background_video_url']: publicUrl,
        background_type: 'video' as const,
        is_active: true
      }
      console.log('💾 Updating database with video:', updateData)

      await updateBackgroundSettings(updateData)

      // Dismiss loading toast
      toast.dismiss(progressToast)
      toast.success(`🎬 ${theme === 'light' ? 'Açık' : 'Koyu'} tema video arka planı başarıyla yüklendi!`)
      return publicUrl

    } catch (error: any) {
      console.error('❌ Error uploading background video:', error)
      
      let errorMessage = 'Video arka plan yüklenirken hata oluştu'
      if (error.message?.includes('timeout')) {
        errorMessage = 'Video yükleme zaman aşımına uğradı. Daha küçük bir video deneyin.'
      } else if (error.message?.includes('too large')) {
        errorMessage = 'Video dosyası çok büyük. 50MB\'dan küçük bir video seçin.'
      } else if (error.message) {
        errorMessage += ': ' + error.message
      }
      
      toast.error(errorMessage)
      return null
    } finally {
      console.log('🏁 Video upload process finished')
      setUploading(false)
    }
  }

  // Remove background video
  const removeBackgroundVideo = async (theme: 'light' | 'dark') => {
    try {
      const currentUrl = theme === 'light' ? settings?.light_background_video_url : settings?.dark_background_video_url
      
      if (currentUrl) {
        // Extract filename from URL and delete from storage
        const fileName = currentUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('site-assets')
            .remove([`backgrounds/videos/${fileName}`])
        }
      }

      // Update settings
      const updatedSettings = {
        ...settings,
        [theme === 'light' ? 'light_background_video_url' : 'dark_background_video_url']: null,
        background_type: 'image' as const
      }

      await updateBackgroundSettings(updatedSettings)
      toast.success(`${theme === 'light' ? 'Açık' : 'Koyu'} tema video arka planı kaldırıldı`)

    } catch (error: any) {
      console.error('Error removing background video:', error)
      toast.error('Video arka plan kaldırılırken hata oluştu')
    }
  }

  // Get current background URL based on theme
  const getCurrentBackgroundUrl = (isDark: boolean): string | null => {
    if (!settings) return null
    return isDark ? settings.dark_background_url || null : settings.light_background_url || null
  }

  // Get current background video URL based on theme
  const getCurrentBackgroundVideoUrl = (isDark: boolean): string | null => {
    if (!settings || settings.background_type !== 'video') return null
    return isDark ? settings.dark_background_video_url || null : settings.light_background_video_url || null
  }

  // Check if current background is video
  const isVideoBackground = (): boolean => {
    return settings?.background_type === 'video'
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return {
    settings,
    loading,
    uploading,
    uploadBackgroundImage,
    uploadBackgroundVideo,
    updateBackgroundSettings,
    removeBackgroundImage,
    removeBackgroundVideo,
    getCurrentBackgroundUrl,
    getCurrentBackgroundVideoUrl,
    isVideoBackground,
    refetch: loadSettings
  }
}