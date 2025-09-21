# 🥃 WhiskyVerse - Whisky Community Platform

WhiskyVerse, viski severler için geliştirilmiş modern bir topluluk platformudur. Kullanıcılar viski koleksiyonlarını yönetebilir, deneyimlerini paylaşabilir ve diğer viski meraklıları ile etkileşime geçebilir.

![WhiskyVerse](https://img.shields.io/badge/WhiskyVerse-Community%20Platform-amber)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Özellikler

### 🔐 Kullanıcı Yönetimi
- Güvenli kullanıcı kaydı ve girişi
- Profil yönetimi ve özelleştirme
- Rol tabanlı yetki sistemi (Admin/User)

### 🥃 Viski Yönetimi
- Kapsamlı viski veritabanı
- Kişisel viski koleksiyonu oluşturma
- Viski puanlama ve değerlendirme sistemi
- Detaylı viski bilgileri (yaş, alkol oranı, bölge, vb.)

### 💬 Sosyal Özellikler
- Viski incelemelerini paylaşma
- Topluluk ile etkileşim
- Favori viskiler listesi
- Kullanıcı yorumları ve puanlamaları

### 🌍 Çoklu Dil Desteği
- Türkçe ve İngilizce dil seçenekleri
- Otomatik dil algılama
- Kolay dil değiştirme

### 📱 Responsive Tasarım
- Mobil, tablet ve masaüstü uyumlu
- Modern ve kullanıcı dostu arayüz
- Dark/Light mod desteği
- Smooth animasyonlar (Framer Motion)

## 🛠️ Teknoloji Stack

### Frontend
- **React 18.3.1** - Modern UI kütüphanesi
- **TypeScript 5.6.2** - Tip güvenli JavaScript
- **Vite 6.0.1** - Hızlı geliştirme ortamı
- **Tailwind CSS 3.4.16** - Utility-first CSS framework
- **Framer Motion 12.23.12** - Animasyon kütüphanesi
- **React Router DOM 6.28.0** - Client-side routing
- **Lucide React** - Modern iconlar

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - İlişkisel veritabanı
- **Row Level Security (RLS)** - Güvenlik katmanı
- **Real-time subscriptions** - Canlı veri güncellemeleri

### Geliştirme Araçları
- **ESLint 9.15.0** - Kod kalitesi kontrolü
- **Autoprefixer** - CSS vendor prefix otomasyonu
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

### İsteğe Bağlı Entegrasyonlar
- **Stripe** - Ödeme sistemi
- **i18next** - Uluslararasılaştırma
- **React Hot Toast** - Bildirim sistemi

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Docker & Docker Compose (production için)

### Lokal Geliştirme

1. **Repository'yi klonlayın:**
```bash
git clone https://github.com/yourusername/whisky-community.git
cd whisky-community
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment dosyasını yapılandırın:**
```bash
cp .env.example .env
# .env dosyasını Supabase bilgilerinizle düzenleyin
```

4. **Uygulamayı başlatın:**
```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışacaktır.

### Docker ile Çalıştırma

1. **Production build:**
```bash
docker build -t whiskyverse .
docker run -p 3001:80 whiskyverse
```

2. **Docker Compose ile:**
```bash
docker-compose up -d
```

## 📚 Dokümantasyon

Detaylı dokümantasyon için [docs/](docs/) klasörüne göz atın:

### 🔧 Kurulum Rehberleri
- [Supabase Kurulumu](docs/setup/SUPABASE_SETUP.md) - Veritabanı yapılandırması
- [Çoklu Dil Kurulumu](docs/setup/MULTILINGUAL_SETUP.md) - i18n yapılandırması

### 🚀 Deployment Rehberleri
- [Docker Deployment](docs/deployment/DOCKER_DEPLOYMENT.md) - Detaylı deployment rehberi
- [Hızlı Deployment](docs/deployment/QUICK_DEPLOY.md) - Hızlı başlangıç
- [Production Guide](docs/deployment/DOCKER_DEPLOYMENT_GUIDE.md) - Production yapılandırması

### 💻 Geliştirme
- [Lokal Geliştirme](docs/development/LOCAL_SETUP_STATUS.md) - Development environment
- [Veritabanı Komutları](docs/development/database-commands.md) - DB yönetimi

### 🔧 Sorun Giderme
- [Authentication Sorunları](docs/troubleshooting/DEBUG_AUTH.md) - Auth troubleshooting
- [Supabase Düzeltmeleri](docs/troubleshooting/SUPABASE_FIXES.md) - Yaygın sorunlar

## 🛡️ Güvenlik

- Row Level Security (RLS) politikaları
- JWT token tabanlı authentication
- Güvenli environment variable yönetimi
- HTTPS desteği (production)
- Input validation ve sanitization

## 📈 Performance

- Vite ile hızlı geliştirme
- Code splitting ve lazy loading
- Optimized production builds
- Redis cache desteği (opsiyonel)
- CDN-ready static assets

## 🧪 Testing

Test dosyalarını çalıştırmak için:

```bash
# Bağlantı testi
node tests/test_connection.js

# Supabase entegrasyon testi
node tests/test-supabase.js

# Tüm testler için tests/ klasörüne bakın
```

## 📁 Proje Yapısı

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

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje özel lisans altında dağıtılmaktadır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

**Talip Akhan**
- 📧 Email: akhantalip@gmail.com
- 💼 LinkedIn: [linkedin.com/in/talipakhan]([https://linkedin.com/in/talipakhan](https://www.linkedin.com/in/talip-akhan-48491515/))
- 🐙 GitHub: [@talipakhan](https://github.com/Chapulcu)

---

## 🆘 Destek

Herhangi bir sorun yaşarsanız:

1. [Issues](https://github.com/yourusername/whisky-community/issues) sayfasında arayın
2. Yeni issue oluşturun
3. Detaylı açıklama ve log dosyaları ekleyin
4. Email ile iletişime geçin: akhantalip@gmail.com

## 🎯 Roadmap

- [ ] Mobil uygulama (React Native)
- [ ] Advanced filtering ve search
- [ ] Social media entegrasyonu
- [ ] Whisky recommendation engine
- [ ] Event ve meetup sistemi
- [ ] Marketplace özelliği

---

<div align="center">

**🥃 WhiskyVerse ile viski dünyasını keşfedin! 🥃**

Made with ❤️ by Talip Akhan

</div>
