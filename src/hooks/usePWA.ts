import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')

      setIsStandalone(isStandaloneMode)
      setIsInstalled(isStandaloneMode)
    }

    checkStandalone()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
      console.log('💾 PWA Install prompt available')
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log('✅ PWA Installed successfully')
    }

    // Check if app is already installed
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
        if (relatedApps.length > 0) {
          setIsInstalled(true)
        }
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('❌ No install prompt available')
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      console.log(`🎯 User response to install prompt: ${outcome}`)

      if (outcome === 'accepted') {
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }

      return false
    } catch (error) {
      console.error('Install prompt error:', error)
      return false
    }
  }

  // Check if device supports installation
  const canInstall = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Check if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Get installation instructions based on browser
  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        steps: [
          'Tarayıcınızın adres çubuğundaki yükle simgesine tıklayın',
          'Veya menüden "Ana ekrana ekle" seçeneğini seçin'
        ]
      }
    }

    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return {
        browser: 'Safari',
        steps: [
          'Paylaş butonuna tıklayın',
          '"Ana Ekrana Ekle" seçeneğini seçin',
          '"Ekle" butonuna tıklayın'
        ]
      }
    }

    if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Menüden "Ana ekrana yükle" seçeneğini seçin',
          'Yükleme onayını verin'
        ]
      }
    }

    return {
      browser: 'Browser',
      steps: [
        'Tarayıcı menüsünü açın',
        '"Ana ekrana ekle" veya "Yükle" seçeneğini arayın'
      ]
    }
  }

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    canInstall: canInstall(),
    isMobile: isMobile(),
    promptInstall,
    installInstructions: getInstallInstructions()
  }
}