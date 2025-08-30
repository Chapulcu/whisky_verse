import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'tr', // default language
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    resources: {
      tr: {
        translation: {
          // Navigation
          home: 'Ana Sayfa',
          whiskies: 'Viskiler',
          myCollection: 'Koleksiyonum',
          groups: 'Gruplar',
          events: 'Etkinlikler',
          profile: 'Profil',
          
          // Auth
          signIn: 'Giriş Yap',
          signUp: 'Kayıt Ol',
          signOut: 'Çıkış Yap',
          email: 'E-posta',
          password: 'Şifre',
          fullName: 'Ad Soyad',
          
          // Whisky
          whiskyName: 'Viski Adı',
          whiskyType: 'Tip',
          country: 'Ülke',
          region: 'Bölge',
          alcoholPercentage: 'Alkol Oranı',
          color: 'Renk',
          aroma: 'Koku',
          taste: 'Damak Tadı',
          finish: 'Bitiş',
          description: 'Açıklama',
          
          // Actions
          addToCollection: 'Koleksiyona Ekle',
          markAsTasted: 'Tadıldı Olarak İşaretle',
          rate: 'Puanla',
          save: 'Kaydet',
          cancel: 'İptal',
          delete: 'Sil',
          edit: 'Düzenle',
          
          // VIP Features
          upgradeToVip: 'VIP Üyeliğe Geç',
          createGroup: 'Grup Oluştur',
          organizeEvent: 'Etkinlik Düzenle',
          
          // Theme
          darkMode: 'Koyu Mod',
          lightMode: 'Açık Mod',
          systemMode: 'Sistem Modu',
          
          // Language
          language: 'Dil',
          turkish: 'Türkçe',
          english: 'English',
          
          // Profile Page
          pleaseSignIn: 'Lütfen giriş yapın',
          user: 'Kullanıcı',
          vipMember: 'VIP Üye',
          admin: 'Yönetici',
          standardUser: 'Standart Kullanıcı',
          personalInformation: 'Kişisel Bilgiler',
          notProvided: 'Belirtilmemiş',
          emailCannotBeChanged: 'E-posta adresi değiştirilemez',
          memberSince: 'Üyelik Tarihi',
          
          // Admin & Whisky
          adminPanel: 'Admin Paneli',
          whiskyManagement: 'Viski Yönetimi',
          userManagement: 'Kullanıcı Yönetimi',
          addWhisky: 'Viski Ekle',
          editWhisky: 'Viski Düzenle',
          deleteWhisky: 'Viski Sil',
          whiskyCollection: 'Viski Koleksiyonu',
          
          // Translation Manager
          translationManagement: 'Çeviri Yönetimi',
          saveAll: 'Tümünü Kaydet',
          translationsLoading: 'Çeviriler yükleniyor...',
          whiskyNameRequired: 'Viski adı gereklidir',
          complete: 'Tam',
          partial: 'Kısmi',
          missing: 'Eksik',
          translationStatus: 'Çeviri Durumu',
          enterWhiskyName: 'Viski adını girin...',
          exampleType: 'Örn: Single Malt, Blended...',
          exampleColor: 'Örn: Koyu kehribar...',
          generalDescription: 'Genel Açıklama',
          generalInfo: 'Viski hakkında genel bilgiler...',
          describeAroma: 'Aroma notlarını açıklayın...',
          describeTaste: 'Tat notlarını açıklayın...',
          describeFinish: 'Final notlarını açıklayın...'
        }
      },
      en: {
        translation: {
          // Navigation
          home: 'Home',
          whiskies: 'Whiskies',
          myCollection: 'My Collection',
          groups: 'Groups',
          events: 'Events',
          profile: 'Profile',
          
          // Auth
          signIn: 'Sign In',
          signUp: 'Sign Up',
          signOut: 'Sign Out',
          email: 'Email',
          password: 'Password',
          fullName: 'Full Name',
          
          // Whisky
          whiskyName: 'Whisky Name',
          whiskyType: 'Type',
          country: 'Country',
          region: 'Region',
          alcoholPercentage: 'Alcohol Percentage',
          color: 'Color',
          aroma: 'Aroma',
          taste: 'Taste',
          finish: 'Finish',
          description: 'Description',
          
          // Actions
          addToCollection: 'Add to Collection',
          markAsTasted: 'Mark as Tasted',
          rate: 'Rate',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          
          // VIP Features
          upgradeToVip: 'Upgrade to VIP',
          createGroup: 'Create Group',
          organizeEvent: 'Organize Event',
          
          // Theme
          darkMode: 'Dark Mode',
          lightMode: 'Light Mode',
          systemMode: 'System Mode',
          
          // Language
          language: 'Language',
          turkish: 'Türkçe',
          english: 'English',
          
          // Profile Page
          pleaseSignIn: 'Please sign in',
          user: 'User',
          vipMember: 'VIP Member',
          admin: 'Administrator',
          standardUser: 'Standard User',
          personalInformation: 'Personal Information',
          notProvided: 'Not provided',
          emailCannotBeChanged: 'Email address cannot be changed',
          memberSince: 'Member since',
          
          // Admin & Whisky
          adminPanel: 'Admin Panel',
          whiskyManagement: 'Whisky Management',
          userManagement: 'User Management',
          addWhisky: 'Add Whisky',
          editWhisky: 'Edit Whisky',
          deleteWhisky: 'Delete Whisky',
          whiskyCollection: 'Whisky Collection',
          
          // Translation Manager
          translationManagement: 'Translation Management',
          saveAll: 'Save All',
          translationsLoading: 'Loading translations...',
          whiskyNameRequired: 'Whisky name is required',
          complete: 'Complete',
          partial: 'Partial',
          missing: 'Missing',
          translationStatus: 'Translation Status',
          enterWhiskyName: 'Enter whisky name...',
          exampleType: 'e.g: Single Malt, Blended...',
          exampleColor: 'e.g: Dark amber...',
          generalDescription: 'General Description',
          generalInfo: 'General information about the whisky...',
          describeAroma: 'Describe aroma notes...',
          describeTaste: 'Describe taste notes...',
          describeFinish: 'Describe finish notes...'
        }
      }
    }
  })

export default i18n