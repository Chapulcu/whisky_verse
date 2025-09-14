import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon, Monitor, Languages, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from '../ErrorBoundary'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  // Simple cycle: light -> dark -> system -> light
  const handleThemeToggle = useCallback(() => {
    console.log('🎨 Theme toggle clicked, current:', theme)
    
    let nextTheme: 'light' | 'dark' | 'system'
    switch (theme) {
      case 'light':
        nextTheme = 'dark'
        break
      case 'dark':
        nextTheme = 'system'
        break
      default:
        nextTheme = 'light'
        break
    }
    
    console.log('🎨 Setting theme to:', nextTheme)
    setTheme(nextTheme)
  }, [theme, setTheme])

  const getCurrentIcon = () => {
    switch (theme) {
      case 'light': return Sun
      case 'dark': return Moon
      default: return Monitor
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light Mode'
      case 'dark': return 'Dark Mode'
      default: return 'System Mode'
    }
  }

  const CurrentIcon = getCurrentIcon()

  return (
    <ErrorBoundary>
      <button
        onClick={handleThemeToggle}
        className={`btn-glass p-2 rounded-lg ${className}`}
        title={`Current: ${getThemeLabel()}, Click to change`}
      >
        <CurrentIcon className="w-4 h-4" />
      </button>
    </ErrorBoundary>
  )
}

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ]

  // Simple toggle between TR and EN
  const handleLanguageToggle = useCallback(() => {
    console.log('🌍 Language toggle clicked, current:', i18n.language)
    
    const nextLanguage = i18n.language === 'tr' ? 'en' : 'tr'
    console.log('🌍 Setting language to:', nextLanguage)
    
    i18n.changeLanguage(nextLanguage)
  }, [i18n])

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  return (
    <ErrorBoundary>
      <button
        onClick={handleLanguageToggle}
        className={`btn-glass p-2 rounded-lg flex items-center gap-1 ${className}`}
        title={`Current: ${currentLanguage.name}, Click to switch`}
      >
        <span className="text-sm">{currentLanguage.flag}</span>
        <Languages className="w-3 h-3" />
      </button>
    </ErrorBoundary>
  )
}

export function UserMenu({ className = '' }: { className?: string }) {
  const { user, profile, signOut } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogoutClick = useCallback(() => {
    console.log('🚪 Logout button clicked')
    setShowLogoutModal(true)
  }, [])

  const handleConfirmLogout = useCallback(async () => {
    console.log('🚪 Logout confirmed')
    setShowLogoutModal(false)
    
    try {
      console.log('🚪 Calling signOut...')
      await signOut()
      console.log('🚪 SignOut completed successfully')
    } catch (error) {
      console.error('🚪 SignOut error, forcing reload:', error)
      // Force reload even on error
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }, [signOut])

  const handleCancelLogout = useCallback(() => {
    console.log('🚪 Logout cancelled')
    setShowLogoutModal(false)
  }, [])

  if (!user) return null

  return (
    <ErrorBoundary>
      <button
        onClick={handleLogoutClick}
        className={`btn-glass p-2 rounded-lg flex items-center gap-1 text-red-500 hover:text-red-400 ${className}`}
        title={`Logout: ${profile?.full_name || user.email}`}
      >
        <User className="w-3 h-3" />
        <LogOut className="w-3 h-3" />
      </button>

      {/* Logout Confirmation Modal - Portal to body */}
      {showLogoutModal && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={handleCancelLogout}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-xl p-6 max-w-sm w-full shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold">Çıkış Yap</h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Hesabınızdan çıkış yapmak istediğinizden emin misiniz?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </ErrorBoundary>
  )
}