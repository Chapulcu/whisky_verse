# 🚀 Supabase Self-Hosted Kurulumu

## 📋 Gereksinimler
- Docker & Docker Compose
- En az 4GB RAM
- 10GB+ disk alanı

## 🛠️ Kurulum Adımları

### 1. Supabase CLI Kur (İsteğe bağlı)
```bash
brew install supabase/tap/supabase
```

### 2. Official Supabase Repo İndir
```bash
# Yeni klasör oluştur
mkdir supabase-local && cd supabase-local

# Official Supabase docker setup'ını indir
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Env dosyasını kopyala
cp .env.example .env
```

### 3. Environment Variables Ayarla
`.env` dosyasını düzenle:
```bash
# Bu değerleri değiştir:
POSTGRES_PASSWORD=your-super-secret-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters
SITE_URL=http://localhost:3000
```

### 4. Supabase'i Başlat
```bash
# Tüm servisleri başlat
docker compose up -d

# Logları takip et
docker compose logs -f
```

### 5. İlk Kurulum Kontrolü
- **Supabase Studio**: http://localhost:3000
- **API**: http://localhost:8000
- **Database**: localhost:5432

## 🔧 Mevcut Projenizi Bağlama

### 1. Supabase Config Güncelle
`src/lib/supabase.ts` dosyasını güncelle:

```typescript
const supabaseUrl = 'http://localhost:8000'
const supabaseAnonKey = 'your-anon-key-from-env'
```

### 2. Database Schema Oluştur
Supabase Studio'da (http://localhost:3000):

1. SQL Editor'ı aç
2. Mevcut schema dosyalarınızı çalıştır:
   - `database/multilingual-schema.sql`
   - `database/init.sql`

### 3. Auth Kullanıcısı Oluştur
```sql
-- Admin kullanıcı oluştur
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'admin-user-id',
  'akhantalip@gmail.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Profile oluştur
INSERT INTO public.profiles (id, email, full_name, role, language)
VALUES (
  'admin-user-id',
  'akhantalip@gmail.com',
  'Admin User',
  'admin',
  'tr'
);
```

## 🚀 Production İçin

### 1. SSL Sertifikası
Nginx reverse proxy ile SSL ekle

### 2. Güvenlik Ayarları
- Strong passwords
- Firewall rules
- Regular backups

### 3. Performance Tuning
- PostgreSQL tuning
- Resource limits

## 🐳 Docker Commands

```bash
# Servisleri başlat
docker compose up -d

# Servisleri durdur
docker compose down

# Logları görüntüle
docker compose logs -f

# Database backup
docker compose exec db pg_dump -U postgres postgres > backup.sql

# Database restore
docker compose exec -T db psql -U postgres postgres < backup.sql

# Volume temizle (DİKKAT: Tüm data silinir)
docker compose down -v
```

## 📊 Monitoring

### Healthcheck
```bash
curl http://localhost:8000/rest/v1/
```

### Database Connection
```bash
docker compose exec db psql -U postgres
```

## 🔄 Mevcut Hybrid Auth'dan Geçiş

Hybrid auth sistemimiz otomatik olarak local Supabase'i algılayacak:

1. Local Supabase'i başlat
2. Config'i güncelle 
3. Uygulamayı yeniden başlat
4. Console'da "🌐 Using real Supabase authentication" mesajını gör

## 📝 Notlar

- **Development**: http://localhost:8000
- **Production**: HTTPS kullan
- **Backup**: Regular PostgreSQL backups
- **Updates**: `docker compose pull && docker compose up -d`

Your local Supabase is now ready! 🎉