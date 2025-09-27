import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface TranslationJob {
  id: number
  whisky_id: number
  target_language: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  source_text: any
  translated_text?: any
  provider?: string
  error_message?: string
  translation_quality?: number
  created_at: string
  updated_at: string
}

export interface TranslationStatus {
  whisky_id: number
  jobs: TranslationJob[]
  translations: Array<{
    language_code: string
    name: string
    is_complete: boolean
    translated_by: string
    translation_quality: number
  }>
}

export function useAutoTranslation() {
  const [loading, setLoading] = useState(false)
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null)

  // Otomatik çeviri tetikle
  const triggerTranslation = useCallback(async (
    whiskyId: number, 
    targetLanguages: string[] = ['en', 'ru', 'bg'],
    priority: number = 5
  ) => {
    setLoading(true)
    try {
      console.log(`🔄 Triggering auto-translation for whisky ${whiskyId} to languages: ${targetLanguages.join(', ')}`)
      
      const { data, error } = await supabase.functions.invoke('trigger-translation', {
        body: {
          whisky_id: whiskyId,
          target_languages: targetLanguages,
          priority
        }
      })

      if (error) {
        throw error
      }

      console.log('✅ Translation triggered:', data)
      
      // Başarılı çeviri işleri için bildirim
      const successfulJobs = data.results?.filter((r: any) => r.status === 'triggered') || []
      const existingJobs = data.results?.filter((r: any) => r.status === 'exists') || []
      
      if (successfulJobs.length > 0) {
        toast.success(
          `${successfulJobs.length} dil için çeviri başlatıldı! ${successfulJobs.map((j: any) => j.language).join(', ')}`,
          { duration: 4000 }
        )
      }
      
      if (existingJobs.length > 0) {
        toast.success(
          `${existingJobs.length} dil zaten çevrilmiş: ${existingJobs.map((j: any) => j.language).join(', ')}`
        )
      }

      return data
    } catch (error: any) {
      console.error('❌ Translation trigger error:', error)
      toast.error(`Çeviri başlatılamadı: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Çeviri durumunu kontrol et
  const checkTranslationStatus = useCallback(async (whiskyId: number) => {
    try {
      console.log(`📊 Checking translation status for whisky ${whiskyId}`)
      
      const { data, error } = await supabase.functions.invoke('trigger-translation', {
        method: 'GET',
        body: { whisky_id: whiskyId }
      })

      if (error) {
        throw error
      }

      setTranslationStatus(data)
      return data
    } catch (error: any) {
      console.error('❌ Status check error:', error)
      toast.error(`Çeviri durumu kontrol edilemedi: ${error.message}`)
      throw error
    }
  }, [])

  // Pending işleri kontrol et ve tekrar tetikle
  const retryFailedTranslations = useCallback(async (whiskyId: number) => {
    setLoading(true)
    try {
      // Başarısız işleri bul
      const { data: failedJobs, error } = await supabase
        .from('translation_jobs')
        .select('*')
        .eq('whisky_id', whiskyId)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      if (failedJobs.length === 0) {
        toast.success('Tekrar denenecek başarısız çeviri yok')
        return
      }

      // Başarısız işleri tekrar tetikle
      const languages = failedJobs.map(job => job.target_language)
      await triggerTranslation(whiskyId, languages)

    } catch (error: any) {
      console.error('❌ Retry failed translations error:', error)
      toast.error(`Yeniden deneme başarısız: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [triggerTranslation])

  // Tüm çevirileri getir (cache'den)
  const getTranslations = useCallback(async (whiskyId: number, languageCode?: string) => {
    try {
      let query = supabase
        .from('whisky_translations')
        .select(`
          language_code,
          name,
          type,
          description,
          aroma,
          taste,
          finish,
          color,
          is_complete,
          translated_by,
          translation_quality,
          created_at,
          updated_at
        `)
        .eq('whisky_id', whiskyId)

      if (languageCode) {
        query = query.eq('language_code', languageCode)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data
    } catch (error: any) {
      console.error('❌ Get translations error:', error)
      throw error
    }
  }, [])

  // Çeviri kalitesini değerlendir
  const evaluateTranslationQuality = useCallback((translation: any): {
    score: number
    issues: string[]
    recommendations: string[]
  } => {
    const issues: string[] = []
    const recommendations: string[] = []
    let score = 1.0

    // Alan tamamlılığını kontrol et
    const requiredFields = ['name', 'type']
    const optionalFields = ['description', 'aroma', 'taste', 'finish', 'color']
    
    const missingRequired = requiredFields.filter(field => !translation[field])
    const missingOptional = optionalFields.filter(field => !translation[field])
    
    if (missingRequired.length > 0) {
      issues.push(`Eksik zorunlu alanlar: ${missingRequired.join(', ')}`)
      score -= 0.3
    }
    
    if (missingOptional.length > 3) {
      issues.push(`Çok fazla boş alan: ${missingOptional.length}/5`)
      score -= 0.2
    }

    // İsim uzunluğu kontrolü
    if (translation.name && translation.name.length < 3) {
      issues.push('İsim çok kısa')
      score -= 0.1
    }

    // Açıklama kalitesi
    if (translation.description && translation.description.length < 20) {
      issues.push('Açıklama çok kısa veya yetersiz')
      score -= 0.1
    }

    // Öneriler
    if (missingOptional.length > 0) {
      recommendations.push('Eksik alanları tamamlayın: ' + missingOptional.join(', '))
    }
    
    if (score < 0.8) {
      recommendations.push('Çeviri kalitesini artırmak için manuel düzenleme önerilir')
    }

    return {
      score: Math.max(0, Math.round(score * 100) / 100),
      issues,
      recommendations
    }
  }, [])

  return {
    loading,
    translationStatus,
    triggerTranslation,
    checkTranslationStatus,
    retryFailedTranslations,
    getTranslations,
    evaluateTranslationQuality
  }
}
