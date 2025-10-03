import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import { getTranslationFromCache, setTranslationCache } from '@/lib/cache/translationCache'

async function fetchTranslation(url: string, headers?: HeadersInit) {
  const response = await fetch(url, {
    headers,
    credentials: 'same-origin'
  })

  if (!response.ok) {
    const error = new Error(`Failed to load translation: ${response.status}`)
    ;(error as any).status = response.status
    throw error
  }

  return response.json()
}

function extractLangNamespace(url: string): { lang: string; namespace: string } | null {
  const match = /\/locales\/(.+?)\/(.+?)\.json(?:\?.*)?$/.exec(url)
  if (!match) return null
  return { lang: decodeURIComponent(match[1]), namespace: decodeURIComponent(match[2]) }
}

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    // Note: lng and LanguageDetector intentionally omitted
    // DefaultLanguageInitializer in App.tsx will set the language based on app_settings
    // We read from localStorage manually to preserve user choice
    lng: typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || undefined : undefined,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false, // React already escapes
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      request: async (options, url, _payload, callback) => {
        try {
          const meta = extractLangNamespace(url)
          const headers = options?.headers as HeadersInit | undefined

          if (meta) {
            const cached = await getTranslationFromCache(meta.lang, meta.namespace)
            if (cached) {
              callback(null, {
                data: JSON.stringify(cached),
                status: 200
              })

              // Background refresh to keep cache warm
              fetchTranslation(url, headers)
                .then(async freshData => {
                  await setTranslationCache(meta.lang, meta.namespace, freshData as Record<string, unknown>)
                })
                .catch(() => {})
              return
            }
          }

          const data = await fetchTranslation(url, headers)

          if (meta) {
            await setTranslationCache(meta.lang, meta.namespace, data as Record<string, unknown>)
          }

          callback(null, {
            data: JSON.stringify(data),
            status: 200
          })
        } catch (error: any) {
          callback(error, {
            status: error?.status ?? 500,
            data: ''
          })
        }
      }
    },
    
    // Supported languages
    supportedLngs: ['tr', 'en', 'ru', 'bg'],
    
    // Pluralization support
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // External JSON files are now used - translations loaded from /public/locales/
  })

export default i18n
