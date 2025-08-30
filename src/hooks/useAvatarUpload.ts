import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useAvatarUpload() {
  const { user, updateProfile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  const uploadAvatar = async (file: File) => {
    if (!user) {
      throw new Error('Kullanıcı oturumu gereklidir')
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Lütfen geçerli bir resim dosyası seçin')
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('Avatar dosya boyutu 5MB\'den küçük olmalıdır')
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

      // Generate unique filename for avatar
      const timestamp = Date.now()
      const uniqueFileName = `avatar_${user.id}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`

      // Use Edge Function to upload avatar
      const { data, error } = await supabase.functions.invoke('upload-file', {
        body: {
          bucketName: 'avatars',
          fileName: uniqueFileName,
          fileData: base64Data.split(',')[1], // Remove data URL prefix
          contentType: file.type
        }
      })

      if (error) {
        console.error('Avatar upload error:', error)
        throw new Error(error.message || 'Avatar yükleme başarısız oldu')
      }

      const publicUrl = data.publicUrl

      // Update user profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl })

      toast.success('Avatar başarıyla güncellendi!')
      return {
        publicUrl,
        fileName: uniqueFileName
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      const errorMessage = error.message || 'Avatar yükleme başarısız oldu'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadAvatar,
    isUploading
  }
}