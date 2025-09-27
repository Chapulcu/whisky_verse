import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useAvatarUpload } from '@/hooks/useAvatarUpload'
import {
  User,
  Mail,
  Calendar,
  Crown,
  Settings,
  Camera,
  Upload,
  X,
  Edit3,
  Save,
  MapPin,
  Phone,
  Globe,
  Info,
  Bell,
  Lock,
  Palette,
  Trophy,
  Award
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useDbAchievements } from '@/hooks/useDbAchievements'
import { AchievementModal } from '@/components/AchievementModal'
import { MigrationModal } from '@/components/MigrationModal'
import { checkMigrationOnAppStart, migrateLocalStorageData, markMigrationDone } from '@/utils/migrateAchievements'
import { AppLanguage } from '@/hooks/useWhiskiesMultilingual'
import { AchievementsPanel } from '@/components/mobile/AchievementsPanel'
import { QRCodeModal, QRCodeData } from '@/components/mobile/QRCodeModal'
import toast from 'react-hot-toast'

const SUPPORTED_LANGUAGES: AppLanguage[] = ['tr', 'en', 'ru', 'bg']

const ensureLanguage = (value: string | null | undefined): AppLanguage => {
  const normalized = (value || '').toLowerCase() as AppLanguage
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : 'tr'
}

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, profile, updateProfile, loading } = useAuth()
  const { uploadAvatar, isUploading } = useAvatarUpload()
  const {
    unlockedAchievements,
    totalPoints,
    level,
    recordLogin,
    totalAchievements,
    isLoading: achievementsLoading,
    newAchievement,
    showAchievementModal,
    closeAchievementModal,
    loadUserData
  } = useDbAchievements()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    language: 'tr' as AppLanguage,
    bio: '',
    location: '',
    birth_date: '',
    phone: '',
    website: '',
    preferences: {
      notifications: true,
      privacy: 'public',
      theme: 'system'
    }
  })

  const languageLabels = useMemo<Record<AppLanguage, string>>(() => ({
    tr: t('profilePage.forms.turkish'),
    en: t('profilePage.forms.english'),
    ru: t('profilePage.forms.russian'),
    bg: t('profilePage.forms.bulgarian')
  }), [t])

  const glassBackdrop = 'relative overflow-hidden rounded-3xl border border-white/30 bg-white/80 dark:bg-white/5 backdrop-blur-2xl shadow-[0_35px_85px_-35px_rgba(15,23,42,0.65)]'
  const glassSection = 'relative rounded-2xl border border-white/25 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-[0_30px_70px_-40px_rgba(15,23,42,0.6)]'
  const glassInput = 'w-full rounded-2xl border border-white/30 bg-white/80 dark:bg-white/10 px-4 py-3 text-slate-700 dark:text-slate-100 placeholder:text-slate-500/70 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent backdrop-blur'
  const glassTextarea = `${glassInput} h-24 resize-none`
  const glassChip = 'inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 dark:text-white/75 backdrop-blur shadow-[0_20px_45px_-30px_rgba(15,23,42,0.7)]'
  const glassButton = 'inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-white/80 backdrop-blur transition hover:bg-white/60 dark:hover:bg-white/20 shadow-[0_22px_45px_-25px_rgba(15,23,42,0.65)]'
  const primaryButton = 'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_55px_-15px_rgba(249,115,22,0.6)] transition hover:shadow-[0_25px_60px_-10px_rgba(249,115,22,0.55)]'

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        language: ensureLanguage((profile as any).language),
        bio: (profile as any).bio || '',
        location: (profile as any).location || '',
        birth_date: (profile as any).birth_date || '',
        phone: (profile as any).phone || '',
        website: (profile as any).website || '',
        preferences: (profile as any).preferences || {
          notifications: true,
          privacy: 'public',
          theme: 'system'
        }
      })
    }
  }, [profile])

  // Check for migration needs when user loads
  useEffect(() => {
    if (!user || achievementsLoading) {
      return
    }

    if (checkMigrationOnAppStart(user.id)) {
      const timer = setTimeout(() => {
        setShowMigrationModal(true)
      }, 2000)

      return () => clearTimeout(timer)
    }

    recordLogin()
  }, [user, achievementsLoading, recordLogin])

  // Handle migration confirmation
  const handleMigrationConfirm = async () => {
    if (!user) return

    setShowMigrationModal(false)

    // Show loading toast
    const loadingToast = toast.loading('🔄 Başarımlar veritabanına taşınıyor...', {
      duration: 0, // Don't auto-dismiss
    })

    try {
      const result = await migrateLocalStorageData(user.id)

      toast.dismiss(loadingToast)

      if (result.success) {
        let message = '🎉 Başarımlar başarıyla taşındı!\n\n'

        if (result.progressMigrated) {
          message += '📊 Progress verileri taşındı\n'
        }

        if (result.achievementsMigrated > 0) {
          message += `🏆 ${result.achievementsMigrated} başarım taşındı\n`
        }

        toast.success(message, {
          duration: 6000,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600'
          }
        })

        markMigrationDone(user.id)
        await loadUserData()
      } else {
        toast.error(`❌ Migration başarısız: ${result.error || 'Bilinmeyen hata'}`, {
          duration: 5000
        })
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('❌ Migration sırasında hata oluştu', {
        duration: 5000
      })
      console.error('Migration error:', error)
    }
  }

  const handleMigrationCancel = () => {
    setShowMigrationModal(false)
  }

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error(t('profilePage.toasts.nameRequired'))
      return
    }

    setIsSaving(true)
    try {
      await updateProfile({
        full_name: formData.full_name.trim(),
        language: formData.language,
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null,
        birth_date: formData.birth_date || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        preferences: formData.preferences
      } as any)
      setIsEditing(false)
      toast.success(t('profilePage.toasts.profileUpdated'))
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || t('profilePage.toasts.profileUpdateError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      language: ensureLanguage(profile?.language),
      bio: (profile as any)?.bio || '',
      location: (profile as any)?.location || '',
      birth_date: (profile as any)?.birth_date || '',
      phone: (profile as any)?.phone || '',
      website: (profile as any)?.website || '',
      preferences: (profile as any)?.preferences || {
        notifications: true,
        privacy: 'public',
        theme: 'system'
      }
    })
    setIsEditing(false)
  }

  const handleAvatarClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const avatarUrl = await uploadAvatar(file)
      await updateProfile({ avatar_url: avatarUrl } as any)
      toast.success(t('profilePage.toasts.avatarUpdated'))
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(t('profilePage.toasts.avatarUploadError'))
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('profilePage.placeholders.notSpecified')
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  const getRoleBadge = () => {
    if (!profile?.role) {
      return (
        <span className={`${glassChip} text-slate-700 dark:text-white/80`}>{t('profilePage.memberBadge')}</span>
      )
    }

    if (profile.role === 'vip') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_18px_40px_-20px_rgba(249,115,22,0.6)] bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500">
          <Crown className="w-4 h-4" />
          {t('vipMember')}
        </span>
      )
    }

    if (profile.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_18px_40px_-20px_rgba(134,25,143,0.6)] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500">
          <Settings className="w-4 h-4" />
          {t('profilePage.adminBadge')}
        </span>
      )
    }

    return (
      <span className={`${glassChip} text-slate-700 dark:text-white/80`}>{t('profilePage.memberBadge')}</span>
    )
  }

  const achievementsCount = totalAchievements || unlockedAchievements.length

  const statCards = useMemo(() => (
    [
      {
        label: t('profilePage.stats.level'),
        value: level ? `Lv. ${level}` : 'Lv. 1',
        icon: Trophy,
        accent: 'from-amber-400/35 via-orange-400/20 to-transparent'
      },
      {
        label: t('profilePage.stats.achievements'),
        value: achievementsCount.toString(),
        icon: Award,
        accent: 'from-indigo-400/30 via-purple-400/20 to-transparent'
      },
      {
        label: t('profilePage.stats.points'),
        value: (totalPoints ?? 0).toString(),
        icon: Crown,
        accent: 'from-emerald-400/30 via-teal-400/20 to-transparent'
      }
    ]
  ), [achievementsCount, level, totalPoints, t])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-lg font-medium">{t('profilePage.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('profilePage.loginRequired')}</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden py-12">
      <div className="relative container mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white drop-shadow-sm">
              {t('profilePage.title')}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              {t('profilePage.subtitle')}
            </p>
          </div>

          <section className={`${glassBackdrop} p-8`}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-white/25 to-transparent dark:from-white/10 dark:via-white/10 dark:to-transparent" />
            <div className="relative flex flex-col gap-8 lg:flex-row">
              <div className="flex flex-col items-center gap-4 lg:w-1/3">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-amber-400/45 via-orange-500/25 to-purple-500/25 blur-3xl" />
                  <div
                    onClick={handleAvatarClick}
                    className={`group relative h-28 w-28 lg:h-36 lg:w-36 cursor-pointer overflow-hidden rounded-full border border-white/40 bg-white/75 dark:bg-white/10 backdrop-blur-xl shadow-[0_32px_80px_-30px_rgba(15,23,42,0.55)] transition-all duration-300 ${
                      isUploading ? 'opacity-60' : 'hover:scale-105 hover:shadow-[0_40px_90px_-30px_rgba(15,23,42,0.6)]'
                    }`}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                        <User className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/35">
                      <Camera className="h-6 w-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600/80 dark:text-white/50">
                  {t('profilePage.actions.changeAvatar')}
                </span>
              </div>

              <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                      {profile?.full_name || t('user')}
                    </h2>
                    <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </span>
                      <span className="hidden text-slate-400 sm:inline">•</span>
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('profilePage.joinDate')}: {formatDate(profile?.created_at || null)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:items-end">
                    {getRoleBadge()}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setShowQRCode(true)} className={`${glassButton} !px-4`}>
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2v-2zM15 15h2v2h-2v-2zM13 17h2v2h-2v-2zM15 19h2v2h-2v-2zM17 13h2v2h-2v-2zM19 15h2v2h-2v-2zM17 17h2v2h-2v-2zM19 19h2v2h-2v-2z" />
                        </svg>
                        {t('profilePage.actions.showQr')}
                      </button>
                      <button onClick={() => setShowAchievements(true)} className={`${glassButton} !px-4`}>
                        <Trophy className="h-4 w-4" />
                        {t('profilePage.actions.viewAchievements')}
                      </button>
                      <button onClick={() => setIsEditing(!isEditing)} className={primaryButton}>
                        <Edit3 className="h-4 w-4" />
                        {isEditing ? t('profilePage.closeEditButton') : t('profilePage.editButton')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {statCards.map(({ label, value, icon: Icon, accent }) => (
                    <div key={label} className="relative overflow-hidden rounded-2xl border border-white/25 bg-white/45 dark:bg-white/10 backdrop-blur shadow-[0_28px_75px_-38px_rgba(15,23,42,0.7)]">
                      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
                      <div className="relative flex flex-col gap-2 p-4 text-slate-800 dark:text-white">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-600/80 dark:text-white/60">
                          {label}
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={`${glassSection} p-6 space-y-5`}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <User className="h-5 w-5 text-amber-500" />
                {t('profilePage.personalInfo')}
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-600/80 dark:text-white/50">
                    {t('profilePage.forms.fullName')}
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className={glassInput}
                      placeholder={t('profilePage.forms.fullNamePlaceholder')}
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300">
                      {profile?.full_name || t('profilePage.placeholders.notSpecified')}
                    </p>
                  )}
                </div>

                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-600/80 dark:text-white/50">
                    {t('profilePage.forms.bio')}
                  </span>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className={glassTextarea}
                      placeholder={t('profilePage.forms.bioPlaceholder')}
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300">
                      {(profile as any)?.bio || t('profilePage.placeholders.bioNotAdded')}
                    </p>
                  )}
                </div>

                <div>
                  <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600/80 dark:text-white/50">
                    <MapPin className="h-4 w-4" />
                    {t('profilePage.forms.location')}
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className={glassInput}
                      placeholder={t('profilePage.forms.locationPlaceholder')}
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300">
                      {(profile as any)?.location || t('profilePage.placeholders.notSpecified')}
                    </p>
                  )}
                </div>

                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-600/80 dark:text-white/50">
                    {t('profilePage.forms.birthDate')}
                  </span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                      className={glassInput}
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300">
                      {formatDate((profile as any)?.birth_date)}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className={`${glassSection} p-6 space-y-5`}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <Mail className="h-5 w-5 text-amber-500" />
                {t('profilePage.contactInfo')}
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-600/80 dark:text-white/50">
                    {t('profilePage.forms.email')}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('profilePage.placeholders.emailCannotChange')}
                  </p>
                </div>

                <div>
                  <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600/80 dark:text-white/50">
                    <Phone className="h-4 w-4" />
                    {t('profilePage.forms.phone')}
                  </span>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={glassInput}
                      placeholder="+90 555 123 45 67"
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300">
                      {(profile as any)?.phone || t('profilePage.placeholders.notSpecified')}
                    </p>
                  )}
                </div>

                <div>
                  <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600/80 dark:text-white/50">
                    <Globe className="h-4 w-4" />
                    {t('profilePage.forms.website')}
                  </span>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className={glassInput}
                      placeholder="https://example.com"
                    />
                  ) : ( (profile as any)?.website ? (
                    <a
                      href={(profile as any).website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 underline transition hover:text-amber-500"
                    >
                      {(profile as any).website}
                    </a>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300">{t('profilePage.placeholders.notSpecified')}</p>
                  ))}
                </div>

                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-600/80 dark:text-white/50">
                    {t('profilePage.forms.language')}
                  </span>
                  {isEditing ? (
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: ensureLanguage(e.target.value) }))}
                      className={glassInput}
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>
                          {languageLabels[lang]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300">
                      {languageLabels[ensureLanguage(profile?.language)]}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className={`${glassButton} justify-center px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <X className="h-4 w-4" />
                {t('profilePage.buttons.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`${primaryButton} justify-center px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t('profilePage.buttons.saveChanges')}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Achievements Panel */}
      <AchievementsPanel
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        qrData={{
          type: 'profile',
          title: profile?.full_name || 'Profil',
          subtitle: `${profile?.full_name || 'Kullanıcı'}'nın WhiskyVerse profili`,
          data: {
            userId: user.id,
            username: profile?.full_name || 'user'
          }
        }}
      />

      {/* Achievement Modal */}
      <AchievementModal
        achievement={newAchievement}
        isOpen={showAchievementModal}
        onClose={closeAchievementModal}
      />

      {/* Migration Modal */}
      <MigrationModal
        isOpen={showMigrationModal}
        onConfirm={handleMigrationConfirm}
        onCancel={handleMigrationCancel}
      />
    </div>
  )
}
