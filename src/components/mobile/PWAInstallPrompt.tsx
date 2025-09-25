import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isMobile, promptInstall, installInstructions } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed || !isInstallable) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)

    try {
      const installed = await promptInstall()
      if (installed) {
        setIsDismissed(true)
      }
    } catch (error) {
      console.error('Install failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    // Remember dismissal in localStorage
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 md:bottom-8 left-4 right-4 z-50"
      >
        <div className="glass-card border-2 border-amber-500/30 shadow-2xl max-w-md mx-auto">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  {isMobile ? (
                    <Smartphone className="w-6 h-6 text-white" />
                  ) : (
                    <Monitor className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    WhiskyVerse'i İndir
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Daha hızlı erişim için
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Features */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              <ul className="space-y-1">
                <li>✨ Offline erişim</li>
                <li>📱 Native uygulama deneyimi</li>
                <li>🚀 Daha hızlı yükleme</li>
                <li>📷 Kamera ile fotoğraf çekme</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Sonra
              </button>

              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    İndir
                  </>
                )}
              </button>
            </div>

            {/* Installation Instructions (for Safari/other browsers) */}
            {installInstructions.browser === 'Safari' && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                  {installInstructions.browser} İçin:
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  {installInstructions.steps.map((step, index) => (
                    <li key={index}>• {step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Install indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}