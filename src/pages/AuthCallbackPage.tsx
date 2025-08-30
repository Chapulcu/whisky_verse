import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wine, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL
        const currentUrl = window.location.href
        
        // Check if there's a hash fragment (from email links)
        const hashFragment = window.location.hash
        
        // Check for access_token in URL params or hash
        const accessToken = searchParams.get('access_token') || 
                           new URLSearchParams(hashFragment.substring(1)).get('access_token')
        
        const refreshToken = searchParams.get('refresh_token') ||
                            new URLSearchParams(hashFragment.substring(1)).get('refresh_token')
        
        const error = searchParams.get('error') ||
                     new URLSearchParams(hashFragment.substring(1)).get('error')
        
        const errorDescription = searchParams.get('error_description') ||
                                new URLSearchParams(hashFragment.substring(1)).get('error_description')

        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          toast.error(errorDescription || 'Kimlik doğrulama başarısız')
          navigate('/auth?error=' + encodeURIComponent(errorDescription || error))
          return
        }

        if (accessToken && refreshToken) {
          // Set the session manually
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            toast.error('Oturum oluşturulamadı')
            navigate('/auth')
            return
          }

          if (data.user) {
            toast.success('Başarıyla giriş yapıldı!')
            navigate('/')
            return
          }
        }

        // If no tokens but also no error, try to get current session
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('User error:', userError)
          toast.error('Kullanıcı bilgileri alınamadı')
          navigate('/auth')
          return
        }

        if (user) {
          toast.success('Başarıyla giriş yapıldı!')
          navigate('/')
        } else {
          // No user found, redirect to auth
          navigate('/auth')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Kimlik doğrulama sırasında hata oluştu')
        navigate('/auth')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card-strong text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
            <Wine className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="loading-spinner w-8 h-8 text-primary-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            Giriş İşlemi Tamamlanıyor...
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Hesabınıza erişim sağlanıyor, lütfen bekleyin.
          </p>
        </div>
      </motion.div>
    </div>
  )
}