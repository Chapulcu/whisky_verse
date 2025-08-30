# 🚀 WhiskyVerse Hızlı Deployment

Bu dosya WhiskyVerse uygulamasını en hızlı şekilde deploy etmeniz için kısa talimatlar içerir.

## 📋 Önkoşullar

- Docker 20.10+ kurulu
- 2GB+ RAM
- Environment değişkenleri ayarlanmış

## ⚡ 30 Saniyede Deploy

### 1. Environment Ayarları
```bash
cp .env.example .env
nano .env  # Supabase bilgilerinizi girin
```

### 2. Hızlı Deploy
```bash
# Otomatik script ile
./scripts/deploy-quick.sh quick

# Manuel olarak
docker build -t whiskyverse .
docker run -p 3001:80 --env-file .env whiskyverse
```

### 3. Erişim
```
http://localhost:3001
```

## 🌐 Platform-Spesifik Deploy

### 🚂 Railway
```bash
railway login
railway link
railway up
```

### 🟦 Heroku
```bash
heroku create your-app-name
heroku stack:set container
git push heroku main
```

### 🌊 DigitalOcean
```bash
doctl apps create --spec .do/app.yaml
```

### ☁️ Google Cloud
```bash
gcloud builds submit --config cloudbuild.yaml
```

### 🏢 Docker Hub
```bash
docker build -t username/whiskyverse .
docker push username/whiskyverse
```

## 🔧 Environment Değişkenleri

### Zorunlu
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Opsiyonel
```env
NODE_ENV=production
DOMAIN=yourdomain.com
```

## 📱 Test

```bash
curl http://localhost:3001/health
```

## 🆘 Hızlı Troubleshooting

### Port kullanımda
```bash
lsof -ti:3001 | xargs kill -9
```

### Container logs
```bash
docker logs whiskyverse-app
```

### Yeniden başlat
```bash
docker restart whiskyverse-app
```

## 📞 Destek

Sorun yaşıyorsanız `DOCKER_DEPLOYMENT_GUIDE.md` dosyasında detaylı rehber bulabilirsiniz.

---
⚡ **Hızlı Deploy:** `./scripts/deploy-quick.sh quick`