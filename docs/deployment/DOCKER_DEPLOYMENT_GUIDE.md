# 🐳 WhiskyVerse Docker Deployment Rehberi

Bu rehber WhiskyVerse uygulamasını Docker ile farklı platformlarda deploy etmeniz için adım adım talimatlar içerir.

## 📋 İçerik

- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Environment Değişkenleri](#environment-değişkenleri)
- [Platform-Spesifik Deployment'lar](#platform-spesifik-deploymentlar)
- [SSL ve Domain Ayarları](#ssl-ve-domain-ayarları)
- [Monitoring ve Logging](#monitoring-ve-logging)
- [Troubleshooting](#troubleshooting)

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
```bash
- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM
- 10GB+ Disk alanı
```

### 2. Environment Dosyası Oluşturun
```bash
cp .env.example .env
nano .env
```

### 3. Temel Deployment
```bash
# Sadece frontend
docker-compose up -d whiskyverse-frontend

# Tüm servisler
docker-compose up -d

# Monitoring ile
docker-compose --profile monitoring up -d
```

## 🔧 Environment Değişkenleri

### Zorunlu Değişkenler
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Application
NODE_ENV=production
API_URL=https://yourdomain.com
```

### Opsiyonel Değişkenler
```env
# Database (Local PostgreSQL için)
POSTGRES_DB=whiskyverse
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password

# Monitoring
GRAFANA_PASSWORD=admin-password
N8N_PASSWORD=n8n-password

# Redis
REDIS_PASSWORD=redis-password

# SSL
SSL_EMAIL=your@email.com
DOMAIN=yourdomain.com
```

## 🌍 Platform-Spesifik Deployment'lar

### 🏠 Lokal Deployment

#### Basit Setup (Sadece Frontend)
```bash
# Build ve run
docker build -t whiskyverse-app .
docker run -p 3001:80 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  whiskyverse-app
```

#### Full Stack (Database ile)
```bash
# Full stack deployment
docker-compose up -d
```

Erişim adresleri:
- Frontend: http://localhost:3001
- N8N: http://localhost:5678
- Grafana: http://localhost:3002

### ☁️ Docker Hub

#### 1. Image Build ve Push
```bash
# Build
docker build -t yourusername/whiskyverse:latest .
docker build -t yourusername/whiskyverse:v1.0.0 .

# Push to Docker Hub
docker login
docker push yourusername/whiskyverse:latest
docker push yourusername/whiskyverse:v1.0.0
```

#### 2. Docker Hub'dan Deploy
```bash
# Pull ve run
docker pull yourusername/whiskyverse:latest
docker run -p 80:80 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  yourusername/whiskyverse:latest
```

### 🏢 DigitalOcean App Platform

#### 1. App Spec Dosyası (.do/app.yaml)
```yaml
name: whiskyverse-app
region: fra
services:
- name: frontend
  source_dir: /
  github:
    repo: your-username/whisky-community
    branch: main
  run_command: nginx -g "daemon off;"
  environment_slug: docker
  instance_count: 1
  instance_size_slug: basic-xxs
  dockerfile_path: Dockerfile
  http_port: 80
  envs:
  - key: SUPABASE_URL
    value: YOUR_SUPABASE_URL
  - key: SUPABASE_ANON_KEY
    value: YOUR_SUPABASE_KEY
  - key: NODE_ENV
    value: production
```

#### 2. Deploy Komutları
```bash
# DigitalOcean CLI ile
doctl apps create --spec .do/app.yaml

# Ya da manuel olarak:
# 1. DigitalOcean Dashboard > Apps > Create App
# 2. GitHub repo'yu seç
# 3. Dockerfile'ı seç
# 4. Environment variable'ları ekle
# 5. Deploy'a tıkla
```

### 🏗️ Railway

#### 1. railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "nginx -g 'daemon off;'",
    "healthcheckPath": "/health"
  }
}
```

#### 2. Deploy
```bash
# Railway CLI
railway login
railway link your-project-id
railway up

# Environment variables Railway'de manuel set edilmeli:
# SUPABASE_URL
# SUPABASE_ANON_KEY
```

### ☁️ AWS (ECS/Fargate)

#### 1. Task Definition (task-definition.json)
```json
{
  "family": "whiskyverse-task",
  "networkMode": "awsvpc",
  "requiresAttributes": [
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.18"
    }
  ],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "whiskyverse-container",
      "image": "yourusername/whiskyverse:latest",
      "cpu": 256,
      "memory": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SUPABASE_URL",
          "value": "YOUR_SUPABASE_URL"
        },
        {
          "name": "SUPABASE_ANON_KEY",
          "value": "YOUR_SUPABASE_KEY"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/whiskyverse",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 2. Deploy Script (scripts/deploy-aws.sh)
```bash
#!/bin/bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URI

# Build ve tag
docker build -t whiskyverse .
docker tag whiskyverse:latest YOUR_ECR_URI/whiskyverse:latest

# Push
docker push YOUR_ECR_URI/whiskyverse:latest

# Update ECS service
aws ecs update-service --cluster whiskyverse-cluster --service whiskyverse-service --force-new-deployment
```

### 🌐 Google Cloud Run

#### 1. cloudbuild.yaml
```yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/whiskyverse:$COMMIT_SHA', '.']
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'gcr.io/$PROJECT_ID/whiskyverse:$COMMIT_SHA']
- name: 'gcr.io/cloud-builders/gcloud'
  args:
  - 'run'
  - 'deploy'
  - 'whiskyverse'
  - '--image'
  - 'gcr.io/$PROJECT_ID/whiskyverse:$COMMIT_SHA'
  - '--region'
  - 'europe-west1'
  - '--platform'
  - 'managed'
  - '--set-env-vars'
  - 'SUPABASE_URL=YOUR_SUPABASE_URL,SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY'
```

#### 2. Deploy Komutları
```bash
# Build ve deploy
gcloud builds submit --config cloudbuild.yaml

# Direkt deploy
gcloud run deploy whiskyverse \
  --image gcr.io/PROJECT_ID/whiskyverse:latest \
  --region europe-west1 \
  --platform managed \
  --set-env-vars SUPABASE_URL=YOUR_URL,SUPABASE_ANON_KEY=YOUR_KEY \
  --allow-unauthenticated
```

### 🔷 Azure Container Instances

#### 1. Deploy Script
```bash
# Resource group oluştur
az group create --name whiskyverse-rg --location "West Europe"

# Container deploy et
az container create \
  --resource-group whiskyverse-rg \
  --name whiskyverse-container \
  --image yourusername/whiskyverse:latest \
  --dns-name-label whiskyverse-unique \
  --ports 80 \
  --environment-variables \
    SUPABASE_URL='YOUR_SUPABASE_URL' \
    SUPABASE_ANON_KEY='YOUR_SUPABASE_KEY' \
  --cpu 1 \
  --memory 1
```

### 🏭 Heroku

#### 1. heroku.yml
```yaml
build:
  docker:
    web: Dockerfile
run:
  web: nginx -g "daemon off;"
```

#### 2. Deploy
```bash
# Heroku app oluştur
heroku create whiskyverse-app

# Container stack kullan
heroku stack:set container -a whiskyverse-app

# Environment variables
heroku config:set SUPABASE_URL=your-url -a whiskyverse-app
heroku config:set SUPABASE_ANON_KEY=your-key -a whiskyverse-app

# Deploy
git push heroku main
```

## 🔐 SSL ve Domain Ayarları

### Let's Encrypt ile SSL
```yaml
# docker-compose-ssl.yml'ye ekle
  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: certonly --webroot -w /var/www/certbot --force-renewal --email your@email.com -d yourdomain.com --agree-tos
```

### Nginx SSL Configuration
```nginx
# docker/nginx-ssl.conf
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://whiskyverse-frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring ve Logging

### Prometheus Metrics
```yaml
# Monitoring profile ile çalıştır
docker-compose --profile monitoring up -d
```

### Grafana Dashboard
- URL: http://localhost:3002
- User: admin
- Pass: Environment'taki GRAFANA_PASSWORD

### Loki Logging
```yaml
# docker-compose-logging.yml ekle
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - whiskyverse-network
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Hatası
```bash
# Cache'siz build
docker build --no-cache -t whiskyverse .

# Build logs
docker-compose build --no-cache --progress=plain
```

#### 2. Environment Variables
```bash
# Container içindeki env'leri kontrol et
docker exec -it container_name env

# Config'i test et
docker run --rm whiskyverse-app printenv
```

#### 3. Network Issues
```bash
# Network'leri kontrol et
docker network ls
docker network inspect whiskyverse_whiskyverse-network

# Container'lar arası iletişim test et
docker exec -it container1 ping container2
```

#### 4. Health Check
```bash
# Health status kontrol et
docker ps
docker inspect container_name | grep -A 20 Health

# Manual health check
curl http://localhost:3001/health
```

#### 5. Logs
```bash
# Container logs
docker logs container_name -f

# Docker Compose logs
docker-compose logs -f

# Specific service logs
docker-compose logs nginx-proxy
```

### Performance Optimization

#### 1. Multi-stage Build Optimization
```dockerfile
# .dockerignore dosyası ekle
node_modules
.git
.env.local
*.md
.next
```

#### 2. Resource Limits
```yaml
services:
  whiskyverse-frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 🔄 CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy WhiskyVerse

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to DockerHub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v3
      with:
        push: true
        tags: yourusername/whiskyverse:latest
    
    - name: Deploy to production
      run: |
        # Your deployment script here
```

Bu rehber ile WhiskyVerse uygulamanızı herhangi bir Docker destekli platformda deploy edebilirsiniz! 🚀