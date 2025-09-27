import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Image, Upload, Sparkles, Eye, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useWhiskyPhotoUpload } from '@/hooks/useWhiskyPhotoUpload'
import { CameraCapture } from '@/components/mobile/CameraCapture'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function CameraPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  // Achievement system will automatically track photo uploads via database triggers
  const { uploadWhiskyPhoto, isUploading: photoUploading } = useWhiskyPhotoUpload()
  const [showCamera, setShowCamera] = useState(false)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleCameraCapture = (file: File) => {
    setCapturedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setShowCamera(false)

    toast.success('Fotoğraf başarıyla çekildi!')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setCapturedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      toast.success('Fotoğraf seçildi!')
    }
  }

  const handleUpload = async () => {
    if (!capturedFile) return

    setIsUploading(true)
    try {
      // Real whisky photo upload
      await uploadWhiskyPhoto(capturedFile, {
        description: description.trim() || undefined
      })

      // Achievement is automatically triggered by database trigger when photo is uploaded
      // No need to manually call takePhoto() here

      // Clear the captured image
      setCapturedFile(null)
      setDescription('')
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Yükleme başarısız oldu')
    } finally {
      setIsUploading(false)
    }
  }

  const clearCapture = () => {
    setCapturedFile(null)
    setDescription('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Viski Kamerası
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Viski fotoğraflarını çek ve koleksiyonuna ekle
            </p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 pb-20">
        {!previewUrl ? (
          /* Camera Options */
          <div className="space-y-6 py-8">
            {/* Camera Capture */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 text-center"
            >
              <div className="mb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fotoğraf Çek</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Kamera ile yeni bir viski fotoğrafı çek
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCamera(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Kamerayı Aç
              </motion.button>
            </motion.div>

            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="mb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
                  <Image className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Galeriden Seç</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Mevcut fotoğraflarından birini seç
                </p>
              </div>

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer inline-block"
                >
                  Fotoğraf Seç
                </motion.div>
              </label>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold mb-4 text-center">Özellikler</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI Tanıma</p>
                </div>
                <div className="text-center">
                  <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Otomatik Analiz</p>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Akıllı Etiketleme</p>
                </div>
                <div className="text-center">
                  <Upload className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hızlı Yükleme</p>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Photo Preview */
          <div className="py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card overflow-hidden"
            >
              {/* Image Preview */}
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Captured whisky"
                  className="w-full h-full object-cover"
                />

                {/* Overlay Info */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-white text-sm font-medium">
                      📸 Fotoğraf hazır!
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Fotoğraf Önizleme</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Fotoğrafın nasıl göründiğını kontrol et
                  </p>
                </div>

                {/* Description Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Açıklama (isteğe bağlı)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Bu fotoğraf hakkında kısa bir açıklama yazın..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={200}
                    disabled={isUploading}
                  />
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {description.length}/200
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={clearCapture}
                    disabled={isUploading}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Yeniden Çek
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Yükle
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
        title="Viski Fotoğrafı"
        subtitle="Viski şişesini merkeze al"
      />
    </div>
  )
}