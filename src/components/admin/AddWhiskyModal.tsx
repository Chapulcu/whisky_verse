import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Upload, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDirectWhiskyUpload } from '@/hooks/useDirectWhiskyUpload'
import toast from 'react-hot-toast'

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
    description: '',
    is_published: true
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { createWhiskyWithImage, isUploading } = useDirectWhiskyUpload()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const whiskyData = {
        name: formData.name.trim(),
        type: formData.type.trim(),
        country: formData.country.trim(),
        region: formData.region.trim() || undefined,
        alcohol_percentage: Number(formData.alcohol_percentage) || 40,
        color: formData.color.trim() || undefined,
        aroma: formData.aroma.trim() || undefined,
        taste: formData.taste.trim() || undefined,
        finish: formData.finish.trim() || undefined,
        description: formData.description.trim() || undefined,
        is_published: formData.is_published
      }

      const result = await createWhiskyWithImage(whiskyData, imageFile || undefined)

      if (result?.whisky) {
        toast.success(t('adminPage.toasts.whiskyAdded') || 'Viski başarıyla eklendi!')
      }

      onSuccess()
      onClose()

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
        description: '',
        is_published: true
      })
      setImageFile(null)

    } catch (error: any) {
      console.error('❌ HandleSubmit genel hata:', error)
      toast.error(error.message || t('adminPage.toasts.whiskyAddFailed'))
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
            {imageFile && (
              <p className="text-sm text-gray-500 mt-2">
                {(imageFile.size / 1024 / 1024).toFixed(2)} MB · {imageFile.type}
              </p>
            )}
          </div>

          {/* Publication Status */}
          <div className="form-group">
            <label className="form-label flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                className="w-5 h-5 text-whiskey-amber focus:ring-whiskey-amber border-whiskey-bronze/30 rounded"
              />
              <span>
                Yayında <span className="text-sm text-gray-500">(Kullanıcılara görünür olsun)</span>
              </span>
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {formData.is_published
                ? "✅ Bu viski kullanıcılara görünür olacak"
                : "⚠️ Bu viski taslak olarak kaydedilecek (sadece adminler görebilir)"
              }
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass px-6 py-3 rounded-xl"
              disabled={loading || isUploading}
            >
              [{t('admin.whiskyClose')}]
            </button>
            <button
              type="submit"
              disabled={loading || isUploading}
              className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
            >
              {loading || isUploading ? (
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
