import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Copy, Twitter, Facebook, Linkedin, MessageSquare, Check } from 'lucide-react'
import { useWebShare, ShareData } from '@/hooks/useWebShare'
import { useAchievements } from '@/hooks/useAchievements'
import toast from 'react-hot-toast'

interface ShareButtonProps {
  data: ShareData
  variant?: 'default' | 'icon' | 'pill'
  size?: 'sm' | 'md' | 'lg'
  showFallbackOptions?: boolean
  className?: string
}

export function ShareButton({
  data,
  variant = 'default',
  size = 'md',
  showFallbackOptions = true,
  className = ''
}: ShareButtonProps) {
  const { isSupported, share, fallbackShare } = useWebShare()
  const { makeShare } = useAchievements()
  const [isSharing, setIsSharing] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)

    try {
      if (isSupported) {
        const result = await share(data)
        if (result.success) {
          // Track achievement for successful share
          makeShare()
          toast.success('İçerik paylaşıldı!')
        } else if (result.error === 'Share cancelled by user') {
          // Don't show error for user cancellation
        } else {
          toast.error(result.error || 'Paylaşım başarısız')
          if (showFallbackOptions) {
            setShowFallback(true)
          }
        }
      } else {
        if (showFallbackOptions) {
          setShowFallback(true)
        } else {
          fallbackShare(data)
          // Track achievement for fallback share too
          makeShare()
          toast.success('Paylaşım bağlantısı açıldı!')
        }
      }
    } catch (error) {
      console.error('Share error:', error)
      if (showFallbackOptions) {
        setShowFallback(true)
      } else {
        toast.error('Paylaşım başarısız')
      }
    } finally {
      setIsSharing(false)
    }
  }

  const copyToClipboard = async () => {
    const shareText = `${data.title}\n${data.text || ''}\n${data.url || ''}`

    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Panoya kopyalandı!')
    } catch (error) {
      toast.error('Kopyalama başarısız')
    }
  }

  const shareToSocial = (platform: string) => {
    const shareText = `${data.title}\n${data.text || ''}`
    const url = data.url || window.location.href

    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      setShowFallback(false)
      // Track achievement for social media sharing
      makeShare()
      toast.success(`${platform} ile paylaşım açıldı!`)
    }
  }

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50'

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    }

    const variantClasses = {
      default: 'bg-blue-500 hover:bg-blue-600 text-white rounded-lg',
      icon: 'w-10 h-10 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full',
      pill: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full'
    }

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  }

  const getIcon = () => {
    if (isSharing) {
      return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    }
    return <Share2 className="w-4 h-4" />
  }

  const getLabel = () => {
    if (variant === 'icon') return null
    if (isSharing) return 'Paylaşılıyor...'
    return 'Paylaş'
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={getButtonClasses()}
        title="Paylaş"
      >
        {getIcon()}
        {getLabel() && (
          <span className={variant === 'icon' ? 'sr-only' : 'ml-2'}>
            {getLabel()}
          </span>
        )}
      </button>

      {/* Fallback Options Modal */}
      <AnimatePresence>
        {showFallback && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: '100%', scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: '100%', scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl w-full md:w-96 max-w-sm mx-4 mb-0 md:mb-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Paylaş
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Paylaşmak istediğiniz platformu seçin
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Copy to Clipboard */}
                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">
                      {copied ? 'Kopyalandı!' : 'Panoya Kopyala'}
                    </span>
                  </button>

                  {/* Social Media Options */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => shareToSocial('twitter')}
                      className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Twitter</span>
                    </button>

                    <button
                      onClick={() => shareToSocial('whatsapp')}
                      className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <MessageSquare className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">WhatsApp</span>
                    </button>

                    <button
                      onClick={() => shareToSocial('facebook')}
                      className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Facebook</span>
                    </button>

                    <button
                      onClick={() => shareToSocial('linkedin')}
                      className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-blue-700" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">LinkedIn</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowFallback(false)}
                  className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  İptal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}