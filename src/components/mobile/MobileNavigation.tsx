import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Camera, User, Heart, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

interface MobileNavItem {
  icon: React.ReactNode
  label: string
  path: string
  requiresAuth?: boolean
}

const navItems: MobileNavItem[] = [
  {
    icon: <Home className="w-5 h-5" />,
    label: 'Ana Sayfa',
    path: '/'
  },
  {
    icon: <Search className="w-5 h-5" />,
    label: 'Keşfet',
    path: '/whiskies'
  },
  {
    icon: <Camera className="w-5 h-5" />,
    label: 'Kamera',
    path: '/camera',
    requiresAuth: true
  },
  {
    icon: <Heart className="w-5 h-5" />,
    label: 'Koleksiyon',
    path: '/collection',
    requiresAuth: true
  },
  {
    icon: <User className="w-5 h-5" />,
    label: 'Profil',
    path: '/profile',
    requiresAuth: true
  }
]

export function MobileNavigation() {
  const location = useLocation()
  const { user } = useAuth()

  // Don't show on desktop or specific pages
  const hiddenPaths = ['/admin', '/login', '/register', '/onboarding']
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path))

  if (shouldHide) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* Background blur */}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800" />

      {/* Navigation items */}
      <nav className="relative flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item) => {
          // Skip auth-required items if not logged in
          if (item.requiresAuth && !user) return null

          const isActive = location.pathname === item.path ||
                          (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1"
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="activeNavBg"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-400/20 dark:to-orange-400/20 rounded-xl"
                  transition={{ type: "spring", duration: 0.3 }}
                />
              )}

              {/* Icon */}
              <div className={`relative z-10 transition-all duration-200 ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 scale-110'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
                {item.icon}
              </div>

              {/* Label */}
              <span className={`relative z-10 text-xs font-medium transition-all duration-200 truncate max-w-full ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {item.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 w-1.5 h-1.5 bg-amber-500 rounded-full"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Safe area spacer for iOS */}
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </div>
  )
}

// Hook to detect if device is mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}