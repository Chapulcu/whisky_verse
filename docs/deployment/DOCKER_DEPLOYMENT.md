# 🐳 WhiskyVerse Docker Deployment Guide

## 📋 Genel Bakış

Bu rehber WhiskyVerse uygulamasını Docker kullanarak lokalde deploy etmeniz için hazırlanmıştır.

---

## 🚀 Hızlı Başlangıç

### 1️⃣ Ön Gereksinimler
```bash
# Docker ve Docker Compose versiyonlarını kontrol edin
docker --version          # >= 20.10
docker-compose --version  # >= 1.29
```

### 2️⃣ Environment Variables Ayarlama
```bash
# .env dosyası oluşturun
cp .env.example .env

# Gerekli değişkenleri düzenleyin
nano .env
```

**Örnek `.env` dosyası:**
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Database
POSTGRES_PASSWORD=secure-postgres-password
REDIS_PASSWORD=secure-redis-password

# N8N
N8N_PASSWORD=secure-n8n-password

# Monitoring (Optional)
GRAFANA_PASSWORD=admin123
```

### 3️⃣ Production Deployment
```bash
# Build ve run
docker-compose up -d

# Logları takip et
docker-compose logs -f whiskyverse-frontend
```

### 4️⃣ Development Deployment
```bash
# Development ortamı
docker-compose -f docker-compose.dev.yml up -d

# Hot reload ile geliştirme
docker-compose -f docker-compose.dev.yml logs -f whiskyverse-dev
```

---

## 🌐 Erişim URL'leri

| Servis | URL | Açıklama |
|--------|-----|----------|
| **WhiskyVerse App** | http://localhost:3000 | Ana uygulama |
| **N8N Automation** | http://localhost:5678 | Workflow otomasyonu |
| **PostgreSQL** | localhost:5432 | Database |
| **Redis** | localhost:6379 | Cache |
| **Adminer** (dev) | http://localhost:8080 | DB admin panel |
| **Grafana** | http://localhost:3001 | Monitoring dashboard |
| **Prometheus** | http://localhost:9090 | Metrics |

---

## 🔧 Konfigürasyon Seçenekleri

### Profil Tabanlı Deployment
```bash
# Sadece core servisler
docker-compose up -d whiskyverse-frontend postgres redis

# Monitoring ile
docker-compose --profile monitoring up -d

# Proxy ile
docker-compose --profile proxy up -d

# Tüm servisler
docker-compose --profile monitoring --profile proxy up -d
```

### Resource Limits
```yaml
# docker-compose.override.yml oluşturun
version: '3.8'
services:
  whiskyverse-frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M
```

---

## 📊 Monitoring ve Logging

### Log Management
```bash
# Tüm servislerin logları
docker-compose logs -f

# Belirli servisin logları
docker-compose logs -f whiskyverse-frontend

# Son 100 satır
docker-compose logs --tail=100 -f

# Log rotation
docker-compose logs --since="2h" -f
```

### Health Checks
```bash
# Servis durumları
docker-compose ps

# Health check durumu
docker inspect whiskyverse-frontend | jq '.[0].State.Health'

# Container stats
docker stats whiskyverse-frontend
```

### Prometheus Metrics
- CPU, Memory, Network kullanımı
- HTTP request metrics
- Database connection pool
- Custom application metrics

---

## 🔒 Güvenlik Konfigürasyonu

### SSL/TLS Setup (Production)
```bash
# SSL sertifikası oluştur (self-signed)
mkdir -p docker/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/nginx.key \
  -out docker/ssl/nginx.crt

# Let's Encrypt için
docker run --rm -v $PWD/docker/ssl:/etc/letsencrypt/live/whiskyverse.local \
  certbot/certbot certonly --standalone -d whiskyverse.local
```

### Firewall Rules
```bash
# UFW ile port açma
sudo ufw allow 3000/tcp  # WhiskyVerse
sudo ufw allow 5678/tcp  # N8N (optional)
sudo ufw allow 22/tcp    # SSH
```

### Environment Security
```bash
# Secrets management
docker secret create postgres_password postgres_pass.txt
docker secret create supabase_key supabase_key.txt

# .env dosyasını güvenli hale getir
chmod 600 .env
```

---

## 🗄️ Database Management

### Backup & Restore
```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U postgres whiskyverse > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres whiskyverse < backup.sql

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres whiskyverse | gzip > "backup_${DATE}.sql.gz"
find . -name "backup_*.sql.gz" -mtime +7 -delete
EOF
chmod +x backup.sh
```

### Schema Updates
```bash
# Migration script çalıştır
docker-compose exec postgres psql -U postgres whiskyverse -f /migrations/001_add_features.sql

# Database reset (development)
docker-compose down -v postgres-dev
docker-compose up -d postgres-dev
```

---

## ⚡ Performance Tuning

### Resource Optimization
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  postgres:
    environment:
      - POSTGRES_SHARED_BUFFERS=256MB
      - POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
      - POSTGRES_MAINTENANCE_WORK_MEM=64MB
    
  redis:
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Nginx Optimization
```nginx
# docker/nginx.conf içinde
worker_processes auto;
worker_connections 1024;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Port kullanımını kontrol et
sudo netstat -tlnp | grep :3000

# Port değiştir
sed -i 's/3000:80/3001:80/g' docker-compose.yml
```

#### 2. Permission Denied
```bash
# Docker grup ekle
sudo usermod -aG docker $USER
newgrp docker

# Volume permissions
sudo chown -R $USER:$USER ./data
```

#### 3. Memory Issues
```bash
# Memory kullanımı kontrol et
docker system df
docker system prune -a

# Memory limit artır
docker-compose down
docker system prune -a
docker-compose up -d
```

#### 4. Database Connection Failed
```bash
# PostgreSQL logları kontrol et
docker-compose logs postgres

# Connection test
docker-compose exec whiskyverse-frontend wget -qO- http://postgres:5432 || echo "Connection failed"
```

#### 5. Build Failures
```bash
# Cache temizle
docker builder prune -a

# Force rebuild
docker-compose build --no-cache whiskyverse-frontend
docker-compose up -d whiskyverse-frontend
```

### Debug Mode
```bash
# Debug mode ile çalıştır
COMPOSE_LOG_LEVEL=DEBUG docker-compose up -d

# Container içine gir
docker-compose exec whiskyverse-frontend sh

# Network debug
docker network inspect whiskyverse-community_whiskyverse-network
```

---

## 🚀 Production Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Log rotation enabled
- [ ] Firewall rules applied
- [ ] Resource limits set
- [ ] Health checks working

### Auto-deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying WhiskyVerse..."

# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build --no-cache

# Run database migrations
docker-compose run --rm whiskyverse-frontend npm run migrate

# Deploy with zero downtime
docker-compose up -d --remove-orphans

# Health check
sleep 30
curl -f http://localhost:3000/health || exit 1

echo "✅ Deployment successful!"
```

---

## 🔄 Updates & Maintenance

### Update Process
```bash
# 1. Backup
./backup.sh

# 2. Pull updates
git pull origin main

# 3. Rebuild
docker-compose build --no-cache

# 4. Deploy
docker-compose up -d

# 5. Verify
docker-compose ps
curl -f http://localhost:3000/health
```

### Maintenance Tasks
```bash
# Weekly maintenance script
cat > maintenance.sh << 'EOF'
#!/bin/bash

echo "🧹 Running maintenance tasks..."

# Clean unused Docker resources
docker system prune -f

# Update images
docker-compose pull

# Restart services
docker-compose restart

# Health check
docker-compose ps

echo "✅ Maintenance completed!"
EOF

chmod +x maintenance.sh

# Cron job ekle
echo "0 2 * * 0 /path/to/maintenance.sh" | crontab -
```

---

## 📞 Destek ve Sorun Giderme

### Log Analysis
```bash
# Error logs
docker-compose logs | grep ERROR

# Performance logs
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Disk usage
docker system df
```

### Support Channels
- 📖 Documentation: `/docs` klasörü
- 🐛 Bug Reports: GitHub Issues
- 💬 Community: Discord/Telegram
- 📧 Email Support: support@whiskyverse.com

---

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)
- [N8N Documentation](https://docs.n8n.io/)
- [Prometheus Monitoring](https://prometheus.io/docs/)

---

**🎉 Happy Deploying! WhiskyVerse Docker kurulumunuz hazır!**