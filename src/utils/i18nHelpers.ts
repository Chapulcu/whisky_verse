import { useTranslation } from 'react-i18next'

// Helper hook for pluralization
export const usePluralization = () => {
  const { t } = useTranslation()

  const pluralize = (key: string, count: number, options?: object) => {
    return t(`pluralization.${key}`, { count, ...options })
  }

  return { pluralize }
}

// Helper for date formatting
export const useDateFormat = () => {
  const { t, i18n } = useTranslation()

  const formatDate = (date: Date | string, format: 'time' | 'date' | 'dateTime' | 'shortDate' = 'date'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Get format pattern from translations
    const pattern = t(`dates.${format}Format`)
    
    // Simple format mapping - in a real app you'd use a proper date library like date-fns
    const formatters: Record<string, (date: Date) => string> = {
      'HH:mm': (d) => d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: false }),
      'h:mm A': (d) => d.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true }),
      'DD/MM/YYYY': (d) => d.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'MM/DD/YYYY': (d) => d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'DD.MM.YYYY': (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'DD/MM/YYYY HH:mm': (d) => d.toLocaleString(i18n.language, { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
      }),
      'MM/DD/YYYY h:mm A': (d) => d.toLocaleString('en-US', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      }),
      'DD.MM.YYYY HH:mm': (d) => d.toLocaleString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
      }),
      'DD MMM': (d) => d.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' }),
      'MMM DD': (d) => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
    }

    const formatter = formatters[pattern]
    return formatter ? formatter(dateObj) : dateObj.toLocaleDateString(i18n.language)
  }

  const formatRelativeTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - dateObj.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return t('pluralization.daysAgo', { count: diffDays })
  }

  return { formatDate, formatRelativeTime }
}

// SEO meta tags helper
export const useSEOTranslation = () => {
  const { t, i18n } = useTranslation()

  const getSEOTags = (pageKey: string) => {
    return {
      title: t(`seo.${pageKey}.title`, { defaultValue: t('seo.default.title') }),
      description: t(`seo.${pageKey}.description`, { defaultValue: t('seo.default.description') }),
      keywords: t(`seo.${pageKey}.keywords`, { defaultValue: t('seo.default.keywords') }),
      lang: i18n.language,
      alternate: [
        { hrefLang: 'tr', href: `/${pageKey}` },
        { hrefLang: 'en', href: `/en/${pageKey}` },
        { hrefLang: 'ru', href: `/ru/${pageKey}` },
        { hrefLang: 'bg', href: `/bg/${pageKey}` },
      ]
    }
  }

  return { getSEOTags }
}

// URL-based language routing helper
export const useLanguageRouting = () => {
  const { i18n } = useTranslation()

  const getLocalizedPath = (path: string, language?: string) => {
    const lang = language || i18n.language
    
    // Default language (Turkish) doesn't need prefix
    if (lang === 'tr') {
      return path
    }
    
    // Add language prefix for non-default languages
    return `/${lang}${path === '/' ? '' : path}`
  }

  const getLanguageFromPath = (pathname: string): string => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    
    // Check if first segment is a language code
    if (['en', 'ru', 'bg'].includes(firstSegment)) {
      return firstSegment
    }
    
    // Default to Turkish if no language prefix
    return 'tr'
  }

  const removeLanguageFromPath = (pathname: string): string => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    
    // If first segment is a language code, remove it
    if (['en', 'ru', 'bg'].includes(firstSegment)) {
      return '/' + pathSegments.slice(1).join('/')
    }
    
    return pathname
  }

  return { getLocalizedPath, getLanguageFromPath, removeLanguageFromPath }
}
