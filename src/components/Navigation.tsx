import React, { useState, useMemo, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle, LanguageToggle, UserMenu } from './ui/Controls'
import {
  Home,
  Wine,
  BookOpen,
  Users,
  Calendar,
  User,
  Crown,
  Menu,
  X,
  Settings,
  Search,
  Camera,
  MapPin,
  Heart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from './ErrorBoundary'

export function Navigation() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Desktop navigation items (limited for space)
  const desktopNavigationItems = useMemo(() => {
    const baseItems = [
      { path: '/', label: t('navigation.home'), icon: Home },
      { path: '/whiskies', label: t('navigation.whiskies'), icon: Wine },
    ]

    if (!user) {
      return baseItems
    }

    const userItems = [
      { path: '/collection', label: t('navigation.myCollection'), icon: BookOpen },
      { path: '/profile', label: t('navigation.profile'), icon: User },
    ]

    const vipItems = (profile?.role === 'vip' || profile?.role === 'admin') ? [
      { path: '/groups', label: t('navigation.groups'), icon: Users },
      { path: '/events', label: t('navigation.events'), icon: Calendar },
    ] : []

    const adminItems = (profile?.role === 'admin') ? [
      { path: '/admin', label: 'Admin Panel', icon: Settings },
    ] : []

    return [...baseItems, ...userItems, ...vipItems, ...adminItems]
  }, [t, user, profile?.role, i18n.language])

  // Mobile navigation items (includes all mobile menu items)
  const mobileNavigationItems = useMemo(() => {
    const baseItems = [
      { path: '/', label: t('navigation.home'), icon: Home },
      { path: '/whiskies', label: t('navigation.whiskies'), icon: Search },
      { path: '/nearby', label: t('navigation.nearby') || 'Yakınımda', icon: MapPin },
    ]

    if (!user) {
      return baseItems
    }

    const userItems = [
      { path: '/camera', label: t('navigation.camera') || 'Kamera', icon: Camera },
      { path: '/collection', label: t('navigation.myCollection'), icon: Heart },
      { path: '/profile', label: t('navigation.profile'), icon: User },
    ]

    const vipItems = (profile?.role === 'vip' || profile?.role === 'admin') ? [
      { path: '/groups', label: t('navigation.groups'), icon: Users },
      { path: '/events', label: t('navigation.events'), icon: Calendar },
    ] : []

    const adminItems = (profile?.role === 'admin') ? [
      { path: '/admin', label: 'Admin Panel', icon: Settings },
    ] : []

    return [...baseItems, ...userItems, ...vipItems, ...adminItems]
  }, [t, user, profile?.role, i18n.language])

  // CRITICAL FIX: Memoized handlers to prevent re-renders
  const isActive = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }, [location.pathname])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // CRITICAL FIX: Memoized user status checks
  const showUpgradeButton = useMemo(() => {
    return user && profile?.role !== 'vip' && profile?.role !== 'admin'
  }, [user, profile?.role])

  return (
    <ErrorBoundary>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex glass-nav fixed top-4 left-1/2 transform -translate-x-1/2 z-50 rounded-2xl px-3 xl:px-4 py-3 max-w-[98vw] overflow-hidden">
        <div className="flex items-center gap-2 xl:gap-4 w-full min-w-0">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 xl:gap-2 flex-shrink-0">
            <div className="w-7 h-7 xl:w-8 xl:h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Wine className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
            </div>
            <span className="font-cyber font-bold text-sm xl:text-lg text-gradient hidden 2xl:block">WhiskyVerse</span>
            <span className="font-cyber font-bold text-xs xl:text-base text-gradient 2xl:hidden">WV</span>
          </Link>
          
          {/* Navigation Items */}
          <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
            {desktopNavigationItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`nav-item flex items-center gap-1 px-2 xl:px-3 py-2 whitespace-nowrap ${isActive(path) ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs xl:text-sm font-medium hidden xl:block truncate">{label}</span>
              </Link>
            ))}
          </div>

          {/* Controls - Compact Layout */}
          <div className="flex items-center gap-1 border-l border-white/20 dark:border-white/10 pl-2 xl:pl-3 flex-shrink-0">
            {!user && (
              <Link to="/auth" className="btn-primary text-xs px-3 py-2 whitespace-nowrap">
                {t('auth.signIn')}
              </Link>
            )}
            
            {showUpgradeButton && (
              <Link to="/upgrade" className="btn-secondary text-xs px-2 py-2 flex items-center gap-1 whitespace-nowrap">
                <Crown className="w-3 h-3 flex-shrink-0" />
                <span className="hidden 2xl:inline">{t('vip.vipMembership')}</span>
                <span className="2xl:hidden">{t('vip.vip')}</span>
              </Link>
            )}
            
            <ErrorBoundary>
              <div className="flex items-center gap-0.5 xl:gap-1">
                <ThemeToggle />
                <LanguageToggle />
                <UserMenu />
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </nav>

      {/* Tablet Navigation (768px - 1024px) */}
      <nav className="hidden md:flex lg:hidden glass-nav fixed top-4 left-1/2 transform -translate-x-1/2 z-50 rounded-2xl px-3 py-3 max-w-[98vw] overflow-hidden">
        <div className="flex items-center gap-2 w-full min-w-0">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Wine className="w-4 h-4 text-white" />
            </div>
            <span className="font-cyber font-bold text-sm text-gradient">WV</span>
          </Link>

          {/* Navigation Items - Icon only for tablet */}
          <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
            {desktopNavigationItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`nav-item flex items-center justify-center p-2 rounded-lg ${isActive(path) ? 'active' : ''}`}
                title={label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* Controls - Ultra Compact */}
          <div className="flex items-center gap-1 border-l border-white/20 dark:border-white/10 pl-2 flex-shrink-0">
            {!user && (
              <Link to="/auth" className="btn-primary text-xs px-2 py-2 whitespace-nowrap">
                {t('auth.signIn')}
              </Link>
            )}
            
            {showUpgradeButton && (
              <Link to="/upgrade" className="btn-secondary text-xs p-2 flex items-center justify-center" title={t('vipMembership')}>
                <Crown className="w-4 h-4" />
              </Link>
            )}
            
            <ErrorBoundary>
              <div className="flex items-center gap-0.5">
                <ThemeToggle />
                <LanguageToggle />
                <UserMenu />
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden">
        {/* Mobile Header - Optimized for landscape with iOS safe area */}
        <div className="glass-nav fixed top-0 left-0 right-0 z-[9999] px-3 py-2 landscape:py-1 pt-safe-top">
          <div className="flex items-center justify-between h-12 landscape:h-10">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0" onClick={closeMobileMenu}>
              <div className="w-7 h-7 landscape:w-6 landscape:h-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Wine className="w-4 h-4 landscape:w-3 landscape:h-3 text-white" />
              </div>
              <span className="font-cyber font-bold text-base landscape:text-sm text-gradient hidden xs:block landscape:hidden">WhiskyVerse</span>
              <span className="font-cyber font-bold text-sm landscape:text-xs text-gradient xs:hidden landscape:block">WV</span>
            </Link>

            <div className="flex items-center gap-1">
              <ErrorBoundary>
                <div className="hidden sm:flex landscape:hidden items-center gap-1">
                  <ThemeToggle />
                  <LanguageToggle />
                  <UserMenu />
                </div>
                <div className="sm:hidden landscape:flex items-center gap-1">
                  <div className="landscape:flex items-center gap-1 hidden">
                    <ThemeToggle />
                    <LanguageToggle />
                  </div>
                  <UserMenu />
                </div>
              </ErrorBoundary>
              
              <button
                onClick={toggleMobileMenu}
                className="btn-glass p-3 landscape:p-2 rounded-lg ml-1 mobile-touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 landscape:w-4 landscape:h-4" /> : <Menu className="w-5 h-5 landscape:w-4 landscape:h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Landscape optimized */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-14 landscape:top-12 left-0 right-0 z-[9998] glass-panel mx-3 landscape:mx-2 p-4 landscape:p-3 max-h-[calc(100vh-4rem)] landscape:max-h-[calc(100vh-3rem)] overflow-y-auto"
            >
              {/* Portrait: Vertical layout for navigation items */}
              <div className="landscape:hidden space-y-2">
                {mobileNavigationItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={closeMobileMenu}
                    className={`mobile-nav-item flex items-center gap-3 w-full rounded-lg ${isActive(path) ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
                
                {/* Mobile-only controls */}
                <div className="sm:hidden border-t border-white/10 pt-4 mt-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <ThemeToggle />
                    <LanguageToggle />
                  </div>
                </div>
                
                {!user && (
                  <Link 
                    to="/auth" 
                    onClick={closeMobileMenu}
                    className="btn-primary w-full text-center mobile-button mobile-touch-target"
                  >
                    {t('auth.signIn')}
                  </Link>
                )}
                
                {showUpgradeButton && (
                  <Link 
                    to="/upgrade" 
                    onClick={closeMobileMenu}
                    className="btn-secondary w-full text-center flex items-center justify-center gap-2 mobile-button mobile-touch-target mt-2"
                  >
                    <Crown className="w-4 h-4" />
                    {t('upgradeToVip')}
                  </Link>
                )}
              </div>

              {/* Landscape: Compact horizontal layout */}
              <div className="hidden landscape:block">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {mobileNavigationItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={closeMobileMenu}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all ${isActive(path) ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'hover:bg-white/10'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate w-full text-center">{label}</span>
                    </Link>
                  ))}
                </div>
                
                {/* Landscape controls */}
                <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageToggle />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!user && (
                      <Link 
                        to="/auth" 
                        onClick={closeMobileMenu}
                        className="btn-primary text-xs px-3 py-2"
                      >
                        {t('auth.signIn')}
                      </Link>
                    )}
                    
                    {showUpgradeButton && (
                      <Link 
                        to="/upgrade" 
                        onClick={closeMobileMenu}
                        className="btn-secondary text-xs px-2 py-2 flex items-center gap-1"
                      >
                        <Crown className="w-3 h-3" />
                        <span className="hidden min-[480px]:inline">{t('vip')}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            onClick={closeMobileMenu}
          />
        )}
      </nav>
    </ErrorBoundary>
  )
}
