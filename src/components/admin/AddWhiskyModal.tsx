import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { X, Upload, Save } from 'lucide-react'
import { motion } from 'framer-motion'

interface AddWhiskyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddWhiskyModal({ isOpen, onClose, onSuccess }: AddWhiskyModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    type: 'Single Malt',
    country: '',
    region: '',
    alcohol_percentage: 40,
    color: '',
    aroma: '',
    taste: '',
    finish: '',
    description: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const whiskyTypes = [
    'Single Malt',
    'Blended',
    'Single Grain',
    'Blended Malt',
    'Bourbon',
    'Rye',
    'Irish',
    'Japanese',
    'Canadian',
    'Other'
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log('🚀 Image upload başlatıldı:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })

      // Check file size (5MB limit)
      if (file.size > 5242880) {
        console.error('❌ Dosya boyutu çok büyük:', file.size)
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır.')
        return null
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        console.error('❌ Geçersiz dosya tipi:', file.type)
        alert('Lütfen geçerli bir resim dosyası seçin.')
        return null
      }

      console.log('📁 Edge Function ile upload yapılacak')

      // Convert file to base64
      const fileReader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string)
        fileReader.onerror = reject
        fileReader.readAsDataURL(file)
      })

      const base64Data = await base64Promise
      console.log('✅ Dosya base64\'e çevrildi')

      // Get current user session for auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Yükleme için giriş yapmalısınız.')
        return null
      }

      // Call edge function for upload
      const { data: uploadResult, error: uploadError } = await supabase.functions.invoke('whisky-image-upload', {
        body: {
          imageData: base64Data,
          fileName: file.name
        }
      })

      if (uploadError || !uploadResult?.data?.publicUrl) {
        console.error('❌ Edge function upload hatası:', uploadError)
        
        let errorMessage = 'Resim yükleme hatası: '
        if (uploadError?.message?.includes('not allowed')) {
          errorMessage += 'Bu dosya türü desteklenmiyor.'
        } else if (uploadError?.message?.includes('size')) {
          errorMessage += 'Dosya boyutu çok büyük (maksimum 5MB).'
        } else if (uploadError?.message?.includes('auth')) {
          errorMessage += 'Yükleme yetkiniz yok. Tekrar giriş yapın.'
        } else {
          errorMessage += uploadError?.message || 'Bilinmeyen hata'
        }
        
        alert(errorMessage)
        return null
      }

      console.log('✅ Upload başarılı:', uploadResult.data.publicUrl)
      return uploadResult.data.publicUrl
      
    } catch (error: any) {
      console.error('❌ Upload fonksiyonunda genel hata:', error)
      
      let userMessage = 'Beklenmeyen hata: '
      if (error.message?.includes('timeout')) {
        userMessage += 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.'
      } else if (error.message?.includes('network')) {
        userMessage += 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.'
      } else {
        userMessage += error.message || 'Bilinmeyen hata'
      }
      
      alert(userMessage)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🗄 Form gönderilmeye başlandı:', { formData, hasImage: !!imageFile })

      let imageUrl = null
      
      // Upload image if provided
      if (imageFile) {
        console.log('🖼 Resim yükleniyor...')
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) {
          console.error('❌ Resim yükleme başarısız')
          alert('Resim yükleme başarısız oldu. Lütfen tekrar deneyin.')
          setLoading(false)
          return
        }
        console.log('✅ Resim başarıyla yüklendi:', imageUrl)
      } else {
        console.log('ℹ Resim seçilmedi, resim olmadan devam ediliyor')
      }

      // Prepare whisky data
      const whiskyData = {
        ...formData,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('📁 Veritabanına kaydedilecek veri:', whiskyData)

      // Insert whisky data
      const { data: insertedData, error } = await supabase
        .from('whiskies')
        .insert(whiskyData)
        .select()

      if (error) {
        console.error('❌ Veritabanı kaydetme hatası:', error)
        let errorMessage = 'Viski eklenirken hata oluştu: '
        
        if (error.code === '23505') {
          errorMessage += 'Bu viski adı zaten mevcut.'
        } else if (error.code === '23502') {
          errorMessage += 'Zorunlu alanlar eksik.'
        } else {
          errorMessage += error.message
        }
        
        alert(errorMessage)
        setLoading(false)
        return
      }

      console.log('✅ Viski başarıyla kaydedildi:', insertedData)
      alert('Viski başarıyla eklendi!')
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        type: 'Single Malt',
        country: '',
        region: '',
        alcohol_percentage: 40,
        color: '',
        aroma: '',
        taste: '',
        finish: '',
        description: ''
      })
      setImageFile(null)
      
    } catch (error: any) {
      console.error('❌ HandleSubmit genel hata:', error)
      alert(`Beklenmeyen hata oluştu: ${error.message || 'Bilinmeyen hata'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gradient">Yeni Viski Ekle</h2>
          <button
            onClick={onClose}
            className="btn-glass p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="form-section">
              <h3 className="form-label text-xl mb-4">{t('admin.basicInfo')}</h3>
              
              <div className="form-group">
                <label className="form-label">
                  {t('admin.whiskyName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="örn. Macallan 18"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  [{t('admin.whiskyType')}] *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="select-field"
                >
                  {whiskyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  [{t('admin.whiskyCountry')}] *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="input-field"
                  placeholder="örn. İskoçya"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  [{t('admin.whiskyRegion')}] *
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="input-field"
                  placeholder="örn. Speyside"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  [{t('admin.whiskyABV')}] (%) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.alcohol_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, alcohol_percentage: parseFloat(e.target.value) }))}
                  className="input-field"
                />
              </div>
            </div>

            {/* Tasting Notes */}
            <div className="form-section">
              <h3 className="form-label text-xl mb-4">Tadım Notları</h3>
              
              <div className="form-group">
                <label className="form-label">
                 [{t('admin.whiskyColor')}]
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="input-field"
                  placeholder="örn. Altın sarısı"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  [{t('admin.whiskyAroma')}]
                </label>
                <textarea
                  value={formData.aroma}
                  onChange={(e) => setFormData(prev => ({ ...prev, aroma: e.target.value }))}
                  className="input-field min-h-[90px]"
                  placeholder="Vanilya, karamel, meşe..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  [{t('admin.whiskyTaste')}]
                </label>
                <textarea
                  value={formData.taste}
                  onChange={(e) => setFormData(prev => ({ ...prev, taste: e.target.value }))}
                  className="input-field min-h-[90px]"
                  placeholder="Tatlı, bahıratlı, meyveli..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  [{t('admin.whiskyFinish')}]
                </label>
                <textarea
                  value={formData.finish}
                  onChange={(e) => setFormData(prev => ({ ...prev, finish: e.target.value }))}
                  className="input-field min-h-[90px]"
                  placeholder="Uzun, sıcak, bahıratlı..."
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              [{t('admin.whiskyDescription')}]
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field min-h-[120px]"
              placeholder="Viski hakkında genel bilgiler, üretim süreci, tarihçe..."
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">
             [{t('admin.whiskyImage')}]
            </label>
            <div className="border-2 border-dashed border-whiskey-amber/30 dark:border-whiskey-bronze/40 rounded-2xl p-8 bg-whiskey-amber/5 dark:bg-whiskey-bronze/5">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <Upload className="w-10 h-10 text-whiskey-bronze dark:text-whiskey-amber" />
                <span className="text-whiskey-bronze-dark dark:text-whiskey-amber-light font-medium">
                  {imageFile ? imageFile.name : 'Resim seçin veya sürükleyin'}
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass px-6 py-3 rounded-xl"
              disabled={loading}
            >
              [{t('admin.whiskyClose')}]
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  [{t('admin.whiskyAdding')}]
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  [{t('admin.whiskyAdd')}]
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}