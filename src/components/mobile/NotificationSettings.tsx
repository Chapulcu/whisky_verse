import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, Check, X, Settings, Vibrate } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import toast from 'react-hot-toast'

interface NotificationPreferences {
  newWhiskies: boolean
  collectionUpdates: boolean
  events: boolean
  nearbyLocations: boolean
  promotions: boolean
}

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { isSupported, permission, requestPermission, showNotification } = usePushNotifications()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newWhiskies: true,
    collectionUpdates: true,
    events: true,
    nearbyLocations: false,
    promotions: false
  })
  const [isRequesting, setIsRequesting] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notification-preferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse notification preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage
  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences)
    localStorage.setItem('notification-preferences', JSON.stringify(newPreferences))
  }

  const handlePermissionRequest = async () => {
    setIsRequesting(true)

    try {
      const result = await requestPermission()

      if (result === 'granted') {
        toast.success('Bildirim izni verildi! 🎉')
        // Show a test notification
        await showNotification({
          title: 'WhiskyVerse Bildirimler Aktif! 🥃',
          body: 'Artık önemli güncellemelerden haberdar olacaksınız.',
          tag: 'permission-granted',
          vibrate: [200, 100, 200]
        })
      } else if (result === 'denied') {
        toast.error('Bildirim izni reddedildi. Tarayıcı ayarlarından izin verebilirsiniz.')
      } else {
        toast('Bildirim izni bekleniyor...')
      }
    } catch (error) {
      toast.error('Bildirim izni alınamadı')
    } finally {
      setIsRequesting(false)
    }
  }

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    }
    savePreferences(newPreferences)

    if (newPreferences[key]) {
      toast.success(`${getPreferenceLabel(key)} bildirimleri açıldı`)
    } else {
      toast.success(`${getPreferenceLabel(key)} bildirimleri kapatıldı`)
    }
  }

  const getPreferenceLabel = (key: keyof NotificationPreferences): string => {
    const labels = {
      newWhiskies: 'Yeni Viskiler',
      collectionUpdates: 'Koleksiyon Güncellemeleri',
      events: 'Etkinlikler',
      nearbyLocations: 'Yakındaki Mekanlar',
      promotions: 'Promosyonlar'
    }
    return labels[key]
  }

  const getPreferenceDescription = (key: keyof NotificationPreferences): string => {
    const descriptions = {
      newWhiskies: 'Koleksiyona yeni viski eklendiğinde bildir',
      collectionUpdates: 'Koleksiyonunuzda değişiklik olduğunda bildir',
      events: 'Viski etkinlikleri ve tadım seansları için bildir',
      nearbyLocations: 'Yakınınızdaki yeni viski mekanları için bildir',
      promotions: 'Özel indirimler ve kampanyalar için bildir'
    }
    return descriptions[key]
  }

  const testNotification = async () => {
    if (permission !== 'granted') {
      toast.error('Önce bildirim izni vermelisiniz')
      return
    }

    const success = await showNotification({
      title: 'Test Bildirimi 🧪',
      body: 'Bu bir test bildirimidir. Bildirimler düzgün çalışıyor!',
      tag: 'test',
      vibrate: [100, 50, 100, 50, 100]
    })

    if (success) {
      toast.success('Test bildirimi gönderildi!')
    } else {
      toast.error('Test bildirimi gönderilemedi')
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
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Bildirim Ayarları
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 space-y-6">
            {/* Support Status */}
            <div className={`p-4 rounded-xl border ${
              isSupported
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {isSupported ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-medium ${
                    isSupported
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {isSupported ? 'Bildirimler Destekleniyor' : 'Bildirimler Desteklenmiyor'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isSupported
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isSupported
                      ? 'Tarayıcınız push bildirimlerini destekliyor'
                      : 'Bu tarayıcı push bildirimlerini desteklemiyor'
                    }
                  </p>
                </div>
              </div>
            </div>

            {isSupported && (
              <>
                {/* Permission Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    İzin Durumu
                  </h3>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      {permission === 'granted' ? (
                        <Bell className="w-5 h-5 text-green-500" />
                      ) : permission === 'denied' ? (
                        <BellOff className="w-5 h-5 text-red-500" />
                      ) : (
                        <Bell className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {permission === 'granted'
                            ? 'İzin Verildi'
                            : permission === 'denied'
                            ? 'İzin Reddedildi'
                            : 'İzin Bekleniyor'
                          }
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {permission === 'granted'
                            ? 'Bildirimler gönderilebilir'
                            : permission === 'denied'
                            ? 'Tarayıcı ayarlarından izin verin'
                            : 'Bildirimler için izin gerekli'
                          }
                        </p>
                      </div>
                    </div>

                    {permission !== 'granted' && (
                      <button
                        onClick={handlePermissionRequest}
                        disabled={isRequesting}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                      >
                        {isRequesting ? 'İstek Gönderiliyor...' : 'İzin Ver'}
                      </button>
                    )}

                    {permission === 'granted' && (
                      <button
                        onClick={testNotification}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                      >
                        Test Et
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Bildirim Tercihleri
                  </h3>

                  <div className="space-y-3">
                    {(Object.keys(preferences) as Array<keyof NotificationPreferences>).map((key) => (
                      <div
                        key={key}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          preferences[key]
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                preferences[key]
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-400 text-white'
                              }`}>
                                <Bell className="w-3 h-3" />
                              </div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {getPreferenceLabel(key)}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {getPreferenceDescription(key)}
                            </p>
                          </div>

                          <button
                            onClick={() => togglePreference(key)}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              preferences[key]
                                ? 'bg-blue-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
                                preferences[key]
                                  ? 'translate-x-7'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}