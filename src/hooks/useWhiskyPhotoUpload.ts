import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface WhiskyPhotoUploadOptions {
  whiskyId?: number
  description?: string
  isPrimary?: boolean
}

interface UploadResult {
  success: boolean
  publicUrl: string
  fileName: string
  photoRecord: any
}

export function useWhiskyPhotoUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  const uploadWhiskyPhoto = async (
    file: File,
    options: WhiskyPhotoUploadOptions = {}
  ): Promise<UploadResult> => {
    if (!user) {
      throw new Error('Kullanıcı oturumu gereklidir')
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Lütfen geçerli bir resim dosyası seçin')
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('Fotoğraf dosya boyutu 10MB\'den küçük olmalıdır')
    }

    setIsUploading(true)

    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const uniqueFileName = `whisky_${timestamp}_${sanitizedName}`

      // Use Edge Function to upload whisky photo
      const { data, error } = await supabase.functions.invoke('upload-whisky-photo', {
        body: {
          bucketName: 'whisky-photos',
          fileName: uniqueFileName,
          fileData: base64Data.split(',')[1], // Remove data URL prefix
          contentType: file.type,
          whiskyId: options.whiskyId,
          description: options.description,
          isPrimary: options.isPrimary || false
        }
      })

      if (error) {
        console.error('Whisky photo upload error:', error)
        throw new Error(error.message || 'Fotoğraf yükleme başarısız oldu')
      }

      if (!data.success) {
        throw new Error(data.error || 'Fotoğraf yükleme başarısız oldu')
      }

      toast.success('Viski fotoğrafı başarıyla yüklendi!')

      return {
        success: true,
        publicUrl: data.publicUrl,
        fileName: data.fileName,
        photoRecord: data.photoRecord
      }

    } catch (error: any) {
      console.error('Whisky photo upload error:', error)
      const errorMessage = error.message || 'Fotoğraf yükleme başarısız oldu'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  // Get user's photos
  const getUserPhotos = async (limit = 20) => {
    if (!user) return []

    const { data, error } = await supabase
      .from('whisky_photos')
      .select(`
        *,
        whisky:whiskies (
          id, name, type, country
        )
      `)
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user photos:', error)
      return []
    }

    return data || []
  }

  // Get photos for a specific whisky
  const getWhiskyPhotos = async (whiskyId: number, limit = 10) => {
    const { data, error } = await supabase
      .from('whisky_photos')
      .select(`
        *,
        profiles (
          full_name, avatar_url
        )
      `)
      .eq('whisky_id', whiskyId)
      .eq('is_approved', true)
      .order('is_primary', { ascending: false })
      .order('upload_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching whisky photos:', error)
      return []
    }

    return data || []
  }

  // Delete a photo
  const deletePhoto = async (photoId: string) => {
    if (!user) {
      throw new Error('Kullanıcı oturumu gereklidir')
    }

    const { error } = await supabase
      .from('whisky_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', user.id) // Ensure user can only delete own photos

    if (error) {
      console.error('Error deleting photo:', error)
      throw new Error('Fotoğraf silme başarısız oldu')
    }

    toast.success('Fotoğraf başarıyla silindi!')
  }

  return {
    uploadWhiskyPhoto,
    getUserPhotos,
    getWhiskyPhotos,
    deletePhoto,
    isUploading
  }
}