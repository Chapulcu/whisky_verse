import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Star, 
  Check, 
  Zap, 
  Users, 
  Calendar, 
  Wine,
  CreditCard,
  Shield,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Plan {
  id: number
  price_id: string
  plan_type: string
  price: number
  monthly_limit: number
}

interface Subscription {
  id: number
  stripe_subscription_id: string
  status: string
  wverse_plans: Plan
}

export function UpgradePage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  const PLAN_FEATURES = {
    vip: [
      'Sınırsız viski koleksiyonu',
      'Özel VIP etkinliklere katılım',
      'Premium viski önerileri',
      'Detaylı analitik raporlar',
      'VIP rozetleri ve statü',
      'Öncelikli destek'
    ],
    premium_vip: [
      'Tüm VIP özellikler',
      'Özel grup oluşturma',
      'Etkinlik planlama araçları',
      'Gelişmiş filtreleme seçenekleri',
      'CSV export/import yetkisi',
      'Premium rozetler ve unvanlar',
      '7/24 premium destek'
    ]
  }

  const loadPlansAndSubscription = async () => {
    try {
      // Load plans
      const { data: plansData, error: plansError } = await supabase
        .from('wverse_plans')
        .select('*')
        .order('price')
      
      if (plansError) throw plansError
      setPlans(plansData || [])

      // Load user subscription if logged in
      if (user) {
        const { data: subData, error: subError } = await supabase
          .from('wverse_subscriptions')
          .select(`
            *,
            wverse_plans!price_id(
              id,
              price_id,
              plan_type,
              price,
              monthly_limit
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
        
        if (subError && subError.code !== 'PGRST116') {
          throw subError
        }
        
        setSubscription(subData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Planlar yüklenirken hata oluştu')
    } finally {
      setPageLoading(false)
    }
  }

  const handlePaymentResult = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const subscriptionStatus = urlParams.get('subscription')

    if (subscriptionStatus === 'success') {
      toast.success('🎉 VIP üyeliğiniz başarıyla aktifleştirildi!')
      window.history.replaceState({}, document.title, window.location.pathname)
      
      setTimeout(() => {
        loadPlansAndSubscription()
      }, 2000)
    } else if (subscriptionStatus === 'cancelled') {
      toast.error('Ödeme iptal edildi. İstediğiniz zaman tekrar deneyebilirsiniz!')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  useEffect(() => {
    loadPlansAndSubscription()
    handlePaymentResult()
  }, [user])

  const handleSubscribe = async (planType: string) => {
    if (!user) {
      toast.error('VIP üyelik için giriş yapmalısınız')
      return
    }

    if (subscription) {
      toast.error('Zaten aktif bir üyeliğiniz bulunuyor')
      return
    }

    setLoading(planType)

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType,
          customerEmail: user.email
        }
      })

      if (error) throw error

      if (data?.data?.checkoutUrl) {
        toast.success('Ödeme sayfasına yönlendiriliyorsunuz...')
        window.location.href = data.data.checkoutUrl
      } else {
        throw new Error('Checkout URL alınamadı')
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      toast.error(error.message || 'Üyelik oluşturulurken hata oluştu')
    } finally {
      setLoading(null)
    }
  }

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`
  }

  if (pageLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-whiskey-amber border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-4">
            VIP Üyelik Planları
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            WhiskyVerse'te premium deneyimi yaşayın ve viski tutkularınızı 
            bir üst seviyeye taşıyın
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <div className="glass-strong rounded-2xl p-6 mb-8 border-2 border-whiskey-gold/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-whiskey-gold to-whiskey-amber rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-whiskey-gold mb-1">
                  Aktif VIP Üyeliğiniz
                </h3>
                <p className="text-text-secondary">
                  {subscription.wverse_plans.plan_type === 'vip' ? 'VIP Üyelik' : 'Premium VIP'} planınız aktif
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-whiskey-gold">
                  {formatPrice(subscription.wverse_plans.price)}/ay
                </p>
                <p className="text-xs text-text-secondary">
                  Aylık limit: {subscription.wverse_plans.monthly_limit}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan, index) => {
            const isCurrentPlan = subscription?.wverse_plans.plan_type === plan.plan_type
            const isPremium = plan.plan_type === 'premium_vip'
            const features = PLAN_FEATURES[plan.plan_type as keyof typeof PLAN_FEATURES] || []

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-strong rounded-2xl p-8 relative overflow-hidden ${
                  isPremium ? 'border-2 border-whiskey-gold/50' : ''
                }`}
              >
                {isPremium && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-whiskey-gold to-whiskey-amber text-white px-4 py-1 rounded-bl-lg">
                    <Star className="w-4 h-4 inline mr-1" />
                    En Popüler
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isPremium 
                      ? 'bg-gradient-to-r from-whiskey-gold to-whiskey-amber' 
                      : 'bg-gradient-to-r from-whiskey-bronze to-whiskey-amber'
                  }`}>
                    {isPremium ? (
                      <Zap className="w-8 h-8 text-white" />
                    ) : (
                      <Crown className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">
                    {plan.plan_type === 'vip' ? 'VIP Üyelik' : 'Premium VIP'}
                  </h3>
                  
                  <div className="text-4xl font-bold text-gradient mb-1">
                    {formatPrice(plan.price)}
                  </div>
                  
                  <p className="text-text-secondary">
                    /ay • Aylık {plan.monthly_limit} işlem
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-whiskey-amber/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-whiskey-amber" />
                      </div>
                      <span className="text-text-primary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.plan_type)}
                  disabled={loading === plan.plan_type || isCurrentPlan || !user}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isPremium
                      ? 'bg-gradient-to-r from-whiskey-gold to-whiskey-amber text-white hover:shadow-lg hover:scale-105'
                      : 'btn-primary'
                  }`}
                >
                  {loading === plan.plan_type ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      İşlem Yapılıyor...
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <Shield className="w-4 h-4" />
                      Aktif Plan
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      {isPremium ? 'Premium VIP Ol' : 'VIP Ol'}
                    </>
                  )}
                </button>

                {!user && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-text-secondary">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-whiskey-amber" />
                    <p>VIP üyelik için önce giriş yapmalısınız</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Benefits Section */}
        <div className="glass-strong rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">VIP Üyelik Avantajları</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-whiskey-amber/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-whiskey-amber" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Özel Topluluk</h3>
              <p className="text-text-secondary text-sm">
                VIP üyeler için özel gruplar ve etkinlikler. 
                Diğer viski tutkunları ile bağlantı kurun.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-whiskey-bronze/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-whiskey-bronze" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Özel Etkinlikler</h3>
              <p className="text-text-secondary text-sm">
                VIP sadece tadım etkinlikleri, masterclass'lar ve 
                özel sürüm viski lansmanları.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-whiskey-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wine className="w-8 h-8 text-whiskey-gold-dark" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium İçerik</h3>
              <p className="text-text-secondary text-sm">
                Detaylı viski analizleri, uzman tavsiyeleri ve 
                kişiselleştirilmiş öneriler.
              </p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="text-center mt-8">
          <p className="text-xs text-text-secondary">
            🔒 Tüm ödemeler Stripe ile güvenli şekilde işlenir. 
            Kredi kartı bilgileriniz saklanmaz.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
