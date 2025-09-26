import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navigation } from './Navigation'
import { ScrollToTop } from './ScrollToTop'
import { useBackgroundManagement } from '@/hooks/useBackgroundManagement'
import { MobileNavigation } from './mobile/MobileNavigation'
import { PWAInstallPrompt } from './mobile/PWAInstallPrompt'
import { Toaster } from 'react-hot-toast'

export function Layout() {
  const { getCurrentBackgroundUrl, getCurrentBackgroundVideoUrl, isVideoBackground, settings } = useBackgroundManagement()
  const [isDark, setIsDark] = useState(false)

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkTheme()

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    return () => observer.disconnect()
  }, [])

  const backgroundUrl = getCurrentBackgroundUrl(isDark)
  const backgroundVideoUrl = getCurrentBackgroundVideoUrl(isDark)
  const isVideo = isVideoBackground()
  
  // Debug logging
  console.log('Layout background debug:', {
    isDark,
    backgroundUrl,
    backgroundVideoUrl,
    isVideo,
    settings
  })
  
  // Dynamic style for background image (only used when not video)
  const backgroundStyle = backgroundUrl && !isVideo ? {
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat'
  } : {}
  
  console.log('Background style:', backgroundStyle)

  return (
    <div 
      className="min-h-screen cyber-bg relative"
      style={backgroundStyle}
    >
      {/* Video Background */}
      {isVideo && backgroundVideoUrl && (
        <>
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={backgroundVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{ zIndex: -1 }}
          />
          <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[2px]" />
        </>
      )}
      
      {/* Overlay for better readability when background image is present */}
      {!isVideo && backgroundUrl && (
        <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[2px]" />
      )}
      
      <div className="relative z-10">
        <Navigation />
        
        {/* Main Content */}
        <main className="pt-20 md:pt-24 pb-20 md:pb-8 ios-safe-content">
          <div className="container mx-auto mobile-padding">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Scroll To Top Button */}
      <ScrollToTop />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 6000,
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '12px',
            color: '#f8fafc',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            fontWeight: '500',
            fontSize: '14px',
            maxWidth: '400px',
          },
          success: {
            style: {
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}