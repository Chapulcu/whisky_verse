import React, { useRef, useState, useEffect } from 'react'
import { Camera, X, FlipHorizontal, Zap, ZapOff, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import toast from 'react-hot-toast'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  title?: string
  subtitle?: string
}

export function CameraCapture({ isOpen, onClose, onCapture, title = "Fotoğraf Çek", subtitle = "Viski fotoğrafını çek" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [hasFlash, setHasFlash] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const { hapticButton, hapticPhotoCapture, hapticSuccess } = useHapticFeedback()

  // Check if device has camera flash
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
      const supports = navigator.mediaDevices.getSupportedConstraints()
      setHasFlash(supports.torch === true)
    }
  }, [])

  const startCamera = async () => {
    try {
      setIsLoading(true)

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          aspectRatio: { ideal: 16/9 }
        }
      }

      // Add flash constraint if supported
      if (hasFlash && flashEnabled) {
        constraints.video = {
          ...constraints.video,
          // @ts-ignore - torch is not in standard types yet
          torch: true
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Camera access error:', error)
      toast.error('Kamera erişimi başarısız. Lütfen kamera iznini kontrol edin.')
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCapturedImage(null)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], `whisky-photo-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      })

      // Show preview
      const imageUrl = URL.createObjectURL(blob)
      setCapturedImage(imageUrl)

      // Provide file to parent
      onCapture(file)
    }, 'image/jpeg', 0.9)
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
  }

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const toggleFlash = () => {
    setFlashEnabled(prev => !prev)
  }

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode, flashEnabled])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm relative z-10">
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <h2 className="text-white font-semibold">{title}</h2>
            <p className="text-white/70 text-sm">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {hasFlash && (
              <button
                onClick={toggleFlash}
                className={`p-2 rounded-full transition-colors ${
                  flashEnabled ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/20'
                }`}
              >
                {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={switchCamera}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden">
          {!capturedImage ? (
            <>
              {/* Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white">Kamera yükleniyor...</p>
                  </div>
                </div>
              )}

              {/* Camera Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>

              {/* Capture Controls */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  disabled={isLoading || !stream}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 relative"
                >
                  <div className="w-16 h-16 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-600" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 border-4 border-white rounded-full"
                  />
                </motion.button>
              </div>
            </>
          ) : (
            <>
              {/* Captured Image Preview */}
              <img
                src={capturedImage}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Preview Controls */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={retakePhoto}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-full font-medium"
                >
                  <RotateCcw className="w-5 h-5" />
                  Tekrar Çek
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-medium"
                >
                  <Camera className="w-5 h-5" />
                  Kullan
                </motion.button>
              </div>
            </>
          )}
        </div>

        {/* Hidden Canvas for Capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </motion.div>
    </AnimatePresence>
  )
}