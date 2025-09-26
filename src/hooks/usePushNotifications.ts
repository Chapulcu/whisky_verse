import { useState, useEffect, useCallback } from 'react'

export type NotificationPermission = 'default' | 'granted' | 'denied'

interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface PushNotificationOptions {
  title: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if notifications and service workers are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)

      // Get service worker registration
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => {
            setRegistration(reg)
          })
          .catch((error) => {
            console.error('Service Worker not ready:', error)
          })
      }
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied'
    }

    if (permission === 'granted') {
      return 'granted'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }, [isSupported, permission])

  const showNotification = useCallback(async (options: PushNotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Push notifications are not supported')
      return false
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission()
      if (newPermission !== 'granted') {
        console.warn('Notification permission not granted')
        return false
      }
    }

    try {
      // Use service worker registration if available for better support
      if (registration) {
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/icon-192x192.png',
          badge: options.badge || '/icons/icon-192x192.png',
          tag: options.tag,
          data: options.data,
          actions: options.actions,
          requireInteraction: options.requireInteraction,
          silent: options.silent
        })
      } else {
        // Fallback to basic Notification API
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/icon-192x192.png',
          tag: options.tag,
          requireInteraction: options.requireInteraction,
          silent: options.silent
        })
      }

      return true
    } catch (error) {
      console.error('Error showing notification:', error)
      return false
    }
  }, [isSupported, permission, registration, requestPermission])

  const scheduleNotification = useCallback(
    (options: PushNotificationOptions, delay: number): Promise<boolean> => {
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await showNotification(options)
          resolve(result)
        }, delay)
      })
    },
    [showNotification]
  )

  // Predefined notification types for WhiskyVerse
  const notifyNewWhisky = useCallback(
    (whiskyName: string) => {
      return showNotification({
        title: 'Yeni Viski Eklendi! 🥃',
        body: `${whiskyName} koleksiyonumuza eklendi. Hemen keşfedin!`,
        tag: 'new-whisky',
        data: { type: 'new-whisky', whiskyName },
        vibrate: [200, 100, 200]
      })
    },
    [showNotification]
  )

  const notifyCollectionUpdate = useCallback(
    (count: number) => {
      return showNotification({
        title: 'Koleksiyon Güncellemesi 📚',
        body: `Koleksiyonunuzda ${count} viski bulunuyor!`,
        tag: 'collection-update',
        data: { type: 'collection', count },
        vibrate: [100, 50, 100]
      })
    },
    [showNotification]
  )

  const notifyEvent = useCallback(
    (eventName: string, eventDate: string) => {
      return showNotification({
        title: 'Yaklaşan Etkinlik 📅',
        body: `${eventName} - ${eventDate}`,
        tag: 'event',
        data: { type: 'event', eventName, eventDate },
        requireInteraction: true,
        vibrate: [300, 100, 300]
      })
    },
    [showNotification]
  )

  const notifyNearbyLocation = useCallback(
    (locationName: string, distance: string) => {
      return showNotification({
        title: 'Yakınızda Viski Mekanı! 📍',
        body: `${locationName} size sadece ${distance} uzaklıkta`,
        tag: 'nearby-location',
        data: { type: 'location', locationName, distance },
        actions: [
          {
            action: 'view',
            title: 'Görüntüle'
          },
          {
            action: 'directions',
            title: 'Yol Tarifi'
          }
        ],
        vibrate: [200, 100, 200, 100, 200]
      })
    },
    [showNotification]
  )

  const clearNotifications = useCallback(
    (tag?: string) => {
      if (!isSupported || !registration) return

      if (tag) {
        // Clear specific notification by tag
        registration.getNotifications({ tag }).then((notifications) => {
          notifications.forEach((notification) => notification.close())
        })
      } else {
        // Clear all notifications
        registration.getNotifications().then((notifications) => {
          notifications.forEach((notification) => notification.close())
        })
      }
    },
    [isSupported, registration]
  )

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
    clearNotifications,
    // Predefined notifications
    notifyNewWhisky,
    notifyCollectionUpdate,
    notifyEvent,
    notifyNearbyLocation
  }
}