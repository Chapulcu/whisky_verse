import React, { useState, useEffect, useRef } from 'react'
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
  Palette
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, profile, updateProfile, loading } = useAuth()
  const { uploadAvatar, isUploading } = useAvatarUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    language: 'tr' as 'tr' | 'en',
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

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        language: profile.language || 'tr',
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
      language: profile?.language || 'tr',
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
    if (!profile?.role) return null
    
    switch (profile.role) {
      case 'vip':
        return (
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <Crown className="w-4 h-4" />
            <span>{t('vipMember')}</span>
          </div>
        )
      case 'admin':
        return (
          <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <Settings className="w-4 h-4" />
            <span>{t('profilePage.adminBadge')}</span>
          </div>
        )
      default:
        return (
          <div className="bg-slate-500/20 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-sm">
            {t('profilePage.memberBadge')}
          </div>
        )
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {t('profilePage.title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {t('profilePage.subtitle')}
            </p>
          </div>

          {/* Profile Card */}
          <div className="glass rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Avatar Section */}
              <div className="flex-shrink-0 text-center lg:text-left">
                <div className="relative inline-block group">
                  <div 
                    className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                      isUploading ? 'opacity-50' : 'group-hover:scale-105 group-hover:shadow-lg'
                    }`}
                    onClick={handleAvatarClick}
                  >
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                    )}
                  </div>
                  
                  <button 
                    className={`absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 p-2 rounded-full transition-all duration-300 ${
                      isUploading 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110'
                    }`}
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                    ) : (
                      <Camera className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                      {profile?.full_name || t('user')}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mt-1">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{t('profilePage.joinDate')}: {formatDate(profile?.created_at || null)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    {getRoleBadge()}
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      {isEditing ? t('profilePage.closeEditButton') : t('profilePage.editButton')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                {t('profilePage.personalInfo')}
              </h3>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ad Soyad
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="input-glass w-full"
                      placeholder={t('profilePage.forms.fullNamePlaceholder')}
                    />
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      {profile?.full_name || t('profilePage.placeholders.notSpecified')}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Biyografi
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="input-glass w-full h-20 resize-none"
                      placeholder={t('profilePage.forms.bioPlaceholder')}
                    />
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      {(profile as any)?.bio || t('profilePage.placeholders.bioNotAdded')}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Konum
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="input-glass w-full"
                      placeholder={t('profilePage.forms.locationPlaceholder')}
                    />
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      {(profile as any)?.location || t('profilePage.placeholders.notSpecified')}
                    </p>
                  )}
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('profilePage.forms.birthDate')}
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                      className="input-glass w-full"
                    />
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      {formatDate((profile as any)?.birth_date)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-500" />
                {t('profilePage.contactInfo')}
              </h3>
              
              <div className="space-y-4">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    E-posta Adresi
                  </label>
                  <p className="text-slate-600 dark:text-slate-400">
                    {user.email}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('profilePage.placeholders.emailCannotChange')}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefon
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input-glass w-full"
                      placeholder="+90 555 123 45 67"
                    />
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      {(profile as any)?.phone || t('profilePage.placeholders.notSpecified')}
                    </p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Web Sitesi
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="input-glass w-full"
                      placeholder="https://example.com"
                    />
                  ) : (
                    <div>
                      {(profile as any)?.website ? (
                        <a 
                          href={(profile as any).website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:text-primary-600 underline"
                        >
                          {(profile as any).website}
                        </a>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-400">{t('profilePage.placeholders.notSpecified')}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tercih Edilen Dil
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as 'tr' | 'en' }))}
                      className="input-glass w-full"
                    >
                      <option value="tr">{t('profilePage.forms.turkish')}</option>
                      <option value="en">English</option>
                    </select>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      {profile?.language === 'tr' ? t('profilePage.forms.turkish') : t('profilePage.forms.english')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-500 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                {t('profilePage.buttons.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('profilePage.buttons.saveChanges')}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}