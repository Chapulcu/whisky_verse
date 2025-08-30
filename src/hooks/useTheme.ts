import { useState, useEffect, useCallback, useRef } from 'react'

type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const mountedRef = useRef(true)
  
  // CRITICAL FIX: Safe state initialization
  const [theme, setTheme] = useState<Theme>(() => {
    // SSR safe default
    if (typeof window === 'undefined') return 'system'
    
    try {
      // Get previous preference from localStorage
      const stored = localStorage.getItem('theme') as Theme
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored
      }
    } catch (error) {
      console.error('Error reading theme from localStorage:', error)
    }
    
    // Use system preference as default
    return 'system'
  })

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch (error) {
      console.error('Error detecting system theme:', error)
      return 'light'
    }
  })

  // CRITICAL FIX: Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let mediaQuery: MediaQueryList
    
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        if (mountedRef.current) {
          setSystemTheme(e.matches ? 'dark' : 'light')
        }
      }

      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => {
        if (mediaQuery) {
          mediaQuery.removeEventListener('change', handleSystemThemeChange)
        }
      }
    } catch (error) {
      console.error('Error setting up media query listener:', error)
    }
  }, [])

  // Calculate active theme
  const activeTheme = theme === 'system' ? systemTheme : theme

  // Apply theme to DOM
  useEffect(() => {
    if (typeof window === 'undefined' || !mountedRef.current) return
    
    try {
      const root = document.documentElement
      
      // Remove previous theme classes
      root.classList.remove('light', 'dark')
      
      // Apply new theme
      root.classList.add(activeTheme)
      
      console.log(`🎨 Theme applied: ${activeTheme}`)
    } catch (error) {
      console.error('Error applying theme to DOM:', error)
    }
  }, [activeTheme])

  // CRITICAL FIX: Safe theme change function
  const setThemePreference = useCallback((newTheme: Theme) => {
    if (!mountedRef.current) {
      console.warn('Attempted to set theme after component unmount')
      return
    }
    
    try {
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
      console.log(`🎨 Theme preference set: ${newTheme}`)
    } catch (error) {
      console.error('Error setting theme preference:', error)
    }
  }, [])

  return {
    theme,
    activeTheme,
    setTheme: setThemePreference,
    systemTheme,
  }
}
