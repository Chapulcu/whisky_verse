import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

interface AgeVerificationProps {
  onVerified: () => void
}

export function AgeVerification({ onVerified }: AgeVerificationProps) {
  const { t, i18n } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Check if user already verified age (stored in localStorage)
  useEffect(() => {
    const ageVerified = localStorage.getItem('whiskyverse_age_verified')
    const verificationDate = localStorage.getItem('whiskyverse_age_verification_date')
    
    // Check if verification is still valid (30 days)
    if (ageVerified === 'true' && verificationDate) {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      if (parseInt(verificationDate) > thirtyDaysAgo) {
        onVerified()
        return
      } else {
        // Clear expired verification
        localStorage.removeItem('whiskyverse_age_verified')
        localStorage.removeItem('whiskyverse_age_verification_date')
      }
    }
    
    setIsVisible(true)
  }, [onVerified])

  const handleConfirmAge = () => {
    setIsValidating(true)

    // Simulate validation delay
    setTimeout(() => {
      // Store verification in localStorage
      localStorage.setItem('whiskyverse_age_verified', 'true')
      localStorage.setItem('whiskyverse_age_verification_date', Date.now().toString())

      setIsVisible(false)
      setTimeout(() => onVerified(), 300)
      setIsValidating(false)
    }, 1000)
  }

  const handleReject = () => {
    // Redirect to a different page or show warning
    window.location.href = 'https://www.google.com'
  }


  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('ageVerification.ageVerificationRequired')}
              </h1>
              
              <p className="text-slate-300 text-sm leading-relaxed">
                {t('ageVerification.ageVerificationMessage')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConfirmAge}
                disabled={isValidating}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/25"
              >
                {isValidating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {isValidating
                  ? t('ageVerification.verifying')
                  : t('ageVerification.iam18OrOlder')
                }
              </button>

              <button
                onClick={handleReject}
                className="w-full px-6 py-3 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                {t('ageVerification.iAmUnder18')}
              </button>
            </div>

            {/* Legal Notice */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                {t('ageVerification.legalNotice')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}