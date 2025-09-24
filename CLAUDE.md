# 🥃 WhiskyVerse - Claude AI Assistant Configuration

Bu dosya, WhiskyVerse projesi için Claude AI asistanına önemli bilgiler ve komutlar sağlar.

## 📋 Proje Bilgileri

**Proje Adı:** WhiskyVerse - Whisky Community Platform
**Teknoloji:** React 18.3.1 + TypeScript 5.6.2 + Vite 6.0.1 + Supabase
**Geliştirici:** Talip Akhan (akhantalip@gmail.com)

## 🚀 Hızlı Komutlar

### Development
```bash
# Geliştirme sunucusunu başlat
npm run dev

# Bağımlılıkları yükle
npm install

# Lint kontrolü
npm run lint

# Build
npm run build

# Preview (build sonrası)
npm run preview
```

### Test Komutları
```bash
# Veritabanı bağlantı testi
node tests/test_connection.js

# Supabase entegrasyon testi
node tests/test-supabase.js

# Profil güncellemesi testi
node tests/test_profile_update.js

# Çeviri sistemi testi
node tests/test_translations.js
```

### Database Yönetimi
```bash
# Veritabanı kurulum
node tests/setup_database.js

# Admin kullanıcı oluştur
node tests/create_admin.js

# Örnek veri ekle
node tests/add_sample_data.js

# Veritabanı doğrula
node tests/verify_database.js
```

## 🛠️ Proje Yapısı

```
whisky-community/
├── src/                    # Kaynak kodları
│   ├── components/         # React bileşenleri
│   ├── pages/             # Sayfa bileşenleri
│   ├── hooks/             # Custom hooks
│   ├── services/          # API servisleri
│   ├── types/             # TypeScript tipleri
│   └── utils/             # Yardımcı fonksiyonlar
├── public/                # Static dosyalar
├── docs/                  # Dokümantasyon
├── tests/                 # Test dosyaları
├── sql-scripts/           # SQL scriptleri
├── deploy/                # Deployment konfigürasyonları
└── docker/                # Docker konfigürasyonları
```

## 📁 Önemli Dosyalar

- `package.json` - Proje bağımlılıkları ve scriptler
- `vite.config.ts` - Vite konfigürasyonu
- `eslint.config.js` - ESLint kuralları
- `tailwind.config.js` - Tailwind CSS konfigürasyonu
- `docker-compose.yml` - Docker production setup
- `Dockerfile` - Multi-stage production build
- `.env.example` - Environment değişkenleri şablonu

## 🔧 Environment Variables

```bash
# Gerekli environment değişkenleri (.env dosyasında)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### Docker ile Production
```bash
# Docker build ve çalıştırma
docker build -t whiskyverse .
docker run -p 3001:80 whiskyverse

# Docker Compose ile
docker-compose up -d
```

### Development Server
```bash
# Port 5173'te çalışır
npm run dev
```

## 🧪 Testing & Debugging

### Test Dosyaları Klasörü: `tests/`
- Tüm test ve debug scriptleri burada
- Veritabanı yönetim araçları
- Admin oluşturma ve yönetim scriptleri
- Bağlantı testleri

### Debugging Tools
```bash
# Database debugging
node tests/debug_database.js

# Profile debugging
node tests/debug_profile.js

# Live system debugging
node tests/debug_live_system.js
```

## 🎯 Key Features

- **Kullanıcı Yönetimi:** Kayıt, giriş, profil yönetimi
- **Viski Yönetimi:** Kapsamlı viski veritabanı ve koleksiyon
- **Admin Panel:** CRUD işlemleri, kullanıcı yönetimi
- **Çoklu Dil:** Türkçe/İngilizce desteği (i18next)
- **Responsive:** Mobile-first tasarım
- **Background System:** Dinamik arka plan yönetimi
- **Security:** Row Level Security (RLS) ile Supabase

## 💻 Tech Stack

**Frontend:**
- React 18.3.1
- TypeScript 5.6.2
- Vite 6.0.1
- Tailwind CSS 3.4.16
- Framer Motion 12.23.12
- React Router DOM 6.28.0

**Backend & Database:**
- Supabase (Backend-as-a-Service)
- PostgreSQL with RLS
- Real-time subscriptions

**Development:**
- ESLint 9.15.0
- Docker & Docker Compose
- Node.js 18+

## 📚 Dokümantasyon

Detaylı dokümantasyon `docs/` klasöründe:
- Setup rehberleri
- Deployment guides
- API reference
- Component architecture
- Troubleshooting guides

## ⚡ Claude AI Özel Notlar

- **Lint çalıştır:** Her kod değişikliğinden sonra `npm run lint` çalıştır
- **Test et:** Değişikliklerden sonra ilgili test dosyalarını çalıştır
- **Environment:** `.env` dosyasındaki değişkenlere dikkat et
- **TypeScript:** Tip güvenliğini koru, `any` kullanmaktan kaçın
- **Supabase:** RLS politikalarını dikkate al
- **i18n:** Çoklu dil desteğini unutma

## 🔒 Güvenlik

- Environment değişkenleri Git'e commit edilmez
- RLS politikaları aktif
- JWT token tabanlı authentication
- Input validation ve sanitization

---

**Not:** Bu proje aktif geliştirme aşamasında. Değişiklikler yapmadan önce mevcut kodu incele ve test et.