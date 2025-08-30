import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wine, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export function AuthPage() {
  const { t } = useTranslation()
  const { user, signIn, signUp, resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })

  // Check for error in URL params
  React.useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast.error(decodeURIComponent(error))
    }
  }, [searchParams])

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast.error(t('email') + ' ve ' + t('password') + ' gereklidir')
      return false
    }

    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return false
    }

    if (isSignUp) {
      if (!formData.fullName) {
        toast.error(t('fullName') + ' gereklidir')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Şifreler eşleşmiyor')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (showForgotPassword) {
      // Handle forgot password
      if (!formData.email) {
        toast.error('E-posta adresi gereklidir')
        return
      }
      
      setLoading(true)
      try {
        const { error } = await resetPassword(formData.email)
        if (error) {
          throw error
        }
        toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!')
        // For testing: show reset password link
        toast.success(`Test için: ${window.location.origin}/reset-password#access_token=test&type=recovery&refresh_token=test`, {
          duration: 10000
        })
        setShowForgotPassword(false)
      } catch (error: any) {
        console.error('Password reset error:', error)
        toast.error(error.message || 'Şifre sıfırlama bağlantısı gönderilemedi')
      } finally {
        setLoading(false)
      }
      return
    }
    
    if (!validateForm()) return

    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) {
          throw error
        }
        toast.success('Kayıt başarılı! E-posta adresinizi kontrol edin.')
      } else {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          throw error
        }
        toast.success('Giriş başarılı!')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || 'Bir hata oluştu')
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
                <Wine className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-cyber font-bold text-gradient mb-2">
              {showForgotPassword ? 'Şifre Sıfırlama' : isSignUp ? t('signUp') : t('signIn')}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {showForgotPassword 
                ? 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim'
                : isSignUp 
                  ? 'WhiskyVerse topluluğuna katılın'
                  : 'Hesabınıza giriş yapın'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="form-container">
            {/* Full Name (Sign Up only) */}
            {isSignUp && !showForgotPassword && (
              <div className="form-group">
                <label className="form-label">
                  {t('fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-whiskey-bronze dark:text-whiskey-amber/70" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input-field pl-14"
                    placeholder="Adınız ve soyadınız"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-whiskey-bronze dark:text-whiskey-amber/70" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field pl-14"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            {/* Password (not shown in forgot password mode) */}
            {!showForgotPassword && (
              <div className="form-group">
                <label className="form-label">
                  {t('password')}
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
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && !showForgotPassword && (
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
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

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
                  {showForgotPassword ? (
                    <>
                      <Mail className="w-5 h-5" />
                      Şifre Sıfırlama Bağlantısı Gönder
                    </>
                  ) : isSignUp ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {t('signUp')}
                    </>
                  ) : (
                    <>
                      <Wine className="w-5 h-5" />
                      {t('signIn')}
                    </>
                  )}
                </>
              )}
            </button>
            
            {/* Forgot Password Link (only in sign in mode) */}
            {!isSignUp && !showForgotPassword && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  Şifremi Unuttum
                </button>
              </div>
            )}
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            {showForgotPassword ? (
              <>
                <p className="text-slate-600 dark:text-slate-300">
                  Giriş sayfasına dönmek ister misiniz?
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setFormData({ email: '', password: '', fullName: '', confirmPassword: '' })
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  Giriş Yap
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-600 dark:text-slate-300">
                  {isSignUp ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}
                </p>
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setFormData({ email: '', password: '', fullName: '', confirmPassword: '' })
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  {isSignUp ? t('signIn') : t('signUp')}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}