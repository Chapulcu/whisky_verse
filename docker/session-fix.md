# Docker Session Sorunları ve Çözümler

## 🔧 Yapılan Düzeltmeler

### 1. Supabase Client Konfigürasyonu
- `detectSessionInUrl: false` - Docker environment için URL detection kapatıldı
- `storageKey: 'whiskyverse-supabase-auth'` - Özel storage key tanımlandı
- `flowType: 'pkce'` - Güvenlik için PKCE flow eklendi
- Rate limiting eklendi (eventsPerSecond: 2)

### 2. Auth Context İyileştirmeleri
- Production için retry logic eklendi (2 saniye delay)
- Session recovery için daha robust error handling
- Docker environment için özel timeout değerleri

### 3. Nginx Konfigürasyonu
- CSP header'da Supabase domain'leri eklendi
- Session persistence için ek security header'lar
- Health check endpoint iyileştirildi

### 4. Environment Variables
- `.env.docker.example` dosyası eklendi
- Production build için environment validation

## 🚀 Deploy Komutları

### 1. Environment Dosyasını Hazırla
```bash
cp .env.docker.example .env.production
# .env.production dosyasını Supabase bilgilerinle düzenle
```

### 2. Docker Build ve Deploy
```bash
# Environment variables ile build
docker-compose --env-file .env.production up -d --build

# Veya direct build
docker build \
  --build-arg VITE_SUPABASE_URL="your-url" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-key" \
  -t whiskyverse .

docker run -p 3001:80 whiskyverse
```

### 3. Health Check
```bash
# Container durumunu kontrol et
docker ps
docker logs whiskyverse-frontend

# Health endpoint'i test et
curl http://localhost:3001/health
```

## 🔍 Troubleshooting

### Session Kaybolma Problemleri
1. **Browser Storage**: F12 > Application > Local Storage'da `whiskyverse-supabase-auth` key'ini kontrol et
2. **Network**: F12 > Network'de Supabase API çağrılarını kontrol et
3. **Console Logs**: Auth state change log'larını takip et

### Environment Variables
```bash
# Container içinde env kontrol
docker exec -it whiskyverse-frontend env | grep VITE

# Nginx config kontrol
docker exec -it whiskyverse-frontend cat /etc/nginx/conf.d/default.conf
```

### Supabase Bağlantı Testi
```javascript
// Browser console'da test
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
await supabase.auth.getSession()
```

## ⚠️ Önemli Notlar

1. **CORS**: Supabase dashboard'da production URL'ini authorized domains'e ekle
2. **JWT Expiry**: Supabase > Authentication > Settings'de JWT expiry time'ı kontrol et
3. **Site URL**: Supabase'de site URL'ini production domain ile güncelle
4. **SSL**: Production'da HTTPS kullan (Let's Encrypt önerilir)

## 🔄 Production Deploy Checklist

- [ ] `.env.production` dosyası hazırlandı
- [ ] Supabase URL ve keys production için güncellendi
- [ ] Site URL Supabase'de production domain ile güncellendi
- [ ] CORS authorized domains eklendi
- [ ] JWT expiry time ayarlandı (önerilen: 3600 seconds)
- [ ] Docker containers sağlıklı çalışıyor
- [ ] Health check endpoint aktif
- [ ] SSL sertifikası kuruldu (production için)