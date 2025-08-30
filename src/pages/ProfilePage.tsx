import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useAvatarUpload } from '@/hooks/useAvatarUpload'
import { User, Mail, Calendar, Crown, Settings, Camera, Upload, X } from 'lucide-react'
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
      toast.error('İsim alanı boş bırakılamaz')
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
      toast.success('Profil başarıyla güncellendi')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Profil güncellenirken hata oluştu')
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
    if (file) {
      try {
        await uploadAvatar(file)
      } catch (error) {
        // Error already handled in hook
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getRoleBadge = () => {
    if (!profile) return null
    
    switch (profile.role) {
      case 'vip':
        return (
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <Crown className="w-4 h-4" />
            <span>VIP Üye</span>
          </div>
        )
      case 'admin':
        return (
          <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <Settings className="w-4 h-4" />
            <span>Yönetici</span>
          </div>
        )
      default:
        return (
          <div className="bg-slate-500/20 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-sm">
            Standart Üye
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-lg font-medium">Profil yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lütfen giriş yapın</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-6 shadow-xl">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group">
              <div 
                className={`w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isUploading ? 'opacity-50' : 'group-hover:scale-105'
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
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              
              <button 
                className={`absolute bottom-0 right-0 bg-white/20 backdrop-blur-sm border border-white/30 p-2 rounded-full transition-all duration-200 ${
                  isUploading 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'hover:bg-white/30 hover:scale-110'
                }`}
                onClick={handleAvatarClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
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
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-2">
                {profile?.full_name || 'Kullanıcı'}
              </h1>
              
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {getRoleBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Kişisel Bilgiler</h2>
            
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  İptal
                </button>
              )}
              
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : isEditing ? (
                  <Upload className="w-4 h-4" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                {isSaving ? 'Kaydediliyor...' : isEditing ? 'Kaydet' : 'Düzenle'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Ad Soyad
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Adınızı ve soyadınızı girin"
                />
              ) : (
                <p className="text-slate-800 dark:text-slate-200 py-3">
                  {profile?.full_name || 'Belirtilmemiş'}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                E-posta Adresi
              </label>
              <p className="text-slate-800 dark:text-slate-200 py-3">{user.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                E-posta adresi değiştirilemez
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Dil Tercihi
              </label>
              {isEditing ? (
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as 'tr' | 'en' }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              ) : (
                <p className="text-slate-800 dark:text-slate-200 py-3">
                  {profile?.language === 'tr' ? 'Türkçe' : 'English'}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Hakkımda
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-none"
                  placeholder="Kendiniz hakkında birkaç cümle yazın..."
                  rows={4}
                />
              ) : (
                <p className="text-slate-800 dark:text-slate-200 py-3">
                  {(profile as any)?.bio || 'Belirtilmemiş'}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Konum
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Şehir, ülke"
                />
              ) : (
                <p className="text-slate-800 dark:text-slate-200 py-3">
                  {(profile as any)?.location || 'Belirtilmemiş'}
                </p>
              )}
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Doğum Tarihi
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  max={new Date().toISOString().split('T')[0]}
                />
              ) : (
                <p className="text-slate-800 dark:text-slate-200 py-3">
                  {(profile as any)?.birth_date 
                    ? new Date((profile as any).birth_date).toLocaleDateString('tr-TR') 
                    : 'Belirtilmemiş'
                  }
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Telefon
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="+90 5XX XXX XX XX"
                />
              ) : (
                <p className="text-slate-800 dark:text-slate-200 py-3">
                  {(profile as any)?.phone || 'Belirtilmemiş'}
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Website
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://example.com"
                />
              ) : (
                <p className="text-slate-800 dark:text-slate-200 py-3">
                  {(profile as any)?.website ? (
                    <a 
                      href={(profile as any).website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:text-amber-600 underline"
                    >
                      {(profile as any).website}
                    </a>
                  ) : (
                    'Belirtilmemiş'
                  )}
                </p>
              )}
            </div>

            {/* Privacy Settings */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Gizlilik Ayarları
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">Bildirimler</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferences.notifications}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: e.target.checked
                          }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <span className="block text-slate-700 dark:text-slate-300 mb-2">Profil Görünürlüğü</span>
                    <select
                      value={formData.preferences.privacy}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          privacy: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="public">Herkese Açık</option>
                      <option value="friends">Sadece Arkadaşlar</option>
                      <option value="private">Özel</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Üyelik Durumu
              </label>
              <div className="py-3">
                {getRoleBadge()}
              </div>
            </div>

            {/* Registration Date */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Üyelik Tarihi
              </label>
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 py-3">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(user.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
