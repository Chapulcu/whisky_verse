import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Image, 
  Upload, 
  Trash2, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  Save,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useBackgroundManagement } from '@/hooks/useBackgroundManagement'
import { useTranslation } from 'react-i18next'

export function BackgroundManager() {
  const { t } = useTranslation()
  const {
    settings,
    loading,
    uploading,
    uploadBackgroundImage,
    removeBackgroundImage,
    getCurrentBackgroundUrl
  } = useBackgroundManagement()

  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')
  const lightFileInputRef = useRef<HTMLInputElement>(null)
  const darkFileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, theme: 'light' | 'dark') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyası seçin')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır')
      return
    }

    await uploadBackgroundImage(file, theme)
    
    // Clear input
    event.target.value = ''
  }

  const lightBackgroundUrl = getCurrentBackgroundUrl(false)
  const darkBackgroundUrl = getCurrentBackgroundUrl(true)

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
        <p className="text-slate-600 dark:text-slate-400">Arka plan ayarları yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Arka Plan Yönetimi
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Site arka planını özelleştirin - tema bazlı ayarlar
            </p>
          </div>
        </div>

        {/* Preview Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Önizleme:</span>
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => setPreviewMode('light')}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                previewMode === 'light'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              <Sun className="w-4 h-4" />
              Açık Tema
            </button>
            <button
              onClick={() => setPreviewMode('dark')}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                previewMode === 'dark'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              <Moon className="w-4 h-4" />
              Koyu Tema
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Light Theme Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-amber-500" />
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Açık Tema Arka Planı</h4>
          </div>

          {/* Preview */}
          <div className="relative mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 h-32">
            {lightBackgroundUrl ? (
              <>
                <img
                  src={lightBackgroundUrl}
                  alt="Light background preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                    <Eye className="w-3 h-3 text-slate-600" />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Varsayılan grid arka plan</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <input
              ref={lightFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'light')}
              className="hidden"
            />
            <button
              onClick={() => lightFileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Yükle
            </button>
            {lightBackgroundUrl && (
              <button
                onClick={() => removeBackgroundImage('light')}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Kaldır
              </button>
            )}
          </div>

          {/* Status */}
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {lightBackgroundUrl ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Özel arka plan aktif</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-slate-500" />
                <span className="text-slate-500">Varsayılan arka plan kullanılıyor</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Dark Theme Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-slate-400" />
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Koyu Tema Arka Planı</h4>
          </div>

          {/* Preview */}
          <div className="relative mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 h-32">
            {darkBackgroundUrl ? (
              <>
                <img
                  src={darkBackgroundUrl}
                  alt="Dark background preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                    <Eye className="w-3 h-3 text-white" />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Varsayılan grid arka plan</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <input
              ref={darkFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'dark')}
              className="hidden"
            />
            <button
              onClick={() => darkFileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Yükle
            </button>
            {darkBackgroundUrl && (
              <button
                onClick={() => removeBackgroundImage('dark')}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Kaldır
              </button>
            )}
          </div>

          {/* Status */}
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {darkBackgroundUrl ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Özel arka plan aktif</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-slate-500" />
                <span className="text-slate-500">Varsayılan arka plan kullanılıyor</span>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Usage Guidelines */}
      <div className="card p-6 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <h4 className="font-semibold mb-2">Kullanım Önerileri:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Dosya boyutu maksimum 5MB olmalıdır</li>
              <li>En iyi sonuçlar için 1920x1080 veya daha yüksek çözünürlük kullanın</li>
              <li>Arka plan resimleri site performansını etkileyebilir</li>
              <li>Açık ve koyu tema için farklı resimler yükleyebilirsiniz</li>
              <li>Resim kaldırıldığında varsayılan grid arka plan gösterilir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}