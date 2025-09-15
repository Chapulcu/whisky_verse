import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Video, 
  Upload, 
  Trash2, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react'

interface VideoBackgroundSectionProps {
  theme: 'light' | 'dark'
  videoUrl: string | null
  uploading: boolean
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>, theme: 'light' | 'dark') => void
  onRemoveVideo: (theme: 'light' | 'dark') => void
  delay: number
}

export function VideoBackgroundSection({ 
  theme, 
  videoUrl, 
  uploading, 
  onVideoUpload, 
  onRemoveVideo,
  delay 
}: VideoBackgroundSectionProps) {
  const videoInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  const handlePlayPreview = () => {
    if (videoPreviewRef.current) {
      if (videoPreviewRef.current.paused) {
        videoPreviewRef.current.play()
      } else {
        videoPreviewRef.current.pause()
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        {theme === 'light' ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-slate-400" />
        )}
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">
          {theme === 'light' ? 'Açık' : 'Koyu'} Tema Video Arka Planı
        </h4>
      </div>

      {/* Video Preview */}
      <div className={`relative mb-4 rounded-lg overflow-hidden h-32 ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-slate-50 to-slate-100' 
          : 'bg-gradient-to-br from-slate-800 to-slate-900'
      }`}>
        {videoUrl ? (
          <div className="relative w-full h-full">
            <video
              ref={videoPreviewRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            />
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
            
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPreview}
              className="absolute inset-0 flex items-center justify-center group"
            >
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-black/70 transition-colors">
                <Play className="w-6 h-6 text-white" />
              </div>
            </button>
            
            {/* Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-purple-500/80 rounded-full flex items-center justify-center">
                <Video className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className={`text-center ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Varsayılan grid arka plan</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => onVideoUpload(e, theme)}
          className="hidden"
        />
        <button
          onClick={() => videoInputRef.current?.click()}
          disabled={uploading}
          className={`flex-1 px-3 py-2 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            theme === 'light'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500'
              : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Yükleniyor...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Video Yükle
            </>
          )}
        </button>
        {videoUrl && (
          <button
            onClick={() => onRemoveVideo(theme)}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Kaldır
          </button>
        )}
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {videoUrl ? (
          <>
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-green-600 dark:text-green-400">Video arka plan aktif</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span className="text-slate-500">Varsayılan arka plan kullanılıyor</span>
          </>
        )}
      </div>
    </motion.div>
  )
}