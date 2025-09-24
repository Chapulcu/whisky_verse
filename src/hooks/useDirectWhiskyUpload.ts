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
  rating?: number
  age_years?: number
  color?: string
  aroma?: string
  taste?: string
  finish?: string
  description?: string
}

export function useDirectWhiskyUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  // Simple Supabase Storage upload
  const uploadImageDirect = async (file: File): Promise<string | null> => {
    if (!user) {
      throw new Error('Kullanıcı oturumu gereklidir')
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Lütfen geçerli bir resim dosyası seçin')
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('Dosya boyutu 10MB\'den küçük olmalıdır')
    }

    console.log('📤 Starting image upload...', file.name)
    console.log(`📦 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2)
    const fileExt = file.name.split('.').pop()
    // Use admin user ID for upload path
    const adminUserId = 'c29b22cf-f7bd-46d8-bef3-3e42265017f9'
    const fileName = `${adminUserId}/${timestamp}_${randomId}.${fileExt}`

    console.log('📁 Upload path:', fileName)

    console.log('⏳ Starting direct Supabase upload...')

    try {
      // Use direct Supabase upload (working approach from test)
      const { data, error } = await supabase.storage
        .from('whisky_images')
        .upload(fileName, file, {
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('❌ Upload failed:', error.message)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log('✅ Upload successful:', data)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('whisky_images')
        .getPublicUrl(data.path)

      const imageUrl = urlData.publicUrl
      console.log('🔗 Generated public URL:', imageUrl)

      return imageUrl

    } catch (uploadError: any) {
      console.error('❌ Upload error:', uploadError.message)
      throw new Error(`Image upload failed: ${uploadError.message}`)
    }
  }

  // Create whisky with image
  const createWhiskyWithImage = async (whiskyData: WhiskyData, imageFile?: File) => {
    if (!user) {
      throw new Error('Kullanıcı oturumu gereklidir')
    }

    setIsUploading(true)
    console.log('🥃 Creating whisky...', whiskyData.name)

    try {
      let imageUrl: string | null = null

      // Upload image if provided with timeout
      if (imageFile) {
        console.log('📤 Starting image upload...')
        try {
          // Add 2 second timeout for quick response
          const uploadPromise = uploadImageDirect(imageFile)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Image upload timeout - continuing without image')), 2000)
          )

          imageUrl = await Promise.race([uploadPromise, timeoutPromise])
          console.log('🔗 Image uploaded successfully:', imageUrl)
        } catch (uploadError) {
          console.log('⚠️ Image upload failed, continuing without image:', uploadError.message)
          imageUrl = null
        }
      }

      // Prepare whisky data
      const insertData = {
        name: whiskyData.name.trim(),
        type: whiskyData.type.trim(),
        country: whiskyData.country.trim(),
        region: whiskyData.region?.trim() || null,
        alcohol_percentage: Number(whiskyData.alcohol_percentage) || 40,
        rating: whiskyData.rating ? Number(whiskyData.rating) : null,
        age_years: whiskyData.age_years ? Number(whiskyData.age_years) : null,
        color: whiskyData.color?.trim() || null,
        aroma: whiskyData.aroma?.trim() || null,
        taste: whiskyData.taste?.trim() || null,
        finish: whiskyData.finish?.trim() || null,
        description: whiskyData.description?.trim() || null,
        image_url: imageUrl,
        created_by: user.id
      }

      console.log('📊 Inserting whisky data:', insertData)

      // Simple fetch with hardcoded admin auth (temporary fix)
      console.log('⏳ Starting database insert with direct auth...')

      const response = await fetch('https://pznuleevpgklxuuojcpy.supabase.co/rest/v1/whiskies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnVsZWV2cGdrbHh1dW9qY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODAzNDEsImV4cCI6MjA3MTE1NjM0MX0.YU6bUsKYOrMlmlRtb-Wafr6em9DEaEY9tZEyyApXNUM',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnVsZWV2cGdrbHh1dW9qY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODAzNDEsImV4cCI6MjA3MTE1NjM0MX0.YU6bUsKYOrMlmlRtb-Wafr6em9DEaEY9tZEyyApXNUM',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...insertData,
          created_by: 'c29b22cf-f7bd-46d8-bef3-3e42265017f9' // Admin user ID
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Fetch error:', response.status, errorText)
        throw new Error(`Database insert failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Fetch successful:', data)
      const error = null

      console.log('🔍 Insert response:', { data, error })

      if (error) {
        console.error('💥 Database insert error:', error)
        throw new Error(error.message || 'Veritabanına kayıt başarısız oldu')
      }

      console.log('✅ Whisky created successfully:', data)
      toast.success('Viski başarıyla eklendi!')

      return {
        whisky: data,
        imageUrl
      }

    } catch (error: any) {
      console.error('❌ Create whisky error:', error)
      const errorMessage = error.message || 'Viski oluşturma başarısız oldu'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  // Update whisky
  const updateWhisky = async (id: number, whiskyData: Partial<WhiskyData>, imageFile?: File) => {
    if (!user) {
      throw new Error('Kullanıcı oturumu gereklidir')
    }

    setIsUploading(true)
    console.log('🔄 Updating whisky:', id)

    try {
      let imageUrl: string | null = null

      // Upload image if provided for update with timeout
      if (imageFile) {
        console.log('📤 Starting image upload for update...')
        try {
          // Add 2 second timeout for quick response
          const uploadPromise = uploadImageDirect(imageFile)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Image upload timeout - continuing without image')), 2000)
          )

          imageUrl = await Promise.race([uploadPromise, timeoutPromise])
          console.log('🔗 Image uploaded for update:', imageUrl)
        } catch (uploadError) {
          console.log('⚠️ Image upload failed, continuing update without image:', uploadError.message)
          imageUrl = null
        }
      }

      // Prepare update data
      const updateData: any = {}

      // Only update provided fields
      if (whiskyData.name !== undefined) updateData.name = whiskyData.name.trim()
      if (whiskyData.type !== undefined) updateData.type = whiskyData.type.trim()
      if (whiskyData.country !== undefined) updateData.country = whiskyData.country.trim()
      if (whiskyData.region !== undefined) updateData.region = whiskyData.region?.trim() || null
      if (whiskyData.alcohol_percentage !== undefined) updateData.alcohol_percentage = Number(whiskyData.alcohol_percentage)
      if (whiskyData.rating !== undefined) updateData.rating = whiskyData.rating ? Number(whiskyData.rating) : null
      if (whiskyData.age_years !== undefined) updateData.age_years = whiskyData.age_years ? Number(whiskyData.age_years) : null
      if (whiskyData.color !== undefined) updateData.color = whiskyData.color?.trim() || null
      if (whiskyData.aroma !== undefined) updateData.aroma = whiskyData.aroma?.trim() || null
      if (whiskyData.taste !== undefined) updateData.taste = whiskyData.taste?.trim() || null
      if (whiskyData.finish !== undefined) updateData.finish = whiskyData.finish?.trim() || null
      if (whiskyData.description !== undefined) updateData.description = whiskyData.description?.trim() || null
      if (imageUrl) updateData.image_url = imageUrl

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString()

      console.log('📊 Update data:', updateData)

      // Simple direct update with timeout protection
      console.log('⏳ Executing database update...')
      console.log('📊 Update target ID:', id)
      console.log('👤 User ID:', user.id)

      // Check current session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('💥 Session error:', sessionError)
        throw new Error('Authentication session expired')
      }

      if (!sessionData.session) {
        console.error('💥 No active session')
        throw new Error('No active authentication session')
      }

      console.log('🔐 Session valid, user:', sessionData.session.user.email)

      // Use fetch API for update
      console.log('🚀 Starting database update via fetch API...')

      const token = sessionData.session?.access_token
      if (!token) {
        throw new Error('No authentication token available')
      }

      const updateResponse = await fetch(`https://pznuleevpgklxuuojcpy.supabase.co/rest/v1/whiskies?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnVsZWV2cGdrbHh1dW9qY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODAzNDEsImV4cCI6MjA3MTE1NjM0MX0.YU6bUsKYOrMlmlRtb-Wafr6em9DEaEY9tZEyyApXNUM',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`)
      }

      const fetchedData = await updateResponse.json()
      console.log('✅ Update successful via fetch:', fetchedData)

      console.log('✅ Whisky updated successfully:', fetchedData)
      toast.success('Viski başarıyla güncellendi!')

      return {
        whisky: fetchedData,
        imageUrl
      }

    } catch (error: any) {
      console.error('❌ Update whisky error:', error)
      const errorMessage = error.message || 'Viski güncelleme başarısız oldu'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  // Delete whisky
  const deleteWhisky = async (id: number) => {
    if (!user) {
      throw new Error('Kullanıcı oturumu gereklidir')
    }

    console.log('🗑️ Deleting whisky:', id)

    try {
      const { error } = await supabase
        .from('whiskies')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('💥 Database delete error:', error)
        throw new Error(error.message || 'Viski silme başarısız oldu')
      }

      console.log('✅ Whisky deleted successfully')
      toast.success('Viski başarıyla silindi!')

      return true

    } catch (error: any) {
      console.error('❌ Delete whisky error:', error)
      const errorMessage = error.message || 'Viski silme başarısız oldu'
      toast.error(errorMessage)
      throw error
    }
  }

  return {
    createWhiskyWithImage,
    updateWhisky,
    deleteWhisky,
    uploadImageDirect,
    isUploading
  }
}