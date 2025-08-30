import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wine, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const { user, updatePassword } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  // Check for access token in URL (from email link) - check both query params and hash
  useEffect(() => {
    // Check query params
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')
    
    // Check URL hash (Supabase might send tokens in hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hashAccessToken = hashParams.get('access_token')
    const hashRefreshToken = hashParams.get('refresh_token')
    const hashType = hashParams.get('type')
    
    console.log('Reset password page params:', { 
      query: { accessToken: !!accessToken, refreshToken: !!refreshToken, type },
      hash: { accessToken: !!hashAccessToken, refreshToken: !!hashRefreshToken, type: hashType }
    })

    const finalType = type || hashType
    const finalAccessToken = accessToken || hashAccessToken
    const finalRefreshToken = refreshToken || hashRefreshToken

    if (finalType === 'recovery' && finalAccessToken && finalRefreshToken) {
      console.log('✅ Password reset link detected, user should be authenticated')
    } else {
      console.log('❌ Invalid reset link or missing parameters')
    }
  }, [searchParams])

  // Don't redirect immediately if we have reset parameters
  const checkResetParams = () => {
    // Check query params
    const queryType = searchParams.get('type')
    const queryAccess = searchParams.get('access_token')
    const queryRefresh = searchParams.get('refresh_token')
    
    // Check URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hashType = hashParams.get('type')
    const hashAccess = hashParams.get('access_token')
    const hashRefresh = hashParams.get('refresh_token')
    
    const finalType = queryType || hashType
    const finalAccess = queryAccess || hashAccess
    const finalRefresh = queryRefresh || hashRefresh
    
    return finalType === 'recovery' && finalAccess && finalRefresh
  }
  
  const hasResetParams = checkResetParams()

  // Only redirect if no reset params and no user
  if (!user && !hasResetParams) {
    return <Navigate to="/auth" replace />
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Tüm alanlar gereklidir')
      return false
    }

    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const { error } = await updatePassword(formData.password)
      if (error) {
        throw error
      }
      toast.success('Şifreniz başarıyla güncellendi!')
      // Redirect to home after 2 seconds
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error: any) {
      console.error('Password update error:', error)
      toast.error(error.message || 'Şifre güncellenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="card-strong">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-cyber font-bold text-gradient mb-2">
              Yeni Şifre Belirle
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Hesabınız için yeni bir şifre belirleyin
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="form-container">
            {/* New Password */}
            <div className="form-group">
              <label className="form-label">
                Yeni Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-whiskey-bronze dark:text-whiskey-amber/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field pl-14 pr-14"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-whiskey-bronze dark:text-whiskey-amber hover:text-whiskey-bronze-dark dark:hover:text-whiskey-amber-light transition-colors"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">En az 6 karakter</p>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">
                Şifre Tekrarı
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-whiskey-bronze dark:text-whiskey-amber/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-field pl-14"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Şifreyi Güncelle
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-300">
              Giriş sayfasına dönmek ister misiniz?
            </p>
            <a
              href="/auth"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              Giriş Yap
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}