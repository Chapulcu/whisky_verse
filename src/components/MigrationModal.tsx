import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Shield, Smartphone, Trophy, X, Upload } from 'lucide-react'

interface MigrationModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function MigrationModal({ isOpen, onConfirm, onCancel }: MigrationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md"
          >
            {/* Glassmorphism Container */}
            <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />

              {/* Header */}
              <div className="relative p-6">
                <button
                  onClick={onCancel}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-black/30 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white text-center mb-2">
                  Eski Başarım Verileriniz Bulundu! 🔄
                </h3>
                <p className="text-white/80 text-sm text-center mb-6">
                  LocalStorage'daki başarımlarınızı veritabanına taşımak ister misiniz?
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">Güvenli Saklama</p>
                      <p className="text-white/70 text-xs">Verileriniz hiçbir zaman kaybolmayacak</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <Smartphone className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">Çoklu Cihaz</p>
                      <p className="text-white/70 text-xs">Tüm cihazlarınızda aynı başarımları görün</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">Liderlik Tablosu</p>
                      <p className="text-white/70 text-xs">Liderlik tablosunda yerinizi alın</p>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
                  <p className="text-amber-200 text-xs text-center">
                    ⚠️ Bu işlem geri alınamaz ve eski veriler temizlenecektir.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 font-medium transition-all duration-200 hover:bg-white/20"
                  >
                    İptal
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirm}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600 shadow-lg"
                  >
                    Taşı 🚀
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}