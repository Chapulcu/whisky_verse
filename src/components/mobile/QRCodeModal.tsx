import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Download, Share2, X, Camera, Upload, Zap, ZapOff } from 'lucide-react'
import { useQRCode } from '@/hooks/useQRCode'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { ShareButton } from './ShareButton'
import toast from 'react-hot-toast'

export type QRCodeType = 'profile' | 'whisky' | 'collection' | 'custom'

export interface QRCodeData {
  type: QRCodeType
  title: string
  subtitle?: string
  data: any
}

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  qrData: QRCodeData
  mode?: 'generate' | 'scan'
}

export function QRCodeModal({ isOpen, onClose, qrData, mode = 'generate' }: QRCodeModalProps) {
  const { t } = useTranslation()
  const {
    generateQRCode,
    generateProfileQR,
    generateWhiskyQR,
    generateCollectionQR,
    scanQRCode,
    scanQRCodeFromFile,
    parseQRData,
    downloadQRCode,
    checkCameraPermissions,
    isGenerating,
    isScanning,
    hasCamera
  } = useQRCode()

  const { hapticSuccess, hapticButton } = useHapticFeedback()
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [currentMode, setCurrentMode] = useState<'generate' | 'scan'>(mode)
  const [scannedData, setScannedData] = useState<any>(null)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate QR code when modal opens or data changes
  useEffect(() => {
    if (isOpen && currentMode === 'generate') {
      generateQRForData()
    }
  }, [isOpen, qrData, currentMode])

  // Camera management for scan mode
  useEffect(() => {
    if (isOpen && currentMode === 'scan') {
      startCamera()
    } else {
      stopCamera()
    }

    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [isOpen, currentMode])

  const startCamera = async () => {
    try {
      setCameraError(null)
      setDebugInfo(null)

      // Check camera permissions first
      const cameraStatus = await checkCameraPermissions()
      setDebugInfo(cameraStatus.deviceInfo)

      console.log('Camera status check result:', cameraStatus)

      if (!cameraStatus.hasCamera || !cameraStatus.hasPermission) {
        setCameraError(cameraStatus.error || t('qr.cameraNotFound'))
        return
      }

      // Get user media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera preferred
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      setCameraStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (error: any) {
      console.error('Camera start failed:', error)

      let errorMessage = t('qr.cameraAccessError')
      if (error.name === 'NotAllowedError') {
        errorMessage = t('qr.cameraPermissionDenied')
      } else if (error.name === 'NotFoundError') {
        errorMessage = t('qr.cameraNotFound')
      }

      setCameraError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const generateQRForData = async () => {
    try {
      let qrImage = ''

      switch (qrData.type) {
        case 'profile':
          qrImage = await generateProfileQR(qrData.data.userId, qrData.data.username)
          break
        case 'whisky':
          qrImage = await generateWhiskyQR(qrData.data.whiskyId, qrData.data.whiskyName)
          break
        case 'collection':
          qrImage = await generateCollectionQR(qrData.data.userId, qrData.data.collectionName)
          break
        case 'custom':
          qrImage = await generateQRCode(qrData.data.text || qrData.data.url)
          break
        default:
          throw new Error('Bilinmeyen QR kod türü')
      }

      setQrCodeImage(qrImage)
    } catch (error) {
      console.error('QR code generation failed:', error)
      toast.error(t('qr.generationFailed'))
    }
  }

  const handleDownload = async () => {
    if (!qrCodeImage) return

    hapticButton()

    try {
      const filename = `${qrData.type}-${Date.now()}.png`
      await downloadQRCode(qrCodeImage, filename)
      toast.success(t('qr.downloadQR') + ' ' + t('actions.completed'))
    } catch (error) {
      toast.error(t('qr.scanningFailed'))
    }
  }

  const handleScanFromCamera = async () => {
    if (!cameraStream || !videoRef.current) {
      toast.error(t('qr.cameraNotFound'))
      return
    }

    hapticButton()

    try {
      const result = await scanQRCode(videoRef.current)
      const parsedData = parseQRData(result)

      hapticSuccess()
      setScannedData(parsedData)
      toast.success(t('qr.scanQR') + ' ' + t('actions.completed'))
    } catch (error: any) {
      console.error('QR scan failed:', error)
      toast.error(error.message || t('qr.scanningFailed'))
    }
  }

  const handleScanFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await scanQRCodeFromFile(file)
      const parsedData = parseQRData(result)

      hapticSuccess()
      setScannedData(parsedData)
      toast.success(t('qr.scanFromFile') + ' ' + t('actions.completed'))
    } catch (error: any) {
      console.error('QR scan from file failed:', error)
      toast.error(error.message || t('qr.scanningFailed'))
    }

    // Clear file input
    event.target.value = ''
  }

  const handleScannedDataAction = () => {
    if (!scannedData) return

    if (scannedData.type === 'url' || scannedData.data.url) {
      const url = scannedData.data.url || scannedData.data.text
      window.open(url, '_blank')
    } else if (scannedData.type === 'text') {
      // Copy to clipboard
      navigator.clipboard.writeText(scannedData.data.text)
      toast.success('Metin panoya kopyalandı!')
    }

    onClose()
  }

  const getQRShareData = () => {
    return {
      title: `${qrData.title} - WhiskyVerse`,
      text: qrData.subtitle || `${qrData.title} QR kodunu tarayarak erişebilirsiniz.`,
      url: window.location.href,
      files: qrCodeImage ? [new File([qrCodeImage], 'qr-code.png')] : undefined
    }
  }

  const getTypeIcon = () => {
    switch (qrData.type) {
      case 'profile':
        return '👤'
      case 'whisky':
        return '🥃'
      case 'collection':
        return '📚'
      default:
        return '📱'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                  {currentMode === 'generate' ? getTypeIcon() : '📷'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentMode === 'generate' ? 'QR Kod Oluştur' : 'QR Kod Tara'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentMode === 'generate' ? qrData.title : 'QR kodu tarayarak bilgilere erişin'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentMode('generate')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      currentMode === 'generate'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    Oluştur
                  </button>
                  <button
                    onClick={() => setCurrentMode('scan')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      currentMode === 'scan'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Tara
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {currentMode === 'generate' ? (
              /* Generate Mode */
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="text-center">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">QR kod oluşturuluyor...</p>
                      </div>
                    </div>
                  ) : qrCodeImage ? (
                    <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                      <img
                        src={qrCodeImage}
                        alt="QR Code"
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-gray-600 dark:text-gray-400">QR kod yüklenemedi</p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {qrData.title}
                  </h3>
                  {qrData.subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {qrData.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Bu QR kodu tarayarak paylaşılan içeriğe erişebilirsiniz
                  </p>
                </div>

                {/* Action Buttons */}
                {qrCodeImage && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                    >
                      <Download className="w-4 h-4" />
                      İndir
                    </button>

                    <ShareButton
                      data={getQRShareData()}
                      variant="pill"
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Scan Mode */
              <div className="space-y-6">
                {scannedData ? (
                  /* Scanned Result */
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                      <QrCode className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        QR Kod Tarandı!
                      </h3>

                      {scannedData.isWhiskyVerse ? (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <p className="text-blue-800 dark:text-blue-200 font-medium">
                            WhiskyVerse {scannedData.data.type} linki
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                            {scannedData.data.whiskyName || scannedData.data.username || scannedData.data.collectionName}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <p className="text-gray-800 dark:text-gray-200 break-all">
                            {scannedData.data.text || scannedData.data.url}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleScannedDataAction}
                      className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                    >
                      {scannedData.type === 'url' ? 'Linki Aç' : 'Metni Kopyala'}
                    </button>
                  </div>
                ) : (
                  /* Scanner Interface */
                  <div className="space-y-4">
                    {/* Camera Error Display */}
                    {cameraError ? (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                            <Camera className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-red-800 dark:text-red-200 font-medium text-sm">
                              {t('qr.cameraAccessError')}
                            </p>
                            <p className="text-red-600 dark:text-red-300 text-xs mt-1">
                              {cameraError}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={startCamera}
                          className="w-full mt-3 py-2 px-4 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm font-medium"
                        >
                          {t('qr.openCamera')}
                        </button>

                        {/* Debug Info */}
                        {debugInfo && (
                          <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            <details>
                              <summary className="cursor-pointer text-gray-600 dark:text-gray-400">Debug Bilgileri</summary>
                              <div className="mt-2 space-y-1 text-gray-500 dark:text-gray-500">
                                <div>iOS: {debugInfo.isIOS ? '✅' : '❌'}</div>
                                <div>Safari: {debugInfo.isSafari ? '✅' : '❌'}</div>
                                <div>HTTPS: {debugInfo.isSecureContext ? '✅' : '❌'}</div>
                                <div>MediaDevices: {debugInfo.hasMediaDevices ? '✅' : '❌'}</div>
                                <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Camera Preview */}
                        {cameraStream && (
                          <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                            <video
                              ref={videoRef}
                              className="w-full h-64 object-cover"
                              autoPlay
                              playsInline
                              muted
                            />

                        {/* Scanner Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
                          </div>
                        </div>

                        {/* Flash Toggle */}
                        <button
                          onClick={() => setFlashEnabled(!flashEnabled)}
                          className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white"
                        >
                          {flashEnabled ? (
                            <Zap className="w-5 h-5" />
                          ) : (
                            <ZapOff className="w-5 h-5" />
                          )}
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Scan Instructions */}
                    <div className="text-center space-y-2">
                      <p className="text-gray-600 dark:text-gray-400">
                        {cameraStream
                          ? 'QR kodu kamera görüntüsü içindeki kareye hizalayın'
                          : cameraError
                            ? 'Kamera erişimi olmadığında dosyadan QR kod tarayabilirsiniz'
                            : 'QR kod tarama seçenekleriniz'
                        }
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {cameraStream ? 'Otomatik olarak taranacaktır' : 'Galeri veya fotoğraflardan resim seçin'}
                      </p>
                    </div>

                    {/* Scan Buttons */}
                    <div className="space-y-3">
                      {/* Camera Scan Button - Only show if camera is available */}
                      {cameraStream && (
                        <button
                          onClick={handleScanFromCamera}
                          disabled={isScanning}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg font-medium"
                        >
                          <Camera className="w-4 h-4" />
                          {isScanning ? t('qr.scanQR') + '...' : t('qr.scanQR')}
                        </button>
                      )}

                      {/* File Scan Button - Always available as fallback */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium ${
                          cameraError
                            ? 'bg-blue-500 hover:bg-blue-600 text-white' // Primary when camera fails
                            : 'bg-gray-500 hover:bg-gray-600 text-white'  // Secondary when camera works
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        {cameraError ? 'QR Kodu Galeriden Tara' : t('qr.scanFromFile')}
                      </button>

                      {/* iOS Safari specific help */}
                      {debugInfo?.isIOS && debugInfo?.isSafari && cameraError && (
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            📱 iOS Safari'de kamera sorunu yaşıyorsanız:
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            • Ayarlar → Safari → Kamera: İzin ver<br />
                            • Sayfayı yenile ve tekrar dene<br />
                            • Alternatif: Galerideki QR foto tarayın
                          </p>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScanFromFile}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}