# WhiskyVerse Docker Deployment Guide

Bu rehber, WhiskyVerse uygulamasını başka bir bilgisayarda Docker kullanarak nasıl deploy edeceğinizi açıklar.

## 🚀 Hızlı Başlangıç

### 1. Sistem Gereksinimleri

**Minimum Gereksinimler:**
- CPU: 2 core
- RAM: 4 GB
- Disk: 20 GB boş alan
- İşletim Sistemi: Ubuntu 18.04+, Debian 9+, CentOS 7+, RHEL 7+, Fedora 30+

**Önerilen Gereksinimler:**
- CPU: 4 core
- RAM: 8 GB
- Disk: 50 GB SSD
- Ağ: En az 100 Mbps

### 2. Sunucu Hazırlama

Yeni bir sunucuda aşağıdaki komutu çalıştırın (root yetkisi gerekli):

```bash
# Sunucu kurulum scriptini çalıştır
sudo bash server-setup.sh
```

Bu script otomatik olarak:
- ✅ Docker ve Docker Compose kurar
- ✅ Güvenlik duvarını yapılandırır
- ✅ Fail2ban kurar
- ✅ Sistem optimizasyonları yapar
- ✅ Uygulama kullanıcısı oluşturur
- ✅ SSL sertifika araçlarını kurar

### 3. Deployment Dosyalarını Kopyalama

Deployment dosyalarını hedef sunucuya kopyalayın:

```bash
# Deployment klasörünü sunucuya kopyala
scp -r deploy/ kullanici@sunucu-ip:/home/whiskyverse/whiskyverse/

# Veya rsync kullanarak
rsync -avz --progress deploy/ kullanici@sunucu-ip:/home/whiskyverse/whiskyverse/
```

### 4. Environment Konfigürasyonu

Sunucuda environment dosyasını düzenleyin:

```bash
# Whiskyverse kullanıcısına geç
sudo su - whiskyverse

# Environment dosyasını kopyala ve düzenle
cd whiskyverse/deploy
cp .env.production.template .env.production
nano .env.production
```

**Zorunlu ayarlar:**
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
DOMAIN=yourdomain.com  # veya IP adresi
```

### 5. Deployment

Deployment scriptini çalıştırın:

```bash
# Temel deployment
./deploy.sh

# Veya profil seçerek
./deploy.sh production basic           # Sadece uygulama
./deploy.sh production full-stack      # Uygulama + Redis
./deploy.sh production monitoring      # Uygulama + Monitoring
./deploy.sh production all            # Tüm servisler
```

## 📋 Deployment Profilleri

### Basic (Varsayılan)
- WhiskyVerse uygulaması
- Nginx reverse proxy
- Temel güvenlik ayarları

### Full-Stack
- Tüm Basic özellikler
- Redis cache
- Gelişmiş performans

### Monitoring
- Tüm Basic özellikler
- Prometheus metrics
- Grafana dashboard

### All
- Tüm özellikler aktif
- Tam monitoring stack
- Redis cache

## 🔧 Konfigürasyon Seçenekleri

### Port Ayarları

```bash
# .env.production dosyasında
FRONTEND_PORT=3001          # Uygulama portu
REDIS_PORT=6379            # Redis portu
GRAFANA_PORT=3002          # Grafana portu
PROMETHEUS_PORT=9090       # Prometheus portu
```

### SSL Sertifikası (HTTPS)

Let's Encrypt ile ücretsiz SSL:

```bash
# SSL sertifikası oluştur
sudo certbot certonly --standalone -d yourdomain.com

# Nginx konfigürasyonunda HTTPS bölümünü aktifleştir
nano deploy/nginx/conf.d/default.conf
# HTTPS server bölümündeki # işaretlerini kaldır
```

### Domain Yapılandırması

```bash
# .env.production dosyasında
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com
```

## 🎯 Erişim Bilgileri

Deployment tamamlandıktan sonra:

**Ana uygulama:** `http://sunucu-ip:3001`

**Monitoring (eğer aktif):**
- Grafana: `http://sunucu-ip:3002` (admin/admin123)
- Prometheus: `http://sunucu-ip:9090`

## 🛠️ Yönetim Komutları

### Temel Komutlar

```bash
# Servisleri görüntüle
docker ps --filter name=whiskyverse

# Logları kontrol et
docker logs whiskyverse-frontend

# Servisi yeniden başlat
docker restart whiskyverse-frontend

# Tüm servisleri durdur
cd ~/whiskyverse/deploy
docker-compose -f docker-compose.production.yml down

# Servisleri yeniden başlat
docker-compose -f docker-compose.production.yml up -d
```

### Sistem Durumu

```bash
# Sistem kaynak kullanımı
htop

# Disk kullanımı
df -h

# Container durumu
docker stats

# Ağ durumu
docker network ls
```

### Log Yönetimi

```bash
# Nginx logları
docker logs whiskyverse-proxy

# Uygulama logları
docker logs whiskyverse-frontend

# Tüm servis loglarını takip et
docker-compose -f docker-compose.production.yml logs -f
```

## 🔍 Sorun Giderme

### Genel Sorunlar

**Problem:** Uygulama açılmıyor
```bash
# Çözüm: Container durumunu kontrol et
docker ps -a
docker logs whiskyverse-frontend

# Port kullanımını kontrol et
sudo netstat -tlnp | grep :3001
```

**Problem:** SSL sertifikası hatası
```bash
# Çözüm: Sertifikayı yenile
sudo certbot renew
docker restart whiskyverse-proxy
```

**Problem:** Yavaş performans
```bash
# Çözüm: Sistem kaynaklarını kontrol et
htop
docker stats

# Redis cache ekle
./deploy.sh production full-stack
```

### Log Dosyalarını İnceleme

```bash
# Nginx hata logları
docker exec whiskyverse-proxy cat /var/log/nginx/error.log

# Uygulama logları
docker exec whiskyverse-frontend cat /var/log/nginx/error.log

# Sistem logları
sudo journalctl -u docker.service
```

## 🔄 Güncelleme

Uygulamayı güncellemek için:

```bash
# Yeni deployment dosyalarını kopyala
scp -r deploy/ kullanici@sunucu-ip:/home/whiskyverse/whiskyverse/

# Sunucuda deployment scriptini çalıştır
cd ~/whiskyverse/deploy
./deploy.sh production [profil]
```

## 📊 İzleme ve Uyarılar

### Grafana Dashboard (Monitoring profili)

Grafana'ya erişim: `http://sunucu-ip:3002`
- Kullanıcı: `admin`
- Şifre: `admin123` (veya .env.production'da ayarladığınız)

### Sistem Uyarıları

```bash
# Disk alanı uyarısı
df -h | awk '$5 > 85 {print "Disk usage warning: " $0}'

# Memory kullanımı
free -h

# CPU kullanımı
top -bn1 | grep load
```

## 🔐 Güvenlik

### Güvenlik Duvarı Ayarları

```bash
# Ubuntu/Debian
sudo ufw status

# CentOS/RHEL
sudo firewall-cmd --list-all
```

### Fail2ban Durumu

```bash
# Fail2ban durumu
sudo fail2ban-client status

# Ban edilmiş IP'ler
sudo fail2ban-client status sshd
```

## 🆘 Destek

### Yararlı Komutlar

```bash
# Sistem bilgisi
uname -a
docker --version
docker-compose --version

# Ağ bağlantısı testi
curl -I http://localhost:3001/health

# Performance testi
ab -n 100 -c 10 http://localhost:3001/
```

### Log Toplama

Sorun bildirimi için gerekli logları topla:

```bash
# Log toplama scripti
mkdir -p ~/whiskyverse-logs
docker logs whiskyverse-frontend > ~/whiskyverse-logs/app.log 2>&1
docker logs whiskyverse-proxy > ~/whiskyverse-logs/nginx.log 2>&1
docker ps -a > ~/whiskyverse-logs/containers.log
docker images > ~/whiskyverse-logs/images.log

# Arşiv oluştur
tar -czf whiskyverse-logs-$(date +%Y%m%d-%H%M%S).tar.gz ~/whiskyverse-logs/
```

## 📈 Performans Optimizasyonu

### Sistem Ayarları

```bash
# Kernel parametrelerini kontrol et
sysctl net.core.somaxconn
sysctl fs.file-max

# Docker resource limitleri
docker update --memory="4g" --cpus="2" whiskyverse-frontend
```

### Cache Ayarları

Redis cache kullanımı için:

```bash
# Redis status kontrol
docker exec whiskyverse-redis redis-cli ping

# Cache istatistikleri
docker exec whiskyverse-redis redis-cli info stats
```

---

## 📞 İletişim

Sorunlar için:
- GitHub Issues: Repository issues bölümü
- Log dosyaları ile birlikte detaylı sorun açıklaması gönderin

**Deployment başarılı! 🎉**