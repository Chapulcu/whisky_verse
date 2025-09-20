import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface WhiskyData {
  name: string
  type: string
  country: string
  region?: string
  alcohol_percentage: number
  color?: string
  aroma?: string
  taste?: string
  finish?: string
  description?: string
}

export function useWhiskyUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  const uploadWhiskyImage = async (file: File, whiskeyData?: WhiskyData) => {
    if (!user) {
      throw new Error('Kullanıcı oturumu gereklidir')
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Lütfen geçerli bir resim dosyası seçin')
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('Dosya boyutu 10MB\'den küçük olmalıdır')
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

      // Generate user-scoped path: userId/filename (RLS owner check)
      const userId = user.id
      const uniqueFileName = `${userId}/${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`

      // Use Edge Function to upload image
      const { data, error } = await supabase.functions.invoke('upload-file', {
        body: {
          bucketName: 'whisky_images',
          fileName: uniqueFileName,
          fileData: base64Data.split(',')[1], // Remove data URL prefix
          contentType: file.type
        }
      })

      if (error) {
        console.error('Upload error:', error)
        throw new Error(error.message || 'Dosya yükleme başarısız oldu')
      }

      const publicUrl = data.publicUrl
      let whiskyRecord = null

      // If whiskey data is provided, save to database
      if (whiskeyData) {
        const { data: insertData, error: insertError } = await supabase
          .from('whiskies')
          .insert({
            ...whiskeyData,
            image_url: publicUrl,
            created_by: user.id
          })
          .select()
          .single()

        if (insertError) {
          console.error('Database insert error:', insertError)
          // Still return success for image upload
        } else {
          whiskyRecord = insertData
        }
      }

      toast.success('Viski resmi başarıyla yüklendi!')
      return {
        publicUrl,
        whisky: whiskyRecord,
        fileName: uniqueFileName
      }
    } catch (error: any) {
      console.error('Whisky image upload error:', error)
      const errorMessage = error.message || 'Resim yükleme başarısız oldu'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadWhiskyImage,
    isUploading
  }
}
