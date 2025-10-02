import React from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Languages } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  useAppSettings,
  useUpdateDefaultLanguage,
  SUPPORTED_APP_LANGUAGES,
  type SupportedAppLanguage
} from '@/hooks/useAppSettings'

export function DefaultLanguageSettings() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const { data: settings, isLoading, isError, error } = useAppSettings()
  const updateMutation = useUpdateDefaultLanguage()

  const isAdmin = profile?.role === 'admin'

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value as SupportedAppLanguage
    if (!isAdmin) {
      toast.error(t('adminPage.settings.defaultLanguage.permissionsError'))
      return
    }

    try {
      await updateMutation.mutateAsync({
        language: nextLanguage,
        userId: user?.id ?? null
      })
      toast.success(t('adminPage.settings.defaultLanguage.success', { language: nextLanguage.toUpperCase() }))
    } catch (mutationError: any) {
      console.error('❌ Failed to update default language', mutationError)
      toast.error(
        mutationError?.message ||
          t('adminPage.settings.defaultLanguage.error')
      )
    }
  }

  React.useEffect(() => {
    if (isError && error) {
      console.error('❌ Failed to load app settings', error)
      toast.error(t('adminPage.settings.defaultLanguage.loadError'))
    }
  }, [isError, error, t])

  return (
    <div className="glass-strong rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Languages className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('adminPage.settings.defaultLanguage.title')}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('adminPage.settings.defaultLanguage.description')}
          </p>
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {t('adminPage.settings.defaultLanguage.label')}
      </label>
      <select
        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
        value={settings?.default_language ?? 'tr'}
        onChange={handleChange}
        disabled={isLoading || updateMutation.isPending || !isAdmin}
      >
        {SUPPORTED_APP_LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>

      {!isAdmin && (
        <p className="mt-3 text-xs text-red-500">
          {t('adminPage.settings.defaultLanguage.onlyAdmins')}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {t('adminPage.settings.defaultLanguage.info')}
      </p>
    </div>
  )
}
