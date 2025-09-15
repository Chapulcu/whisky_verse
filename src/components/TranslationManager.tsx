import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Globe, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useWhiskyTranslations, WhiskyTranslation } from '@/hooks/useMultilingualWhiskies'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface TranslationManagerProps {
  whiskyId: number
  onClose: () => void
  onSave?: () => void
}

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' }
]

export function TranslationManager({ whiskyId, onClose, onSave }: TranslationManagerProps) {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const { updateTranslation, getAllTranslations, loading } = useWhiskyTranslations()
  
  // Admin check - if not admin, close modal immediately
  if (!user || profile?.role !== 'admin') {
    console.warn('Translation manager accessed by non-admin user')
    onClose()
    return null
  }
  const [activeLanguage, setActiveLanguage] = useState('tr')
  const [translations, setTranslations] = useState<Record<string, Partial<WhiskyTranslation>>>({})
  const [loadingTranslations, setLoadingTranslations] = useState(true)
  const [savingLanguages, setSavingLanguages] = useState<Set<string>>(new Set())

  const loadTranslations = async () => {
    setLoadingTranslations(true)
    try {
      const result = await getAllTranslations(whiskyId)
      const translationMap = result.reduce((acc, translation) => {
        acc[translation.language_code] = translation
        return acc
      }, {} as Record<string, WhiskyTranslation>)
      
      setTranslations(translationMap)
    } catch (error) {
      console.error('Error loading translations:', error)
    } finally {
      setLoadingTranslations(false)
    }
  }

  useEffect(() => {
    loadTranslations()
  }, [whiskyId])

  const handleSave = async (languageCode: string) => {
    const translation = translations[languageCode]
    console.log('TranslationManager: Starting save, translation data:', translation)
    
    if (!translation?.name?.trim()) {
      console.log('TranslationManager: Name validation failed')
      toast.error(t('whiskyNameRequired'))
      return
    }

    console.log('TranslationManager: Setting loading state for language:', languageCode)
    setSavingLanguages(prev => new Set(prev).add(languageCode))
    
    try {
      console.log('TranslationManager: Starting save for language:', languageCode)
      const result = await updateTranslation(whiskyId, languageCode, {
        name: translation.name!,
        type: translation.type || '',
        description: translation.description || '',
        aroma: translation.aroma || '',
        taste: translation.taste || '',
        finish: translation.finish || '',
        color: translation.color || ''
      })

      console.log('TranslationManager: Save result:', result)
      if (result.success) {
        // Re-enable translations reload now that saves work properly
        await loadTranslations()
        onSave?.()
      } else {
        console.error('TranslationManager: Save failed:', result.error)
        toast.error(`Çeviri kaydedilemedi: ${result.error}`)
      }
    } catch (error) {
      console.error('TranslationManager: Save error:', error)
      toast.error('Çeviri kaydederken hata oluştu')
    } finally {
      setSavingLanguages(prev => {
        const newSet = new Set(prev)
        newSet.delete(languageCode)
        return newSet
      })
    }
  }

  const handleSaveAll = async () => {
    console.log('TranslationManager: Starting sequential save for all languages')
    // Save languages sequentially to avoid conflicts
    for (const lang of languages) {
      console.log(`TranslationManager: Saving ${lang.code}...`)
      await handleSave(lang.code)
      console.log(`TranslationManager: ${lang.code} save completed`)
    }
    console.log('TranslationManager: All languages saved')
  }

  const updateTranslationField = (languageCode: string, field: string, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        [field]: value
      }
    }))
  }

  const getCompletionStatus = (languageCode: string) => {
    const translation = translations[languageCode]
    if (!translation) return 'missing'
    
    const hasBasicFields = translation.name?.trim() && translation.type?.trim()
    const hasDetailedFields = translation.description?.trim() || translation.aroma?.trim() || 
                             translation.taste?.trim() || translation.finish?.trim()
    
    if (hasBasicFields && hasDetailedFields) return 'complete'
    if (hasBasicFields) return 'partial'
    return 'missing'
  }

  const getStatusIcon = (languageCode: string) => {
    const status = getCompletionStatus(languageCode)
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  if (loadingTranslations) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-slate-200">{t('translationsLoading')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {t('translationManagement')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              disabled={savingLanguages.size > 0}
              className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-200 hover:text-emerald-100 backdrop-blur-md border border-emerald-400/20 hover:border-emerald-300/30 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('saveAll')}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLanguage(lang.code)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeLanguage === lang.code
                  ? 'bg-amber-500/30 text-amber-200 shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.nativeName}</span>
              {getStatusIcon(lang.code)}
            </button>
          ))}
        </div>

        {/* Translation Form */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('whiskyName')} *
              </label>
              <input
                type="text"
                value={translations[activeLanguage]?.name || ''}
                onChange={(e) => updateTranslationField(activeLanguage, 'name', e.target.value)}
                className="input-glass"
                placeholder={t('enterWhiskyName')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('whiskyType')}
              </label>
              <input
                type="text"
                value={translations[activeLanguage]?.type || ''}
                onChange={(e) => updateTranslationField(activeLanguage, 'type', e.target.value)}
                className="input-glass"
                placeholder={t('exampleType')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('color')}
              </label>
              <input
                type="text"
                value={translations[activeLanguage]?.color || ''}
                onChange={(e) => updateTranslationField(activeLanguage, 'color', e.target.value)}
                className="input-glass"
                placeholder={t('exampleColor')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('generalDescription')}
              </label>
              <textarea
                value={translations[activeLanguage]?.description || ''}
                onChange={(e) => updateTranslationField(activeLanguage, 'description', e.target.value)}
                className="input-glass min-h-[100px] resize-none"
                placeholder={t('generalInfo')}
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('aroma')}
              </label>
              <textarea
                value={translations[activeLanguage]?.aroma || ''}
                onChange={(e) => updateTranslationField(activeLanguage, 'aroma', e.target.value)}
                className="input-glass min-h-[80px] resize-none"
                placeholder={t('describeAroma')}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('taste')}
              </label>
              <textarea
                value={translations[activeLanguage]?.taste || ''}
                onChange={(e) => updateTranslationField(activeLanguage, 'taste', e.target.value)}
                className="input-glass min-h-[80px] resize-none"
                placeholder={t('describeTaste')}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('finish')}
              </label>
              <textarea
                value={translations[activeLanguage]?.finish || ''}
                onChange={(e) => updateTranslationField(activeLanguage, 'finish', e.target.value)}
                className="input-glass min-h-[80px] resize-none"
                placeholder={t('describeFinish')}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => handleSave(activeLanguage)}
            disabled={savingLanguages.has(activeLanguage) || !translations[activeLanguage]?.name?.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {savingLanguages.has(activeLanguage) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {activeLanguage.toUpperCase()} {t('save')}
          </button>
        </div>

        {/* Completion Status */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="text-xs text-slate-400 mb-2">{t('translationStatus')}:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {languages.map((lang) => {
              const status = getCompletionStatus(lang.code)
              return (
                <div key={lang.code} className="flex items-center gap-1">
                  {getStatusIcon(lang.code)}
                  <span>{lang.flag} {lang.code.toUpperCase()}</span>
                  <span className={`
                    ${status === 'complete' ? 'text-green-400' : 
                      status === 'partial' ? 'text-yellow-400' : 'text-red-400'}
                  `}>
                    {status === 'complete' ? t('complete') : 
                     status === 'partial' ? t('partial') : t('missing')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}