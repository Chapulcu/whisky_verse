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
  const [isOpen, setIsOpen] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mountedRef = useRef(true)

  // CRITICAL FIX: Safe state updates with position calculation
  const safeSetIsOpen = useCallback((value: boolean) => {
    if (mountedRef.current) {
      if (value && buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect())
      }
      setIsOpen(value)
    }
  }, [])

  // CRITICAL FIX: Cleanup on unmount + click outside handler
  useEffect(() => {
    mountedRef.current = true
    
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        safeSetIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      mountedRef.current = false
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, safeSetIsOpen])

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    try {
      if (mountedRef.current) {
        setTheme(newTheme)
        safeSetIsOpen(false)
      }
    } catch (error) {
      console.error('Theme change error:', error)
    }
  }, [setTheme, safeSetIsOpen])

  return (
    <ErrorBoundary>
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => safeSetIsOpen(!isOpen)}
          className="btn-glass p-2 rounded-lg"
          aria-label="Toggle theme"
        >
          {theme === 'light' && <Sun className="w-5 h-5" />}
          {theme === 'dark' && <Moon className="w-5 h-5" />}
          {theme === 'system' && <Monitor className="w-5 h-5" />}
        </button>

        {/* Portal for dropdown */}
        {isOpen && buttonRect && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed w-40 glass rounded-lg shadow-xl"
              style={{
                left: buttonRect.right - 160,
                top: buttonRect.bottom + 8,
                zIndex: 9999
              }}
            >
              <div className="py-2">
                {themeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 dark:hover:bg-white/5 transition-colors ${
                      theme === value ? 'text-primary-600 dark:text-primary-400' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>
    </ErrorBoundary>
  )
}

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mountedRef = useRef(true)

  // CRITICAL FIX: Safe state updates with position calculation
  const safeSetIsOpen = useCallback((value: boolean) => {
    if (mountedRef.current) {
      if (value && buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect())
      }
      setIsOpen(value)
    }
  }, [])

  // CRITICAL FIX: Cleanup on unmount + click outside handler
  useEffect(() => {
    mountedRef.current = true
    
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        safeSetIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      mountedRef.current = false
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, safeSetIsOpen])

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ]

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = useCallback((langCode: string) => {
    try {
      if (mountedRef.current) {
        i18n.changeLanguage(langCode)
        safeSetIsOpen(false)
      }
    } catch (error) {
      console.error('Language change error:', error)
    }
  }, [i18n, safeSetIsOpen])

  return (
    <ErrorBoundary>
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => safeSetIsOpen(!isOpen)}
          className="btn-glass p-2 rounded-lg flex items-center gap-2"
          aria-label="Change language"
        >
          <Languages className="w-5 h-5" />
          <span className="text-sm font-medium">{currentLang.flag}</span>
        </button>

        {/* Portal for dropdown */}
        {isOpen && buttonRect && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed w-40 glass rounded-lg shadow-xl"
              style={{
                left: buttonRect.right - 160,
                top: buttonRect.bottom + 8,
                zIndex: 9999
              }}
            >
              <div className="py-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 dark:hover:bg-white/5 transition-colors ${
                      i18n.language === lang.code ? 'text-primary-600 dark:text-primary-400' : ''
                    }`}
                  >
                    <span>{lang.flag}</span>
                    {lang.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>
    </ErrorBoundary>
  )
}

export function UserMenu({ className = '' }: { className?: string }) {
  const { user, profile, signOut } = useAuth()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mountedRef = useRef(true)

  // CRITICAL FIX: Safe state updates with position calculation
  const safeSetIsOpen = useCallback((value: boolean) => {
    if (mountedRef.current) {
      if (value && buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect())
      }
      setIsOpen(value)
    }
  }, [])

  // CRITICAL FIX: Cleanup on unmount + click outside handler
  useEffect(() => {
    mountedRef.current = true
    
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        safeSetIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      mountedRef.current = false
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, safeSetIsOpen])

  const handleSignOut = useCallback(async () => {
    try {
      console.log('🚪 Sign out button clicked')
      if (mountedRef.current) {
        safeSetIsOpen(false)
        console.log('🚪 Calling signOut function...')
        await signOut()
        console.log('🚪 SignOut completed')
      }
    } catch (error) {
      console.error('🚪 Sign out error:', error)
    }
  }, [signOut, safeSetIsOpen])

  if (!user) return null

  return (
    <ErrorBoundary>
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => safeSetIsOpen(!isOpen)}
          className="btn-glass p-2 rounded-lg flex items-center gap-2"
          aria-label="User menu"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
          {profile?.role === 'vip' && (
            <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
              VIP
            </span>
          )}
        </button>

        {/* Portal for dropdown */}
        {isOpen && buttonRect && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed w-48 glass rounded-lg shadow-xl"
              style={{
                left: buttonRect.right - 192,
                top: buttonRect.bottom + 8,
                zIndex: 9999
              }}
            >
              <div className="py-2">
                <div className="px-4 py-2 border-b border-white/10 dark:border-white/5">
                  <p className="text-sm font-medium truncate">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  {profile?.role && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium capitalize mt-1">
                      {profile.role === 'vip' ? 'VIP Üye' : profile.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  {t('signOut')}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>
    </ErrorBoundary>
  )
}
